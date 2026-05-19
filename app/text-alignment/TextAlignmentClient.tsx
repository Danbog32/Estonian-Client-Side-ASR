"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Upload,
} from "lucide-react";
import { useSettings } from "../providers/SettingsContext";
import AsrScriptBridge from "../components/AsrScriptBridge";
import {
  alignTranscriptToReference,
  INITIAL_ALIGNMENT_STATE,
  parseReferenceText,
} from "./alignment";
import type {
  AsrEventPayload,
  TranscriptBlock,
  TranscriptUpdateDetail,
} from "./types";
import { useAudioFileAlignmentController } from "./useAudioFileAlignmentController";

type SourceMode = "microphone" | "file";

const DEMO_TEXT = `Täna loen ma seda teksti rahulikult ja järjest. Süsteem kuulab mikrofoni, võrdleb öeldud sõnu etteantud tekstiga ning tõstab esile koha, kus ma parajasti olen.`;

const translations = {
  en: {
    title: "Text alignment",
    subtitle:
      "Read a prepared text aloud and follow the current word in real time.",
    back: "Back to captions",
    referenceLabel: "Reference text",
    referenceHint: "Paste the text the speaker should read.",
    useDemo: "Use demo text",
    statusReady: "Model ready",
    statusLoading: "Loading ASR model...",
    statusRecording: "Listening",
    statusIdle: "Idle",
    start: "Start",
    stop: "Stop",
    clear: "Reset",
    currentWord: "Current word index",
    confidence: "Confidence",
    recentTranscript: "Recent ASR window",
    matchedPhrase: "Matched phrase",
    alignmentPlaceholder: "Paste a reference text to start alignment.",
    sourceLabel: "Input source",
    micMode: "Microphone",
    fileMode: "Uploaded audio",
    fileUpload: "Choose audio file",
    fileReady: "Ready to play",
    fileDecoding: "Decoding audio file...",
    filePreprocessing: "Preparing alignment...",
    filePlaying: "Playing",
    filePaused: "Paused",
    fileIdle: "Upload a local audio file.",
    fileError: "Audio processing failed.",
    filePlayer: "Audio playback",
    preprocessProgress: "Preprocess progress",
    selectedFile: "Selected file",
    playbackTime: "Playback time",
    play: "Play",
    pause: "Pause",
    noFile: "No file selected",
  },
  et: {
    title: "Teksti joondus",
    subtitle:
      "Loe ette etteantud tekst ja jälgi reaalajas, millise sõna juures kõneleja on.",
    back: "Tagasi subtiitrite juurde",
    referenceLabel: "Võrdlustekst",
    referenceHint: "Sisesta või kleebi tekst, mida kõneleja loeb.",
    useDemo: "Kasuta näidisteksti",
    statusReady: "Mudel valmis",
    statusLoading: "Laen ASR mudelit...",
    statusRecording: "Kuulan",
    statusIdle: "Ootel",
    start: "Alusta",
    stop: "Peata",
    clear: "Lähtesta",
    currentWord: "Praeguse sõna indeks",
    confidence: "Kindlus",
    recentTranscript: "Viimane ASR aken",
    matchedPhrase: "Leitud fraas",
    alignmentPlaceholder: "Kleebi võrdlustekst, et joondus alustada.",
    sourceLabel: "Sisendallikas",
    micMode: "Mikrofon",
    fileMode: "Helifail",
    fileUpload: "Vali helifail",
    fileReady: "Valmis esitamiseks",
    fileDecoding: "Dekodeerin helifaili...",
    filePreprocessing: "Valmistan joondust ette...",
    filePlaying: "Mängib",
    filePaused: "Paus",
    fileIdle: "Laadi üles kohalik helifail.",
    fileError: "Helifaili töötlemine ebaõnnestus.",
    filePlayer: "Heli esitamine",
    preprocessProgress: "Eeltöötluse edenemine",
    selectedFile: "Valitud fail",
    playbackTime: "Esituse aeg",
    play: "Esita",
    pause: "Paus",
    noFile: "Fail puudub",
  },
} as const;

