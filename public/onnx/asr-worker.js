// ASR Worker: runs sherpa-onnx recognizer off the main thread

// Ensure a Module exists in worker scope
self.Module = self.Module || {};

// Resolve wasm/data paths from /public/onnx
Module.locateFile = function (path) {
  return "/onnx/" + path;
};

// Load sherpa bindings and the emscripten runtime in the worker
importScripts("/onnx/sherpa-onnx-asr.js");
importScripts("/onnx/sherpa-onnx-wasm-main-asr-v2.js");

let recognizer = null;
let recognizer_stream = null;
let expectedSampleRate = 16000;
let lastDecodeTs = 0;
let lastText = "";

// SharedArrayBuffer reader state
let sabEnabled = false;
let ringData = null; // Float32Array view of samples
let ringCtrl = null; // Int32Array [writeIndex, readIndex, flags]
let ringCapacity = 0;
const IDX_WRITE = 0;
const IDX_READ = 1;
const IDX_FLAGS = 2;

Module.onRuntimeInitialized = function () {
  try {
    recognizer = createOnlineRecognizer(Module);
    self.postMessage({ type: "initialized" });
  } catch (e) {
    self.postMessage({ type: "error", error: String(e) });
  }
};

function processSamples(samples) {
  if (!recognizer) return;
  if (!recognizer_stream) {
    recognizer_stream = recognizer.createStream();
  }

  recognizer_stream.acceptWaveform(expectedSampleRate, samples);

  const now =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  if (now - lastDecodeTs < 50) {
    return;
  }
  lastDecodeTs = now;

  while (recognizer.isReady(recognizer_stream)) {
    recognizer.decode(recognizer_stream);
  }

  let result = recognizer.getResult(recognizer_stream).text;

  // Paraformer tail paddings flush
  try {
    if (recognizer.config.modelConfig.paraformer.encoder !== "") {
      const tailPaddings = new Float32Array(expectedSampleRate);
      recognizer_stream.acceptWaveform(expectedSampleRate, tailPaddings);
      while (recognizer.isReady(recognizer_stream)) {
        recognizer.decode(recognizer_stream);
      }
      result = recognizer.getResult(recognizer_stream).text;
    }
  } catch (_) {
    // best effort
  }

  const isEndpoint = recognizer.isEndpoint(recognizer_stream);

  if (result && result !== lastText) {
    lastText = result;
    self.postMessage({ type: "partial", text: result });
  }

  if (isEndpoint) {
    const finalText = lastText;
    if (finalText && finalText.length > 0) {
      self.postMessage({ type: "final", text: finalText });
    }
    recognizer.reset(recognizer_stream);
    lastText = "";
  }
}

self.onmessage = function (e) {
  const msg = e.data || {};
  switch (msg.type) {
    case "init": {
      if (typeof msg.expectedSampleRate === "number") {
        expectedSampleRate = msg.expectedSampleRate;
      }
      break;
    }
    case "sab_setup": {
      try {
        if (msg.dataSab && msg.controlSab && typeof msg.capacity === "number") {
          ringData = new Float32Array(msg.dataSab);
          ringCtrl = new Int32Array(msg.controlSab);
          ringCapacity = msg.capacity;
          sabEnabled = true;
          // Start a lightweight read loop using setInterval to avoid blocking
          // 16kHz mono: 256 samples ~16ms, so poll ~10ms
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
      try {
        if (recognizer && recognizer_stream) {
          recognizer.reset(recognizer_stream);
        }
        lastText = "";
      } catch (_) {}
      break;
    }
    case "free": {
      try {
        if (recognizer_stream) {
          // No explicit free API for stream beyond reset/destroy in bindings; keep minimal
        }
        if (recognizer) {
          recognizer.free?.();
        }
      } catch (_) {}
      break;
    }
  }
};

function drainRingToRecognizer() {
  if (!sabEnabled || !ringData || !ringCtrl) return;
  let w = Atomics.load(ringCtrl, IDX_WRITE);
  let r = Atomics.load(ringCtrl, IDX_READ);
  const capacity = ringCapacity || ringData.length;
  const available = (w - r + capacity) % capacity;
  if (available === 0) return;

  // Read up to a chunk (e.g., 1024 samples) to limit per-iteration work
  const toRead = Math.min(1024, available);
  const chunk = new Float32Array(toRead);

  const firstPart = Math.min(toRead, capacity - r);
  if (firstPart > 0) {
    chunk.set(ringData.subarray(r, r + firstPart), 0);
  }
  const secondPart = toRead - firstPart;
  if (secondPart > 0) {
    chunk.set(ringData.subarray(0, secondPart), firstPart);
  }

  // Advance read index
  Atomics.store(ringCtrl, IDX_READ, (r + toRead) % capacity);

  // Feed to recognizer
  processSamples(chunk);
}
