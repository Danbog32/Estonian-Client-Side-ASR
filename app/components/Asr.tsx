// components/Asr.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import AsrLoader from "./AsrLoader";

declare const downsampleBuffer: (
  buffer: Float32Array,
  exportSampleRate: number
) => Float32Array;

const Asr: React.FC = () => {
  const startBtn = useRef<HTMLButtonElement>(null);
  const stopBtn = useRef<HTMLButtonElement>(null);
  const clearBtn = useRef<HTMLButtonElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const soundClips = useRef<HTMLElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);

  const [lastResult, setLastResult] = useState<string>("");
  const [resultList, setResultList] = useState<string[]>([]);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [mediaStream, setMediaStream] =
    useState<MediaStreamAudioSourceNode | null>(null);
  const [recorder, setRecorder] = useState<ScriptProcessorNode | null>(null);
  const [leftchannel, setLeftchannel] = useState<Int16Array[]>([]);
  const [recognizer, setRecognizer] = useState<any>(null);
  const [recognizerStream, setRecognizerStream] = useState<any>(null);
  const [recordingLength, setRecordingLength] = useState<number>(0);
  const expectedSampleRate = 16000;

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(onSuccess)
      .catch(onError);

    function onSuccess(stream: MediaStream) {
      const newAudioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 });
      setAudioCtx(newAudioCtx);
      const mediaStreamSource = newAudioCtx.createMediaStreamSource(stream);
      setMediaStream(mediaStreamSource);
      setRecorder(createRecorder(newAudioCtx));
    }

    function onError(err: Error) {
      console.log("The following error occurred: " + err);
    }
  }, []);

  useEffect(() => {
    if (recognizer && startBtn.current && stopBtn.current && clearBtn.current) {
      startBtn.current.onclick = startRecording;
      stopBtn.current.onclick = stopRecording;
      clearBtn.current.onclick = clearResults;
    }
  }, [recognizer]);

  const createRecorder = (audioCtx: AudioContext): ScriptProcessorNode => {
    const bufferSize = 4096;
    const recorderNode = audioCtx.createScriptProcessor(bufferSize, 1, 2);
    recorderNode.onaudioprocess = handleAudioProcess;
    return recorderNode;
  };

  const handleAudioProcess = (e: AudioProcessingEvent) => {
    let samples = new Float32Array(e.inputBuffer.getChannelData(0));
    samples = downsampleBuffer(samples, expectedSampleRate);

    if (!recognizerStream && recognizer) {
      setRecognizerStream(recognizer.createStream());
    }

    if (recognizerStream) {
      recognizerStream.acceptWaveform(expectedSampleRate, samples);
      while (recognizer.isReady(recognizerStream)) {
        recognizer.decode(recognizerStream);
      }

      const result = recognizer.getResult(recognizerStream);
      const isEndpoint = recognizer.isEndpoint(recognizerStream);

      if (result.length > 0 && lastResult !== result) {
        setLastResult(result);
      }

      if (isEndpoint) {
        if (lastResult.length > 0) {
          setResultList([...resultList, lastResult]);
          setLastResult("");
        }
        recognizer.reset(recognizerStream);
      }

      if (textArea.current) {
        textArea.current.value = getDisplayResult();
        textArea.current.scrollTop = textArea.current.scrollHeight; // auto scroll
      }

      const buf = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; ++i) {
        let s = samples[i];
        s = s >= 1 ? 1 : s <= -1 ? -1 : s;
        buf[i] = s * 32767;
      }

      setLeftchannel([...leftchannel, buf]);
      setRecordingLength(recordingLength + e.inputBuffer.length);
    }
  };

  const startRecording = () => {
    if (
      mediaStream &&
      recorder &&
      audioCtx &&
      startBtn.current &&
      stopBtn.current
    ) {
      mediaStream.connect(recorder);
      recorder.connect(audioCtx.destination);
      console.log("recorder started");
      stopBtn.current.disabled = false;
      startBtn.current.disabled = true;
    }
  };

  const stopRecording = () => {
    if (
      mediaStream &&
      recorder &&
      audioCtx &&
      startBtn.current &&
      stopBtn.current &&
      soundClips.current
    ) {
      recorder.disconnect(audioCtx.destination);
      mediaStream.disconnect(recorder);
      console.log("recorder stopped");
      stopBtn.current.disabled = true;
      startBtn.current.disabled = false;

      const clipName = new Date().toISOString();
      const clipContainer = document.createElement("article");
      const clipLabel = document.createElement("p");
      const audio = document.createElement("audio");
      const deleteButton = document.createElement("button");

      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      deleteButton.textContent = "Delete";
      deleteButton.className = "delete";
      clipLabel.textContent = clipName;
      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.current.appendChild(clipContainer);

      audio.controls = true;
      const samples = flatten(leftchannel);
      const blob = toWav(samples);
      setLeftchannel([]);
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;

      deleteButton.onclick = (e) => {
        const evtTgt = e.target as HTMLButtonElement;
        evtTgt.parentNode?.parentNode?.removeChild(evtTgt.parentNode);
      };

      clipLabel.onclick = () => {
        const existingName = clipLabel.textContent;
        const newClipName = prompt("Enter a new name for your sound clip?");
        if (newClipName !== null) {
          clipLabel.textContent = newClipName;
        }
      };
    }
  };

  const clearResults = () => {
    setResultList([]);
    if (textArea.current) {
      textArea.current.value = getDisplayResult();
      textArea.current.scrollTop = textArea.current.scrollHeight; // auto scroll
    }
  };

  const getDisplayResult = () => {
    let ans = "";
    resultList.forEach((result, index) => {
      ans += `${index}: ${result}\n`;
    });

    if (lastResult.length > 0) {
      ans += `${resultList.length}: ${lastResult}\n`;
    }

    return ans;
  };

  const flatten = (listOfSamples: Int16Array[]): Int16Array => {
    let n = 0;
    listOfSamples.forEach((samples) => (n += samples.length));
    const ans = new Int16Array(n);
    let offset = 0;
    listOfSamples.forEach((samples) => {
      ans.set(samples, offset);
      offset += samples.length;
    });
    return ans;
  };

  const toWav = (samples: Int16Array): Blob => {
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buf);

    view.setUint32(0, 0x46464952, true); // chunkID
    view.setUint32(4, 36 + samples.length * 2, true); // chunkSize
    view.setUint32(8, 0x45564157, true); // format
    view.setUint32(12, 0x20746d66, true); // subchunk1ID
    view.setUint32(16, 16, true); // subchunk1Size, 16 for PCM
    view.setUint32(20, 1, true); // audioFormat, 1 for PCM
    view.setUint16(22, 1, true); // numChannels: 1 channel
    view.setUint32(24, expectedSampleRate, true); // sampleRate
    view.setUint32(28, expectedSampleRate * 2, true); // byteRate
    view.setUint16(32, 2, true); // blockAlign
    view.setUint16(34, 16, true); // bitsPerSample
    view.setUint32(36, 0x61746164, true); // Subchunk2ID
    view.setUint32(40, samples.length * 2, true); // subchunk2Size

    let offset = 44;
    samples.forEach((sample) => {
      view.setInt16(offset, sample, true);
      offset += 2;
    });

    return new Blob([view], { type: "audio/wav" });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4 text-center">
        WebAssembly +
        <br />
        ASR
      </h1>
      <div className="flex flex-col items-center justify-center">
        <AsrLoader onReady={setRecognizer} />
        <div>
          <button
            ref={startBtn}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            disabled
          >
            Start
          </button>
          <button
            ref={stopBtn}
            className="bg-red-500 text-white px-4 py-2 rounded mr-2"
            disabled
          >
            Stop
          </button>
          <button
            ref={clearBtn}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Clear
          </button>
        </div>

        <textarea
          ref={textArea}
          rows={10}
          readOnly
          className="mt-4 p-2 border rounded min-w-[800px] h-[200px] overflow-y-scroll"
        ></textarea>
      </div>
      <section id="sound-clips" ref={soundClips}></section>
    </div>
  );
};

export default Asr;
