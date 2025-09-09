class DownsamplerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.sampleRateRatio = sampleRate / this.targetSampleRate;
    this.leftover = new Float32Array(0);

    // Shared ring buffer state
    this.sabEnabled = false;
    this.ringData = null; // Float32Array view of SharedArrayBuffer
    this.ringCtrl = null; // Int32Array [writeIndex, readIndex, flags]
    this.ringCapacity = 0;

    this.IDX_WRITE = 0;
    this.IDX_READ = 1;
    this.IDX_FLAGS = 2;

    this.port.onmessage = (e) => {
      const msg = e.data || {};
      if (msg.type === "sab_init" && msg.dataSab && msg.controlSab) {
        try {
          this.ringData = new Float32Array(msg.dataSab);
          this.ringCtrl = new Int32Array(msg.controlSab);
          this.ringCapacity = this.ringData.length;
          this.sabEnabled = true;
        } catch (_) {
          this.sabEnabled = false;
        }
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || input[0].length === 0) {
      return true;
    }

    const channelData = input[0];

    // Concatenate leftover with the new chunk
    let source;
    if (this.leftover.length > 0) {
      source = new Float32Array(this.leftover.length + channelData.length);
      source.set(this.leftover, 0);
      source.set(channelData, this.leftover.length);
    } else {
      // Avoid copy when there's no leftover
      source = channelData;
    }

    const ratio = this.sampleRateRatio;
    const newLength = Math.floor(source.length / ratio);

    if (newLength > 0) {
      const result = new Float32Array(newLength);

      let offsetBuffer = 0;
      for (let i = 0; i < newLength; i++) {
        const nextOffsetBuffer = Math.round((i + 1) * ratio);
        let sum = 0;
        let count = 0;
        for (
          let j = offsetBuffer;
          j < nextOffsetBuffer && j < source.length;
          j++
        ) {
          sum += source[j];
          count++;
        }
        result[i] = count > 0 ? sum / count : 0;
        offsetBuffer = nextOffsetBuffer;
      }

      const processedCount = Math.round(newLength * ratio);
      const remaining = source.length - processedCount;
      if (remaining > 0) {
        this.leftover = source.slice(processedCount);
      } else {
        this.leftover = new Float32Array(0);
      }

      if (this.sabEnabled && this.ringData && this.ringCtrl) {
        // Write to shared ring buffer using Atomics to coordinate with consumer
        const capacity = this.ringCapacity;
        let w = Atomics.load(this.ringCtrl, this.IDX_WRITE);
        let r = Atomics.load(this.ringCtrl, this.IDX_READ);
        const used = (w - r + capacity) % capacity;
        const free = capacity - used - 1;

        let writeCount = result.length;
        if (writeCount > capacity - 1) {
          // If result larger than capacity, only keep the tail
          writeCount = capacity - 1;
        }

        if (writeCount > free) {
          // Drop the oldest samples by advancing read index
          const drop = writeCount - free;
          r = (r + drop) % capacity;
          Atomics.store(this.ringCtrl, this.IDX_READ, r);
        }

        // Recompute used and free space after potential drop
        w = Atomics.load(this.ringCtrl, this.IDX_WRITE);
        r = Atomics.load(this.ringCtrl, this.IDX_READ);

        // Write in up to two segments due to wrap-around
        const firstPart = Math.min(writeCount, capacity - w);
        if (firstPart > 0) {
          this.ringData.set(result.subarray(0, firstPart), w);
        }
        const secondPart = writeCount - firstPart;
        if (secondPart > 0) {
          this.ringData.set(
            result.subarray(firstPart, firstPart + secondPart),
            0
          );
        }

        // Publish new write index
        Atomics.store(
          this.ringCtrl,
          this.IDX_WRITE,
          (w + writeCount) % capacity
        );
        // Optional: wake a waiting consumer
        Atomics.notify?.(this.ringCtrl, this.IDX_WRITE, 1);
      } else {
        // Fallback: postMessage to main thread
        this.port.postMessage(result, [result.buffer]);
      }
    } else {
      // Not enough data to produce a 16 kHz frame yet
      if (source !== channelData) {
        // Only set when we created a new array (to avoid aliasing)
        this.leftover = source;
      } else {
        // Copy channelData into leftover to keep a stable reference across calls
        this.leftover = new Float32Array(channelData.length);
        this.leftover.set(channelData);
      }
    }

    return true;
  }
}

registerProcessor("downsampler", DownsamplerProcessor);
