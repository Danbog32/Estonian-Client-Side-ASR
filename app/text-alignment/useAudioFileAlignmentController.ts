"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlignmentState, ReferenceWord } from "./alignment";
import { alignTranscriptToReference, INITIAL_ALIGNMENT_STATE } from "./alignment";
import type { AsrEventPayload, TranscriptBlock, TranscriptUpdateDetail } from "./types";

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_DURATION_MS = 100;
const CHUNK_SIZE = Math.max(1, Math.round((TARGET_SAMPLE_RATE * CHUNK_DURATION_MS) / 1000));

type FileControllerStatus =
  | "idle"
  | "decoding"
  | "ready"
  | "playing"
  | "paused"
  | "error";

interface TranscriptAccumulator {
  completedBlocks: Array<{ id: string; text: string }>;
  activeUtteranceId: string | null;
  activeText: string;
}

interface FileModeState {
  status: FileControllerStatus;
  fileName: string;
  objectUrl: string;
  errorMessage: string;
  durationSec: number;
  currentTimeSec: number;
  isReady: boolean;
}

interface UseAudioFileAlignmentControllerArgs {
  referenceWords: ReferenceWord[];
}

interface WorkerPartialFinalMessage {
  type: "partial" | "final";
  utteranceId?: string | null;
  text?: string;
  sourceType?: "microphone" | "file";
  sourceTimeSec?: number | null;
  sourceDurationSec?: number | null;
}

type WorkerMessage = WorkerPartialFinalMessage | { type: string };

const EMPTY_DETAIL: TranscriptUpdateDetail = {
  blocks: [],
  completedText: "",
  activeText: "",
  combinedText: "",
  activeUtteranceId: null,
  asr: {
    type: "idle",
    utteranceId: null,
    partialText: "",
    finalText: "",
    normalizedText: "",
    isFinal: false,
    sequence: 0,
    timestamp: null,
    tokenTimestamps: null,
    wordTimestamps: null,
    sourceType: "file",
    sourceTimeSec: 0,
    sourceDurationSec: 0,
  },
  sourceType: "file",
  sourceTimeSec: 0,
  sourceDurationSec: 0,
};

function getCombinedText(blocks: TranscriptBlock[]): string {
  return blocks
    .map((block) => `${block.text}${block.previewSuffix ?? ""}`.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildDetailFromAccumulator(
  accumulator: TranscriptAccumulator,
  message: WorkerPartialFinalMessage,
): TranscriptUpdateDetail {
  const blocks: TranscriptBlock[] = accumulator.completedBlocks.map((block) => ({
    text: block.text,
    previewSuffix: "",
  }));

  if (accumulator.activeText) {
    blocks.push({
      text: accumulator.activeText,
      previewSuffix: "",
    });
  }

  const completedText = accumulator.completedBlocks.map((block) => block.text).join(" ").trim();
  const combinedText = getCombinedText(blocks);
  const normalizedText = message.text?.trim() ?? "";
  const asrType = message.type;

  return {
    blocks,
    completedText,
    activeText: accumulator.activeText,
    combinedText,
    activeUtteranceId: accumulator.activeUtteranceId,
    asr: {
      type: asrType,
      utteranceId: message.utteranceId ?? accumulator.activeUtteranceId ?? null,
      partialText: asrType === "partial" ? normalizedText : "",
      finalText: asrType === "final" ? normalizedText : "",
      normalizedText,
      isFinal: asrType === "final",
      timestamp: new Date().toISOString(),
      sourceType: "file",
      sourceTimeSec: message.sourceTimeSec ?? 0,
      sourceDurationSec: message.sourceDurationSec ?? 0,
    },
    sourceType: "file",
    sourceTimeSec: message.sourceTimeSec ?? 0,
    sourceDurationSec: message.sourceDurationSec ?? 0,
  };
}

function applyMessageToAccumulator(
  accumulator: TranscriptAccumulator,
  message: WorkerPartialFinalMessage,
): TranscriptAccumulator {
  const utteranceId = message.utteranceId ?? accumulator.activeUtteranceId ?? "file-current";
  const text = (message.text ?? "").trim();

  if (message.type === "partial") {
    return {
      ...accumulator,
      activeUtteranceId: utteranceId,
      activeText: text,
    };
  }

  const nextCompletedBlocks = accumulator.completedBlocks.slice();
  if (text) {
    const existingIndex = nextCompletedBlocks.findIndex((block) => block.id === utteranceId);
    const nextBlock = { id: utteranceId, text };
    if (existingIndex >= 0) {
      nextCompletedBlocks[existingIndex] = nextBlock;
    } else {
      nextCompletedBlocks.push(nextBlock);
    }
  }

  return {
    completedBlocks: nextCompletedBlocks,
    activeUtteranceId: null,
    activeText: "",
  };
}

function mixDownToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return new Float32Array(buffer.getChannelData(0));
  }

  const mono = new Float32Array(buffer.length);
  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const channel = buffer.getChannelData(channelIndex);
    for (let sampleIndex = 0; sampleIndex < channel.length; sampleIndex += 1) {
      mono[sampleIndex] += channel[sampleIndex];
    }
  }

  for (let sampleIndex = 0; sampleIndex < mono.length; sampleIndex += 1) {
    mono[sampleIndex] /= buffer.numberOfChannels;
  }

  return mono;
}

