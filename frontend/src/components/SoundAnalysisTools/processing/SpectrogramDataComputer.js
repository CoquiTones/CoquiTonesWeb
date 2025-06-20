import * as THREE from "three";
import FFT from "fft.js";

// Pure function to create grid geometry data
// Linear Y-axis implementation
const createGridGeometryData = ({ xSize, ySize, timeSamples, frequencySamples }) => {
    const xSegments = timeSamples;
    const ySegments = frequencySamples;
    const xHalfSize = xSize / 2;
    const yHalfSize = ySize / 2;
    const xSegmentSize = xSize / xSegments;
    const ySegmentSize = ySize / ySegments;

    const vertices = [];
    const indices = [];

    for (let i = 0; i <= xSegments; i++) {
        const x = i * xSegmentSize - xHalfSize;
        for (let j = 0; j <= ySegments; j++) {
            const y = j * ySegmentSize - yHalfSize;
            vertices.push(x, y, 0);
        }
    }

    for (let i = 0; i < xSegments; i++) {
        for (let j = 0; j < ySegments; j++) {
            const a = i * (ySegments + 1) + (j + 1);
            const b = i * (ySegments + 1) + j;
            const c = (i + 1) * (ySegments + 1) + j;
            const d = (i + 1) * (ySegments + 1) + (j + 1);
            indices.push(a, b, d, b, c, d);
        }
    }

    return { vertices, indices };
};

// Pure function to create a THREE.BufferGeometry from data
const createGeometryFromData = ({ vertices, indices, displacementData }) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

    if (displacementData) {
        geometry.setAttribute(
            "displacement",
            new THREE.Uint8BufferAttribute(displacementData, 1)
        );
    }

    geometry.computeVertexNormals();
    return geometry;
};

// Pure function to compute FFT frame
const computeFFTFrame = ({ fft, frame, windowFunc }) => {
    const out = fft.createComplexArray();
    fft.realTransform(out, frame);
    fft.completeSpectrum(out);
    return out;
};

// Pure function to process audio data into spectrogram
const processAudioData = ({
    channelData,
    sampleRate,
    currentTimeRange,
    frequencySamples,
    timeSamples
}) => {
    const nyquist = sampleRate / 2;
    const fftSize = frequencySamples * 2;
    const hopSize = Math.floor(((currentTimeRange[1] - currentTimeRange[0]) * sampleRate) / timeSamples);
    const startSample = Math.floor(currentTimeRange[0] * sampleRate);
    const endSample = Math.min(Math.floor(currentTimeRange[1] * sampleRate), channelData.length);

    const fft = new FFT(fftSize);
    const windowFunc = (i, N) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));

    let minDb = Infinity;
    let maxDb = -Infinity;
    const magnitudes = [];

    for (let t = 0; t <= timeSamples; t++) {
        const offset = startSample + t * hopSize;
        if (offset + fftSize > endSample) break;

        const frame = new Float32Array(fftSize);
        for (let i = 0; i < fftSize; i++) {
            frame[i] = channelData[offset + i] * windowFunc(i, fftSize);
        }

        const out = computeFFTFrame({ fft, frame, windowFunc });
        const row = [];

        for (let f = 0; f <= frequencySamples; f++) {
            const re = out[2 * f];
            const im = out[2 * f + 1];
            const mag = Math.sqrt(re * re + im * im);
            const db = 20 * Math.log10(mag + 1e-12);
            row.push(db);
            minDb = Math.min(minDb, db);
            maxDb = Math.max(maxDb, db);
        }
        magnitudes.push(row);
    }

    return { magnitudes, minDb, maxDb, nyquist, actualTimeSamples: magnitudes.length };
};

// Pure function to normalize magnitude data to height map
const createHeightMap = ({ magnitudes, minDb, maxDb, frequencySamples, actualTimeSamples }) => {
    const noiseFloor = Math.max(minDb, maxDb - 80);
    const heightMap = new Uint8Array((frequencySamples + 1) * (actualTimeSamples + 1));

    for (let t = 0; t < actualTimeSamples; t++) {
        for (let f = 0; f <= frequencySamples; f++) {
            const db = magnitudes[t][f];
            const clippedDb = Math.max(noiseFloor, db);
            const norm = (clippedDb - noiseFloor) / (maxDb - noiseFloor);
            const byteVal = Math.floor(norm * 255);
            heightMap[t * (frequencySamples + 1) + f] = byteVal;
        }
    }

    return heightMap;
};

