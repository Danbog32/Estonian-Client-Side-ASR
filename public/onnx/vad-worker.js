// VAD worker: runs sherpa-onnx Silero VAD off the main thread.

self.Module = self.Module || {};

let vad = null;
let paused = false;
let speechActive = false;
let runtimeReady = false;
let initRequested = false;
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

function getModule() {
  return self.Module;
}

function configureModule() {
  const module = getModule();
  module.locateFile = function (path) {
    return "/onnx/" + path;
  };
  return module;
}

function postWorkerError(stage, error) {
  self.postMessage({
    type: "error",
    stage,
    error: String(error),
  });
}

function maybeInitializeVad() {
  if (!runtimeReady || !initRequested || vad) {
    return;
  }

  try {
    vad = createVad(getModule(), config);
    self.postMessage({ type: "initialized" });
  } catch (error) {
    postWorkerError("init", error);
  }
}

function ensureVadRuntime() {
  if (runtimeReady) {
    return Promise.resolve(getModule());
  }

  if (self.__vadRuntimePromise) {
    return self.__vadRuntimePromise;
  }

  self.__vadRuntimePromise = new Promise((resolve, reject) => {
    const module = configureModule();

    const handleRuntimeReady = () => {
      if (runtimeReady) {
        resolve(module);
        return;
      }

      runtimeReady = true;
      self.__vadRuntimeInitialized = true;
      resolve(module);
      maybeInitializeVad();
    };

    if (self.__vadRuntimeInitialized || module.calledRun) {
      handleRuntimeReady();
      return;
    }

    module.onRuntimeInitialized = handleRuntimeReady;

    try {
      if (!self.__sherpaVadHelpersLoaded) {
        importScripts("/onnx/sherpa-onnx-vad.js");
        self.__sherpaVadHelpersLoaded = true;
      }

      if (!self.__sherpaVadWasmLoaded) {
        importScripts("/onnx/sherpa-onnx-wasm-main-vad.js");
        self.__sherpaVadWasmLoaded = true;
      } else if (module.calledRun) {
        handleRuntimeReady();
      }
    } catch (error) {
      self.__vadRuntimePromise = null;
      reject(error);
    }
  }).catch((error) => {
    postWorkerError("bootstrap", error);
    throw error;
  });

  return self.__vadRuntimePromise;
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

ensureVadRuntime().catch(() => {
  // Errors are reported back to the main thread by ensureVadRuntime.
});

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
      maybeInitializeVad();
      ensureVadRuntime().catch(() => {
        // Errors are reported back to the main thread by ensureVadRuntime.
      });
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
