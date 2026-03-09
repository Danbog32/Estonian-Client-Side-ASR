// ASR worker: runs sherpa-onnx recognizer off the main thread.

self.Module = self.Module || {};

let recognizer = null;
let recognizerStream = null;
let expectedSampleRate = 16000;
let lastDecodeTs = 0;
let lastText = "";
let paused = false;
let segmentationMode = "vad";
let legacyUtteranceCounter = 0;
let currentUtteranceId = null;
let runtimeReady = false;
let initRequested = false;

let sabEnabled = false;
let ringData = null;
let ringCtrl = null;
let ringCapacity = 0;
const IDX_WRITE = 0;
const IDX_READ = 1;

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

function maybeInitializeRecognizer() {
  if (!runtimeReady || !initRequested || recognizer) {
    return;
  }

  try {
    recognizer = createOnlineRecognizer(
      getModule(),
      buildRecognizerConfig(segmentationMode)
    );
    self.postMessage({ type: "initialized", mode: segmentationMode });
  } catch (error) {
    postWorkerError("init", error);
  }
}

function ensureAsrRuntime() {
  if (runtimeReady) {
    return Promise.resolve(getModule());
  }

  if (self.__asrRuntimePromise) {
    return self.__asrRuntimePromise;
  }

  self.__asrRuntimePromise = new Promise((resolve, reject) => {
    const module = configureModule();

    const handleRuntimeReady = () => {
      if (runtimeReady) {
        resolve(module);
        return;
      }

      runtimeReady = true;
      self.__asrRuntimeInitialized = true;
      resolve(module);
      maybeInitializeRecognizer();
    };

    if (self.__asrRuntimeInitialized || module.calledRun) {
      handleRuntimeReady();
      return;
    }

    module.onRuntimeInitialized = handleRuntimeReady;

    try {
      if (!self.__sherpaAsrHelpersLoaded) {
        importScripts("/onnx/sherpa-onnx-asr.js");
        self.__sherpaAsrHelpersLoaded = true;
      }

      if (!self.__sherpaAsrWasmLoaded) {
        importScripts("/onnx/sherpa-onnx-wasm-main-asr-v2.js");
        self.__sherpaAsrWasmLoaded = true;
      } else if (module.calledRun) {
        handleRuntimeReady();
      }
    } catch (error) {
      self.__asrRuntimePromise = null;
      reject(error);
    }
  }).catch((error) => {
    postWorkerError("bootstrap", error);
    throw error;
  });

  return self.__asrRuntimePromise;
}

function buildRecognizerConfig(mode) {
  return {
    featConfig: {
      sampleRate: 16000,
      featureDim: 80,
    },
    modelConfig: {
      transducer: {
        encoder: "./encoder.onnx",
        decoder: "./decoder.onnx",
        joiner: "./joiner.onnx",
      },
      paraformer: {
        encoder: "",
        decoder: "",
      },
      zipformer2Ctc: {
        model: "",
      },
      tokens: "./tokens.txt",
      numThreads: 1,
      provider: "cpu",
      debug: 0,
      modelType: "",
      modelingUnit: "cjkchar",
      bpeVocab: "",
    },
    decodingMethod: "greedy_search",
    maxActivePaths: 4,
    enableEndpoint: mode === "legacy" ? 1 : 0,
    rule1MinTrailingSilence: 2.4,
    rule2MinTrailingSilence: 1.2,
    rule3MinUtteranceLength: 20,
    hotwordsFile: "",
    hotwordsScore: 1.5,
    ctcFstDecoderConfig: {
      graph: "",
      maxActive: 3000,
    },
    ruleFsts: "",
    ruleFars: "",
  };
}

function ensureRecognizerStream() {
  if (!recognizer) {
    return null;
  }

  if (!recognizerStream) {
    recognizerStream = recognizer.createStream();
  }

  return recognizerStream;
}

function resetStreamState() {
  if (recognizer && recognizerStream) {
    try {
      recognizer.reset(recognizerStream);
    } catch (_) {
      // Best effort reset.
    }
  }

  lastText = "";
  lastDecodeTs = 0;
  currentUtteranceId = null;
}

function emitPartial(result) {
  if (!result || result === lastText) {
    return;
  }

  lastText = result;

  if (segmentationMode === "vad") {
    if (!currentUtteranceId) {
      return;
    }

    self.postMessage({
      type: "partial",
      utteranceId: currentUtteranceId,
      text: result,
    });
    return;
  }

  if (!currentUtteranceId) {
    legacyUtteranceCounter += 1;
    currentUtteranceId = `legacy-${legacyUtteranceCounter}`;
  }

  self.postMessage({
    type: "partial",
    utteranceId: currentUtteranceId,
    text: result,
  });
}

function decodeReadyFrames() {
  if (!recognizer || !recognizerStream) {
    return "";
  }

  while (recognizer.isReady(recognizerStream)) {
    recognizer.decode(recognizerStream);
  }

  let result = recognizer.getResult(recognizerStream).text || "";

  try {
    if (recognizer.config.modelConfig.paraformer.encoder !== "") {
      const tailPaddings = new Float32Array(expectedSampleRate);
      recognizerStream.acceptWaveform(expectedSampleRate, tailPaddings);
      while (recognizer.isReady(recognizerStream)) {
        recognizer.decode(recognizerStream);
      }
      result = recognizer.getResult(recognizerStream).text || "";
    }
  } catch (_) {
    // Best effort flush for paraformer models.
  }

  return result;
}

