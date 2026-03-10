// VAD worker: runs sherpa-onnx Silero VAD off the main thread.

const runtimeState = {
  bootstrapped: false,
  loading: false,
  ready: false,
  readyPromise: null,
};

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
let initRequested = false;
let initNotified = false;

function getModule() {
  self.Module = self.Module || {};
  return self.Module;
}

function postInitError(error) {
  self.postMessage({
    type: "error",
    stage: "init",
    error: String(error),
  });
}

function bootstrapRuntimeOnce() {
  if (runtimeState.readyPromise) {
    return runtimeState.readyPromise;
  }

  runtimeState.loading = true;
  runtimeState.readyPromise = new Promise((resolve, reject) => {
    const module = getModule();
    const previousOnRuntimeInitialized = module.onRuntimeInitialized;

    module.locateFile = function (path) {
      return "/onnx/" + path;
    };

    module.onRuntimeInitialized = function () {
      runtimeState.ready = true;
      runtimeState.loading = false;
      if (typeof previousOnRuntimeInitialized === "function") {
        previousOnRuntimeInitialized();
      }
      resolve(module);
      maybeInitializeVad();
    };

    try {
      if (!runtimeState.bootstrapped) {
        runtimeState.bootstrapped = true;
        importScripts("/onnx/sherpa-onnx-vad.js");
        importScripts("/onnx/sherpa-onnx-wasm-main-vad.js");
      } else if (runtimeState.ready) {
        resolve(module);
      }
    } catch (error) {
      runtimeState.loading = false;
      reject(error);
    }
  });

  return runtimeState.readyPromise;
}

function freeVad() {
  try {
    vad?.free?.();
  } catch (_) {
    // Ignore teardown failures.
  }
  vad = null;
  speechActive = false;
}

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

function maybeInitializeVad() {
  if (!runtimeState.ready || !initRequested || initNotified) {
    return;
  }

  try {
    const module = getModule();
    freeVad();
    vad = createVad(module, config);
    initNotified = true;
    self.postMessage({ type: "initialized" });
  } catch (e) {
    postInitError(e);
  }
}

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
      initRequested = true;
      initNotified = false;
      bootstrapRuntimeOnce().then(maybeInitializeVad).catch(postInitError);
      maybeInitializeVad();
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
      initNotified = false;
      freeVad();
      break;
    }
  }
};