function getCombinedTranscript(blocks: TranscriptBlock[]): string {
  return blocks
    .map((block) => `${block.text}${block.previewSuffix ?? ""}`.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatSeconds(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TextAlignmentClient() {
  const { backgroundColor, textColor, language } = useSettings();
  const t = translations[language] ?? translations.en;

  const [sourceMode, setSourceMode] = useState<SourceMode>("microphone");
  const [isModelReady, setIsModelReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [referenceText, setReferenceText] = useState("");
  const [micTranscriptBlocks, setMicTranscriptBlocks] = useState<
    TranscriptBlock[]
  >([]);
  const [micAsrEvent, setMicAsrEvent] = useState<AsrEventPayload>({
    type: "idle",
  });
  const [micCombinedTranscriptText, setMicCombinedTranscriptText] =
    useState("");
  const [micAlignment, setMicAlignment] = useState(INITIAL_ALIGNMENT_STATE);

  const referenceWords = useMemo(
    () => parseReferenceText(referenceText),
    [referenceText],
  );
  const fileController = useAudioFileAlignmentController({ referenceWords });
  const pauseFilePlayback = fileController.pause;
  const seekFilePlayback = fileController.seek;

  useEffect(() => {
    const handleModelInitialized = () => setIsModelReady(true);
    const handleTranscriptUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<TranscriptUpdateDetail>;
      setMicTranscriptBlocks(customEvent.detail?.blocks ?? []);
      setMicCombinedTranscriptText(customEvent.detail?.combinedText ?? "");
      setMicAsrEvent(customEvent.detail?.asr ?? { type: "idle" });
    };

    window.addEventListener("modelInitialized", handleModelInitialized);
    window.addEventListener(
      "transcriptUpdate",
      handleTranscriptUpdate as EventListener,
    );

    return () => {
      window.removeEventListener("modelInitialized", handleModelInitialized);
      window.removeEventListener(
        "transcriptUpdate",
        handleTranscriptUpdate as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const micTranscriptText =
      micCombinedTranscriptText || getCombinedTranscript(micTranscriptBlocks);

    setMicAlignment((previousState) =>
      alignTranscriptToReference(
        referenceWords,
        micTranscriptText,
        previousState,
        {
          type: micAsrEvent.type,
          utteranceId: micAsrEvent.utteranceId,
        },
      ),
    );
  }, [
    micAsrEvent.type,
    micAsrEvent.utteranceId,
    micCombinedTranscriptText,
    micTranscriptBlocks,
    referenceWords,
  ]);

  useEffect(() => {
    if (sourceMode === "file" && isRecording) {
      document.getElementById("stopBtn")?.click();
      setIsRecording(false);
    }

    if (sourceMode === "microphone") {
      pauseFilePlayback();
      seekFilePlayback(0);
    }
  }, [isRecording, pauseFilePlayback, seekFilePlayback, sourceMode]);

  const activeAlignment =
    sourceMode === "file" ? fileController.alignment : micAlignment;
  const activeAsrEvent =
    sourceMode === "file"
      ? (fileController.detail.asr ?? { type: "idle" })
      : micAsrEvent;

  const fileStatusLabel =
    fileController.modeState.status === "decoding"
      ? t.fileDecoding
      : fileController.modeState.status === "ready"
        ? t.fileReady
        : fileController.modeState.status === "playing"
          ? t.filePlaying
          : fileController.modeState.status === "paused"
            ? t.filePaused
            : fileController.modeState.status === "error"
              ? fileController.modeState.errorMessage || t.fileError
              : t.fileIdle;

  const statusLabel =
    sourceMode === "microphone"
      ? !isModelReady
        ? t.statusLoading
        : isRecording
          ? t.statusRecording
          : t.statusIdle
      : fileStatusLabel;

  const handleToggleRecording = () => {
    const nextRecordingState = !isRecording;

    if (nextRecordingState) {
      document.getElementById("startBtn")?.click();
    } else {
      document.getElementById("stopBtn")?.click();
    }

    setIsRecording(nextRecordingState);
  };

  const handleReset = () => {
    if (sourceMode === "file") {
      fileController.reset();
      return;
    }

    document.getElementById("clearBtn")?.click();
    setMicTranscriptBlocks([]);
    setMicCombinedTranscriptText("");
    setMicAsrEvent({ type: "reset" });
    setMicAlignment(INITIAL_ALIGNMENT_STATE);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await fileController.loadFile(file);
    event.target.value = "";
  };

  return (
    <div
      className="min-h-dvh w-full px-4 py-4 sm:px-6 lg:px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <AsrScriptBridge />

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white/85"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">
              {t.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/75">
              {sourceMode === "microphone" && isModelReady
                ? t.statusReady
                : statusLabel}
            </div>

            {sourceMode === "microphone" ? (
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={!isModelReady}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-400"
                    : "bg-emerald-400 text-black hover:bg-emerald-300"
                } disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40`}
              >
                {isRecording ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isRecording ? t.stop : t.start}
              </button>
            ) : (
              <>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white">
                  <Upload className="h-4 w-4" />
                  {t.fileUpload}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    fileController.modeState.status === "playing"
                      ? fileController.pause()
                      : fileController.play()
                  }
                  disabled={!fileController.modeState.isReady}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                >
                  {fileController.modeState.status === "playing" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {fileController.modeState.status === "playing"
                    ? t.pause
                    : t.play}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              {t.clear}
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
          <div className="mb-3 text-sm font-medium text-white/60">
            {t.sourceLabel}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "microphone", label: t.micMode },
                { key: "file", label: t.fileMode },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSourceMode(option.key)}
                className={`rounded-[18px] border px-4 py-3 text-left transition ${
                  sourceMode === option.key
                    ? "border-emerald-400/60 bg-emerald-400/12 text-white"
                    : "border-white/10 bg-white/[0.02] text-white/65 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <div className="text-base font-semibold">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t.referenceLabel}</h2>
                <p className="mt-1 text-sm text-white/55">{t.referenceHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setReferenceText(DEMO_TEXT)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                {t.useDemo}
              </button>
            </div>

            <textarea
              value={referenceText}
              onChange={(event) => setReferenceText(event.target.value)}
              placeholder={t.alignmentPlaceholder}
              className="mt-4 min-h-[220px] w-full rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm outline-none transition placeholder:text-white/30 focus:border-emerald-400/50"
            />

            {sourceMode === "file" && (
              <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{t.filePlayer}</h3>
                    <p className="mt-1 text-xs text-white/50">
                      {fileController.modeState.fileName || t.noFile}
                    </p>
                  </div>
                  <div className="text-xs text-white/50">
                    {formatSeconds(fileController.modeState.currentTimeSec)} /{" "}
                    {formatSeconds(fileController.modeState.durationSec)}
                  </div>
                </div>

                <audio
                  ref={fileController.audioRef}
                  controls
                  preload="metadata"
                  src={fileController.modeState.objectUrl || undefined}
                  className="mt-4 w-full"
                />

                {fileController.modeState.errorMessage && (
                  <p className="mt-3 text-sm text-red-300">
                    {fileController.modeState.errorMessage}
                  </p>
                )}
              </div>
            )}

            <dl className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <dt className="text-white/45">{t.currentWord}</dt>
                <dd className="mt-1 text-xl font-semibold">
                  {referenceWords.length > 0
                    ? activeAlignment.currentWordIndex
                    : 0}
                </dd>
              </div>

              {/*<div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <dt className="text-white/45">{t.confidence}</dt>
                <dd className="mt-1 text-xl font-semibold">
                  {Math.round(activeAlignment.confidence * 100)}%
                </dd>
              </div>*/}

              <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <dt className="text-white/45">{t.recentTranscript}</dt>
                <dd className="mt-1 text-sm text-white/80">
                  {activeAlignment.recentTranscript || "—"}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <dt className="text-white/45">{t.matchedPhrase}</dt>
                <dd className="mt-1 text-sm text-white/80">
                  {activeAlignment.matchedPhrase || "—"}
                </dd>
              </div>

              {/*<div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <dt className="text-white/45">ASR event</dt>
                <dd className="mt-1 text-sm text-white/80">
                  {activeAsrEvent.type || "idle"}
                  {activeAsrEvent.utteranceId ? ` · ${activeAsrEvent.utteranceId}` : ""}
                </dd>
              </div>*/}

              {/*{sourceMode === "file" && (
                <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                  <dt className="text-white/45">{t.playbackTime}</dt>
                  <dd className="mt-1 text-sm text-white/80">
                    {formatSeconds(fileController.modeState.currentTimeSec)}
                  </dd>
                </div>
              )}*/}
            </dl>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t.title}</h2>
                <p className="mt-1 text-sm text-white/55">{statusLabel}</p>
              </div>
            </div>

            {referenceWords.length === 0 ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-black/10 p-8 text-center text-white/45">
                {t.alignmentPlaceholder}
              </div>
            ) : (
              <div className="min-h-[360px] rounded-[24px] border border-white/8 bg-black/20 p-6 text-2xl leading-[2.2] sm:text-[1.9rem]">
                {referenceWords.map((word) => {
                  const isCurrent =
                    word.index === activeAlignment.currentWordIndex;
                  const isPast = word.index < activeAlignment.currentWordIndex;

                  return (
                    <span
                      key={`${word.index}-${word.normalized}`}
                      className={`rounded-xl px-1.5 py-1 transition ${
                        isCurrent
                          ? "bg-emerald-400 text-black shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
                          : isPast
                            ? "text-white/45"
                            : "text-white/92"
                      }`}
                    >
                      {word.display}
                    </span>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