function finalizeCurrentUtterance(forceInputFinished) {
  if (!recognizer || !recognizerStream) {
    return;
  }

  const activeUtteranceId =
    currentUtteranceId ||
    (segmentationMode === "legacy"
      ? `legacy-${legacyUtteranceCounter + 1}`
      : null);

  if (!activeUtteranceId) {
    resetStreamState();
    return;
  }

  if (!currentUtteranceId && segmentationMode === "legacy") {
    legacyUtteranceCounter += 1;
    currentUtteranceId = activeUtteranceId;
  }

  try {
    if (forceInputFinished) {
      recognizerStream.inputFinished();
    }
  } catch (_) {
    // Some recognizers may ignore this if the stream is already finished.
  }

  const finalText = decodeReadyFrames() || lastText;

  if (finalText && finalText.length > 0) {
    self.postMessage({
      type: "final",
      utteranceId: activeUtteranceId,
      text: finalText,
    });
  }

  resetStreamState();
}

function processSamples(samples) {
  if (paused || !recognizer) {
    return;
  }

  const stream = ensureRecognizerStream();
  if (!stream) {
    return;
  }

  stream.acceptWaveform(expectedSampleRate, samples);

  const now =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  if (now - lastDecodeTs < 50) {
    return;
  }

  lastDecodeTs = now;
  const result = decodeReadyFrames();
  emitPartial(result);

  if (segmentationMode === "legacy" && recognizer.isEndpoint(recognizerStream)) {
    finalizeCurrentUtterance(false);
  }
}

ensureAsrRuntime().catch(() => {
  // Errors are reported back to the main thread by ensureAsrRuntime.
});

self.onmessage = function (e) {
  const msg = e.data || {};

  switch (msg.type) {
    case "init": {
      if (typeof msg.expectedSampleRate === "number") {
        expectedSampleRate = msg.expectedSampleRate;
      }

      if (msg.mode === "legacy" || msg.mode === "vad") {
        segmentationMode = msg.mode;
      }

      initRequested = true;
      maybeInitializeRecognizer();
      ensureAsrRuntime().catch(() => {
        // Errors are reported back to the main thread by ensureAsrRuntime.
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
    case "begin_utterance": {
      currentUtteranceId = msg.utteranceId || currentUtteranceId;
      if (currentUtteranceId && lastText) {
        self.postMessage({
          type: "partial",
          utteranceId: currentUtteranceId,
          text: lastText,
        });
      }
      break;
    }
    case "end_utterance": {
      finalizeCurrentUtterance(true);
      break;
    }
    case "force_finalize": {
      finalizeCurrentUtterance(true);
      break;
    }
    case "sab_setup": {
      try {
        if (msg.dataSab && msg.controlSab && typeof msg.capacity === "number") {
          ringData = new Float32Array(msg.dataSab);
          ringCtrl = new Int32Array(msg.controlSab);
          ringCapacity = msg.capacity;
          sabEnabled = true;
          if (!self._sabInterval) {
            self._sabInterval = setInterval(drainRingToRecognizer, 16);
          }
        }
      } catch (_) {
        sabEnabled = false;
      }
      break;
    }
    case "audio": {
      let samples = msg.samples;
      if (!(samples instanceof Float32Array) && samples?.buffer) {
        samples = new Float32Array(samples);
      }
      if (samples && samples.length) {
        processSamples(samples);
      }
      break;
    }
    case "reset": {
      resetStreamState();
      legacyUtteranceCounter = 0;
      break;
    }
    case "free": {
      try {
        recognizerStream?.free?.();
      } catch (_) {
        // Ignore stream teardown errors.
      }
      recognizerStream = null;

      try {
        recognizer?.free?.();
      } catch (_) {
        // Ignore recognizer teardown errors.
      }
      recognizer = null;
      lastText = "";
      currentUtteranceId = null;
      break;
    }
  }
};

function drainRingToRecognizer() {
  if (paused || !sabEnabled || !ringData || !ringCtrl) {
    return;
  }

  const writeIndex = Atomics.load(ringCtrl, IDX_WRITE);
  const readIndex = Atomics.load(ringCtrl, IDX_READ);
  const capacity = ringCapacity || ringData.length;
  const available = (writeIndex - readIndex + capacity) % capacity;

  if (available === 0) {
    return;
  }

  const toRead = Math.min(1024, available);
  const chunk = new Float32Array(toRead);
  const firstPart = Math.min(toRead, capacity - readIndex);

  if (firstPart > 0) {
    chunk.set(ringData.subarray(readIndex, readIndex + firstPart), 0);
  }

  const secondPart = toRead - firstPart;
  if (secondPart > 0) {
    chunk.set(ringData.subarray(0, secondPart), firstPart);
  }

  Atomics.store(ringCtrl, IDX_READ, (readIndex + toRead) % capacity);
  processSamples(chunk);
}
