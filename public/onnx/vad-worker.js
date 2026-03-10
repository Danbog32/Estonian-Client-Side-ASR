// VAD worker: runs sherpa-onnx Silero VAD off the main thread.

self.Module = self.Module || {};
const Module = self.Module;

Module.locateFile = function (path) {
  return "/onnx/" + path;
};

importScripts("/onnx/sherpa-onnx-vad.js");
importScripts("/onnx/sherpa-onnx-wasm-main-vad.js");

let vad = null;
let paused = false;
let speechActive = false;
let config = {
  sileroVad: {
    model: "./silero_vad.onnx",
    threshold: 0.5,
    minSilenceDuration: 0.4,
    minSpeechDuration: 0.25,
    maxSpeechDuration: 20,
    windowSize: 512,
  },
  tenVad: {
    model: "",
    threshold: 0.5,
    minSilenceDuration: 0.4,
    minSpeechDuration: 0.25,
    maxSpeechDuration: 20,
    windowSize: 256,
  },
  sampleRate: 16000,
  numThreads: 1,
  provider: "cpu",
  debug: 0,
  bufferSizeInSeconds: 30,
};

function drainSegments() {
  if (!vad) {
    return;
  }

  while (!vad.isEmpty()) {
    const segment = vad.front();
    vad.pop();
    speechActive = false;
    self.postMessage({
      type: "speech_end",
      start: segment.start,
      sampleCount: segment.samples.length,
    });
  }
}

function processSamples(samples) {
  if (paused || !vad || !samples?.length) {
    return;
  }

  const wasDetected = speechActive;
  vad.acceptWaveform(samples);

  if (vad.isDetected() && !wasDetected) {
    speechActive = true;
    self.postMessage({ type: "speech_start" });
  }

  drainSegments();
}

Module.onRuntimeInitialized = function () {
  try {
    vad = createVad(Module, config);
    self.postMessage({ type: "initialized" });
  } catch (e) {
    self.postMessage({
      type: "error",
      stage: "init",
      error: String(e),
    });
  }
};

self.onmessage = function (e) {
  const msg = e.data || {};

  switch (msg.type) {
    case "init": {
      if (msg.config && typeof msg.config === "object") {
        config = {
          ...config,
          ...msg.config,
          sileroVad: {
            ...config.sileroVad,
            ...(msg.config.sileroVad || {}),
          },
          tenVad: {
            ...config.tenVad,
            ...(msg.config.tenVad || {}),
          },
        };
      }
      break;
    }
    case "pause": {
      paused = true;
      break;
    }
    case "resume": {
      paused = false;
      break;
    }
    case "audio": {
      let samples = msg.samples;
      if (!(samples instanceof Float32Array) && samples?.buffer) {
        samples = new Float32Array(samples);
      }
      processSamples(samples);
      break;
    }
    case "flush": {
      try {
        vad?.flush();
      } catch (_) {
        // Ignore flush failures.
      }
      drainSegments();
      break;
    }
    case "reset": {
      try {
        vad?.reset();
      } catch (_) {
        // Ignore reset failures.
      }
      speechActive = false;
      break;
    }
    case "free": {
      try {
        vad?.free?.();
      } catch (_) {
        // Ignore teardown failures.
      }
      vad = null;
      speechActive = false;
      break;
    }
  }
};
