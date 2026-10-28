const DEFAULT_SAMPLE_RATE = 44100;

const clampSample = (value) => Math.max(-1, Math.min(1, value));

const makeSamples = (sampleRate, duration) => new Float32Array(Math.max(1, Math.round(sampleRate * duration)));

/**
 * Deterministic synthetic signal helpers used by the spectrogram tests.
 * All helpers return `{ samples, sampleRate, duration, channels }`.
 */
export const makeSine = ({
  sampleRate = DEFAULT_SAMPLE_RATE,
  duration = 5,
  frequency = 1000,
  amplitude = 0.999,
  startTime = 0,
  endTime = duration,
  channels = 1,
} = {}) => {
  const samples = makeSamples(sampleRate, duration);
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    if (time >= startTime && time < endTime) {
      samples[index] = amplitude * Math.sin(2 * Math.PI * frequency * time);
    }
  }
  return { samples, sampleRate, duration, channels };
};

export const makeSilence = ({
  sampleRate = DEFAULT_SAMPLE_RATE,
  duration = 5,
  channels = 1,
} = {}) => ({
  samples: makeSamples(sampleRate, duration),
  sampleRate,
  duration,
  channels,
});

export const makeConstant = ({
  sampleRate = DEFAULT_SAMPLE_RATE,
  duration = 5,
  value = 0.5,
  channels = 1,
} = {}) => {
  const samples = makeSamples(sampleRate, duration);
  samples.fill(value);
  return { samples, sampleRate, duration, channels };
};

export const makeShortBuffer = ({
  sampleRate = DEFAULT_SAMPLE_RATE,
  samples = 100,
} = {}) => {
  const data = new Float32Array(samples);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = 0.5 * Math.sin((2 * Math.PI * 1000 * index) / sampleRate);
  }
  return { samples: data, sampleRate, duration: samples / sampleRate, channels: 1 };
};

export const makeSweep = ({
  sampleRate = DEFAULT_SAMPLE_RATE,
  duration = 2,
  startFrequency = 500,
  endFrequency = 5000,
  amplitude = 0.8,
} = {}) => {
  const samples = makeSamples(sampleRate, duration);
  const sweepRate = (endFrequency - startFrequency) / duration;
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    const phase = 2 * Math.PI * (startFrequency * time + 0.5 * sweepRate * time * time);
    samples[index] = amplitude * Math.sin(phase);
  }
  return { samples, sampleRate, duration, channels: 1 };
};

const writeAscii = (view, offset, text) => {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
};

export const encodeWav = ({ samples, sampleRate = DEFAULT_SAMPLE_RATE, channels = 1 }) => {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);
  const dataSize = samples.length * bytesPerSample;

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(44 + index * bytesPerSample, Math.round(clampSample(samples[index]) * 32767), true);
  }

  return buffer;
};

export const makeWavFile = ({
  samples,
  sampleRate = DEFAULT_SAMPLE_RATE,
  name = 'synthetic.wav',
  channels = 1,
} = {}) =>
  new File([encodeWav({ samples, sampleRate, channels })], name, {
    type: 'audio/wav',
    lastModified: 0,
  });

export const makeSineFile = (options = {}) => {
  const signal = makeSine(options);
  return makeWavFile({
    samples: signal.samples,
    sampleRate: signal.sampleRate,
    name: options.name ?? 'synthetic.wav',
    channels: signal.channels,
  });
};
