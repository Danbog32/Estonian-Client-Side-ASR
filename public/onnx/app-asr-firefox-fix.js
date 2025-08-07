// Firefox-compatible audio context initialization
function createCompatibleAudioContext() {
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  
  if (isFirefox) {
    // For Firefox, create AudioContext without specifying sample rate
    // This will use the default sample rate (usually 48000 Hz)
    // We'll handle resampling manually in the audio processing
    return new AudioContext();
  } else {
    // For Chrome and other browsers, use the optimized 16000 Hz sample rate
    try {
      return new AudioContext({ sampleRate: 16000 });
    } catch (e) {
      // Fallback if 16000 Hz is not supported
      console.warn('16000 Hz sample rate not supported, using default');
      return new AudioContext();
    }
  }
}

// Enhanced downsampling function that handles any source sample rate
function downsampleToTarget(buffer, sourceSampleRate, targetSampleRate = 16000) {
  if (sourceSampleRate === targetSampleRate) {
    return buffer;
  }
  
  const sampleRateRatio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  
  // Use linear interpolation for better quality resampling
  for (let i = 0; i < newLength; i++) {
    const position = i * sampleRateRatio;
    const index = Math.floor(position);
    const fraction = position - index;
    
    if (index + 1 < buffer.length) {
      // Linear interpolation between samples
      result[i] = buffer[index] * (1 - fraction) + buffer[index + 1] * fraction;
    } else {
      result[i] = buffer[index];
    }
  }
  
  return result;
}

// Replace the existing AudioContext creation (line 676) with:
// audioCtx = createCompatibleAudioContext();

// In the onaudioprocess handler, always downsample to 16000 Hz:
// let samples = new Float32Array(e.inputBuffer.getChannelData(0));
// samples = downsampleToTarget(samples, audioCtx.sampleRate, 16000);

// Export for use in main file
if (typeof window !== 'undefined') {
  window.createCompatibleAudioContext = createCompatibleAudioContext;
  window.downsampleToTarget = downsampleToTarget;
}