// Pure function to clip frequency range
const clipFrequenccurrentFrequencyRange = ({
    heightMap,
    nyquist,
    currentFrequencyRange,
    frequencySamples,
    timeSamples
}) => {
    const totalFreqBins = frequencySamples + 1;
    const minBin = Math.floor((currentFrequencyRange[0] / nyquist) * totalFreqBins);
    const maxBin = Math.min(Math.ceil((currentFrequencyRange[1] / nyquist) * totalFreqBins), totalFreqBins);
    const clippedFreqBins = maxBin - minBin;

    const clippedHeightMap = new Uint8Array((timeSamples + 1) * clippedFreqBins);

    for (let t = 0; t <= timeSamples; t++) {
        for (let f = 0; f < clippedFreqBins; f++) {
            const originalIndex = t * totalFreqBins + (minBin + f);
            const newIndex = t * clippedFreqBins + f;
            clippedHeightMap[newIndex] = heightMap[originalIndex];
        }
    }

    return {
        clippedHeightMap,
        clippedFreqBins: clippedFreqBins - 1
    };
};

// Main function to compute spectrogram data (pure)
export const computeSpectrogramData = async ({
    audioFile,
    currentTimeRange,
    frequencySamples,
    timeSamples
}) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const result = processAudioData({
        channelData: audioBuffer.getChannelData(0),
        sampleRate: audioBuffer.sampleRate,
        currentTimeRange,
        frequencySamples,
        timeSamples
    });

    const heightMap = createHeightMap({
        magnitudes: result.magnitudes,
        minDb: result.minDb,
        maxDb: result.maxDb,
        frequencySamples,
        actualTimeSamples: result.actualTimeSamples
    });

    await audioContext.close();

    return {
        heightMap,
        sampleRate: audioBuffer.sampleRate,
        nyquist: result.nyquist
    };
};

// Function to create spectrogram geometry (pure)
export const createSpectrogramGeometry = ({
    heightMap,
    nyquist,
    xSize,
    ySize,
    currentTimeRange,
    currentFrequencyRange,
    frequencySamples,
    timeSamples
}) => {
    const { clippedHeightMap, clippedFreqBins } = clipFrequenccurrentFrequencyRange({
        heightMap,
        nyquist,
        currentFrequencyRange,
        frequencySamples,
        timeSamples
    });

    const gridData = createGridGeometryData({
        xSize,
        ySize,
        timeSamples,
        frequencySamples: clippedFreqBins
    });

    return createGeometryFromData({
        vertices: gridData.vertices,
        indices: gridData.indices,
        displacementData: clippedHeightMap
    });
};

// Function to update existing geometry (minimal mutation)
export const updateSpectrogramGeometry = ({
    geometry,
    heightMap,
    nyquist,
    currentFrequencyRange,
    frequencySamples,
    timeSamples
}) => {
    const { clippedHeightMap } = clipFrequenccurrentFrequencyRange({
        heightMap,
        nyquist,
        currentFrequencyRange,
        frequencySamples,
        timeSamples
    });

    geometry.setAttribute(
        "displacement",
        new THREE.Uint8BufferAttribute(clippedHeightMap, 1)
    );
    geometry.attributes.displacement.needsUpdate = true;
    return geometry;
};

// Clip both time and frequency ranges from full spectrogram
export const clipSpectrogramRegion = ({
    heightMap,
    nyquist,
    currentTimeRange,
    currentFrequencyRange,
    timeSamples,
    frequencySamples,
    fullDuration,
}) => {
    const totalTimeBins = timeSamples + 1;
    const totalFreqBins = frequencySamples + 1;

    const timeStart = Math.floor((currentTimeRange[0] / fullDuration) * totalTimeBins);
    const timeEnd = Math.ceil((currentTimeRange[1] / fullDuration) * totalTimeBins);
    const clippedTimeBins = timeEnd - timeStart;

    const minFreqBin = Math.floor((currentFrequencyRange[0] / nyquist) * totalFreqBins);
    const maxFreqBin = Math.min(Math.ceil((currentFrequencyRange[1] / nyquist) * totalFreqBins), totalFreqBins);
    const clippedFreqBins = maxFreqBin - minFreqBin;

    const clippedHeightMap = new Uint8Array(clippedTimeBins * clippedFreqBins);

    for (let t = 0; t < clippedTimeBins; t++) {
        for (let f = 0; f < clippedFreqBins; f++) {
            const originalIndex = (timeStart + t) * totalFreqBins + (minFreqBin + f);
            const newIndex = t * clippedFreqBins + f;
            clippedHeightMap[newIndex] = heightMap[originalIndex];
        }
    }

    return {
        clippedHeightMap,
        clippedTimeBins: clippedTimeBins - 1,
        clippedFreqBins: clippedFreqBins - 1,
    };
};