function resampleTo16k(samples: Float32Array, sourceSampleRate: number): Float32Array {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) {
    return samples;
  }

  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const newLength = Math.max(1, Math.floor(samples.length / ratio));
  const result = new Float32Array(newLength);

  let offsetBuffer = 0;
  for (let index = 0; index < newLength; index += 1) {
    const nextOffsetBuffer = Math.round((index + 1) * ratio);
    let sum = 0;
    let count = 0;

    for (
      let sampleIndex = offsetBuffer;
      sampleIndex < nextOffsetBuffer && sampleIndex < samples.length;
      sampleIndex += 1
    ) {
      sum += samples[sampleIndex];
      count += 1;
    }

    result[index] = count > 0 ? sum / count : 0;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

export function useAudioFileAlignmentController({
  referenceWords,
}: UseAudioFileAlignmentControllerArgs) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyPromiseRef = useRef<Promise<void> | null>(null);
  const workerReadyResolveRef = useRef<(() => void) | null>(null);
  const objectUrlRef = useRef("");
  const samplesRef = useRef<Float32Array | null>(null);
  const lastFedSampleRef = useRef(0);
  const feedRafRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const accumulatorRef = useRef<TranscriptAccumulator>({
    completedBlocks: [],
    activeUtteranceId: null,
    activeText: "",
  });
  const alignmentRef = useRef<AlignmentState>(INITIAL_ALIGNMENT_STATE);
  const referenceWordsRef = useRef(referenceWords);
  referenceWordsRef.current = referenceWords;

  const [modeState, setModeState] = useState<FileModeState>({
    status: "idle",
    fileName: "",
    objectUrl: "",
    errorMessage: "",
    durationSec: 0,
    currentTimeSec: 0,
    isReady: false,
  });
  const [detail, setDetail] = useState<TranscriptUpdateDetail>(EMPTY_DETAIL);
  const [alignment, setAlignment] = useState<AlignmentState>(INITIAL_ALIGNMENT_STATE);

  const ensureWorkerReady = useCallback(() => {
    if (workerReadyPromiseRef.current) {
      return workerReadyPromiseRef.current;
    }

    workerReadyPromiseRef.current = new Promise<void>((resolve) => {
      workerReadyResolveRef.current = resolve;
    });

    const worker = new Worker("/onnx/asr-worker.js");
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      if (message.type === "initialized") {
        workerReadyResolveRef.current?.();
        workerReadyResolveRef.current = null;
        return;
      }

      if (message.type === "flush_complete") {
        return;
      }

      if (message.type !== "partial" && message.type !== "final") {
        return;
      }

      const normalizedMessage: WorkerPartialFinalMessage = {
        ...message,
        sourceType: "file",
      };

      const nextAccumulator = applyMessageToAccumulator(
        accumulatorRef.current,
        normalizedMessage,
      );
      accumulatorRef.current = nextAccumulator;

      const nextDetail = buildDetailFromAccumulator(nextAccumulator, normalizedMessage);
      setDetail(nextDetail);

      const nextAlignment = alignTranscriptToReference(
        referenceWordsRef.current,
        nextDetail.combinedText ?? "",
        alignmentRef.current,
        {
          type: normalizedMessage.type,
          utteranceId: normalizedMessage.utteranceId ?? null,
        },
      );
      alignmentRef.current = nextAlignment;
      setAlignment(nextAlignment);
    };

    worker.postMessage({
      type: "init",
      expectedSampleRate: TARGET_SAMPLE_RATE,
      mode: "legacy",
    });

    return workerReadyPromiseRef.current;
  }, []);

  const stopFeeding = useCallback(() => {
    if (feedRafRef.current !== null) {
      cancelAnimationFrame(feedRafRef.current);
      feedRafRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  const feedLoop = useCallback(() => {
    if (!isPlayingRef.current) return;

    const audio = audioRef.current;
    const samples = samplesRef.current;
    const worker = workerRef.current;
    if (!audio || !samples || !worker) return;

    const targetSample = Math.min(
      Math.floor(audio.currentTime * TARGET_SAMPLE_RATE),
      samples.length,
    );

    while (lastFedSampleRef.current < targetSample) {
      const start = lastFedSampleRef.current;
      const end = Math.min(start + CHUNK_SIZE, targetSample);
      const chunk = samples.slice(start, end);

      worker.postMessage(
        {
          type: "audio",
          samples: chunk,
          forceDecode: true,
          sourceType: "file",
          sourceTimeSec: end / TARGET_SAMPLE_RATE,
          sourceDurationSec: audio.duration || 0,
        },
        [chunk.buffer],
      );

      lastFedSampleRef.current = end;
    }

    feedRafRef.current = requestAnimationFrame(feedLoop);
  }, []);

  const startFeeding = useCallback(() => {
    isPlayingRef.current = true;
    feedRafRef.current = requestAnimationFrame(feedLoop);
  }, [feedLoop]);

  const resetWorkerState = useCallback(() => {
    workerRef.current?.postMessage({ type: "reset" });
    lastFedSampleRef.current = 0;
    accumulatorRef.current = {
      completedBlocks: [],
      activeUtteranceId: null,
      activeText: "",
    };
    alignmentRef.current = INITIAL_ALIGNMENT_STATE;
    setDetail(EMPTY_DETAIL);
    setAlignment(INITIAL_ALIGNMENT_STATE);
  }, []);

  const reset = useCallback(() => {
    stopFeeding();

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    resetWorkerState();
    samplesRef.current = null;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    setModeState({
      status: "idle",
      fileName: "",
      objectUrl: "",
      errorMessage: "",
      durationSec: 0,
      currentTimeSec: 0,
      isReady: false,
    });
  }, [stopFeeding, resetWorkerState]);

  const loadFile = useCallback(
    async (file: File) => {
      stopFeeding();

      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setModeState({
        status: "decoding",
        fileName: file.name,
        objectUrl,
        errorMessage: "",
        durationSec: 0,
        currentTimeSec: 0,
        isReady: false,
      });

      try {
        await ensureWorkerReady();

        const arrayBuffer = await file.arrayBuffer();
        const AudioContextCtor =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext;

        if (!AudioContextCtor) {
          throw new Error("This browser does not support Web Audio decoding.");
        }

        const audioContext = new AudioContextCtor();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const monoSamples = mixDownToMono(decodedBuffer);
        const resampledSamples = resampleTo16k(monoSamples, decodedBuffer.sampleRate);
        await audioContext.close();

        samplesRef.current = resampledSamples;
        lastFedSampleRef.current = 0;
        resetWorkerState();

        setModeState({
          status: "ready",
          fileName: file.name,
          objectUrl,
          errorMessage: "",
          durationSec: decodedBuffer.duration,
          currentTimeSec: 0,
          isReady: true,
        });
      } catch (error) {
        setModeState((previous) => ({
          ...previous,
          status: "error",
          errorMessage:
            error instanceof Error ? error.message : "Failed to read the audio file.",
          isReady: false,
        }));
      }
    },
    [ensureWorkerReady, stopFeeding, resetWorkerState],
  );

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !modeState.isReady) return;

    await audio.play();
    startFeeding();
    setModeState((previous) => ({ ...previous, status: "playing" }));
  }, [modeState.isReady, startFeeding]);

  const pause = useCallback(() => {
    stopFeeding();
    audioRef.current?.pause();
    setModeState((previous) => ({
      ...previous,
      status: previous.isReady ? "paused" : previous.status,
    }));
  }, [stopFeeding]);

  const seek = useCallback(
    (timeSec: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const clampedTime = Math.min(Math.max(timeSec, 0), modeState.durationSec || 0);
      audio.currentTime = clampedTime;

      resetWorkerState();
      lastFedSampleRef.current = Math.floor(clampedTime * TARGET_SAMPLE_RATE);

      setModeState((previous) => ({ ...previous, currentTimeSec: clampedTime }));
    },
    [modeState.durationSec, resetWorkerState],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setModeState((previous) => ({
        ...previous,
        currentTimeSec: audio.currentTime,
      }));
    };

    const handlePlay = () => {
      if (!isPlayingRef.current && samplesRef.current) {
        startFeeding();
      }
      setModeState((previous) => ({
        ...previous,
        status: previous.isReady ? "playing" : previous.status,
      }));
    };

    const handlePause = () => {
      stopFeeding();
      setModeState((previous) => ({
        ...previous,
        status:
          previous.isReady && audio.currentTime < (previous.durationSec || audio.duration || 0)
            ? "paused"
            : previous.status,
      }));
    };

    const handleSeeked = () => {
      const wasPlaying = isPlayingRef.current;
      stopFeeding();
      resetWorkerState();
      lastFedSampleRef.current = Math.floor(audio.currentTime * TARGET_SAMPLE_RATE);
      setModeState((previous) => ({ ...previous, currentTimeSec: audio.currentTime }));
      if (wasPlaying && !audio.paused) {
        startFeeding();
      }
    };

    const handleLoadedMetadata = () => {
      setModeState((previous) => ({
        ...previous,
        durationSec: Number.isFinite(audio.duration) ? audio.duration : previous.durationSec,
      }));
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("seeked", handleSeeked);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  });

  useEffect(() => {
    return () => {
      stopFeeding();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      try {
        workerRef.current?.postMessage({ type: "free" });
        workerRef.current?.terminate();
      } catch (_) {
        // Ignore worker teardown errors.
      }
    };
  }, [stopFeeding]);

  return useMemo(
    () => ({
      audioRef,
      modeState,
      detail,
      alignment,
      loadFile,
      play,
      pause,
      seek,
      reset,
    }),
    [alignment, detail, loadFile, modeState, pause, play, reset, seek],
  );
}
