class DownsamplerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.sampleRateRatio = sampleRate / this.targetSampleRate;
    this.leftover = new Float32Array(0);
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

      // Transfer ownership of the buffer to minimize GC pressure
      this.port.postMessage(result, [result.buffer]);
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
