// ASR worker: runs sherpa-onnx recognizer off the main thread.

const runtimeState = {
  bootstrapped: false,
  loading: false,
  ready: false,
  readyPromise: null,
};

let recognizer = null;
let recognizerStream = null;
let expectedSampleRate = 16000;
let lastDecodeTs = 0;
let lastText = "";
let paused = false;
let segmentationMode = "vad";
let legacyUtteranceCounter = 0;
let currentUtteranceId = null;
let currentSourceType = "microphone";
let currentSourceTimeSec = null;
let currentSourceDurationSec = null;

let sabEnabled = false;
let ringData = null;
let ringCtrl = null;
let ringCapacity = 0;
const IDX_WRITE = 0;
const IDX_READ = 1;
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
      maybeInitializeRecognizer();
    };

    try {
      if (!runtimeState.bootstrapped) {
        runtimeState.bootstrapped = true;
        importScripts("/onnx/sherpa-onnx-asr.js");
        importScripts("/onnx/sherpa-onnx-wasm-main-asr-v2.js");
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

function freeRecognizer() {
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
  currentSourceType = "microphone";
  currentSourceTimeSec = null;
  currentSourceDurationSec = null;
}

function updateSourceContext(message = {}) {
  currentSourceType = message.sourceType === "file" ? "file" : "microphone";
  currentSourceTimeSec =
    typeof message.sourceTimeSec === "number" ? message.sourceTimeSec : null;
  currentSourceDurationSec =
    typeof message.sourceDurationSec === "number" ? message.sourceDurationSec : null;
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
      sourceType: currentSourceType,
      sourceTimeSec: currentSourceTimeSec,
      sourceDurationSec: currentSourceDurationSec,
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
    sourceType: currentSourceType,
    sourceTimeSec: currentSourceTimeSec,
    sourceDurationSec: currentSourceDurationSec,
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

function finalizeCurrentUtterance(forceInputFinished, shouldNotifyFlush = false) {
  if (!recognizer || !recognizerStream) {
    if (shouldNotifyFlush) {
      self.postMessage({ type: "flush_complete" });
    }
    return;
  }

  const activeUtteranceId =
    currentUtteranceId ||
    (segmentationMode === "legacy"
      ? `legacy-${legacyUtteranceCounter + 1}`
      : null);

  if (!activeUtteranceId) {
    resetStreamState();
    if (shouldNotifyFlush) {
      self.postMessage({ type: "flush_complete" });
    }
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
      sourceType: currentSourceType,
      sourceTimeSec: currentSourceTimeSec,
      sourceDurationSec: currentSourceDurationSec,
    });
  }

  resetStreamState();
  if (shouldNotifyFlush) {
    self.postMessage({ type: "flush_complete" });
  }
}

function processSamples(samples, options = {}) {
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

  if (!options.forceDecode && now - lastDecodeTs < 50) {
    return;
  }

  lastDecodeTs = now;
  const result = decodeReadyFrames();
  emitPartial(result);

  if (segmentationMode === "legacy" && recognizer.isEndpoint(recognizerStream)) {
    finalizeCurrentUtterance(false);
  }
}

function maybeInitializeRecognizer() {
  if (!runtimeState.ready || !initRequested || initNotified) {
    return;
  }

  try {
    const module = getModule();
    freeRecognizer();
    recognizer = createOnlineRecognizer(
      module,
      buildRecognizerConfig(segmentationMode)
    );
    initNotified = true;
    self.postMessage({ type: "initialized", mode: segmentationMode });
  } catch (e) {
    postInitError(e);
  }
}

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
      initNotified = false;
      bootstrapRuntimeOnce().then(maybeInitializeRecognizer).catch(postInitError);
      maybeInitializeRecognizer();
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
      updateSourceContext(msg);
      currentUtteranceId = msg.utteranceId || currentUtteranceId;
      if (currentUtteranceId && lastText) {
        self.postMessage({
          type: "partial",
          utteranceId: currentUtteranceId,
          text: lastText,
          sourceType: currentSourceType,
          sourceTimeSec: currentSourceTimeSec,
          sourceDurationSec: currentSourceDurationSec,
        });
      }
      break;
    }
    case "end_utterance": {
      updateSourceContext(msg);
      finalizeCurrentUtterance(true, true);
      break;
    }
    case "force_finalize": {
      updateSourceContext(msg);
      finalizeCurrentUtterance(true, true);
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
      updateSourceContext(msg);
      let samples = msg.samples;
      if (!(samples instanceof Float32Array) && samples?.buffer) {
        samples = new Float32Array(samples);
      }
      if (samples && samples.length) {
        processSamples(samples, {
          forceDecode: Boolean(msg.forceDecode),
        });
      }
      break;
    }
    case "reset": {
      resetStreamState();
      legacyUtteranceCounter = 0;
      break;
    }
    case "free": {
      initNotified = false;
      freeRecognizer();
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
