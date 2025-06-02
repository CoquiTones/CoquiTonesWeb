import * as THREE from "three";
import FFT from "fft.js";

const defineGridGeometry = ({ geometry, xSize, ySize, timeSamples, frequencySamples }) => {
    const xSegments = timeSamples;
    const ySegments = frequencySamples;
    const xHalfSize = xSize / 2;
    const yHalfSize = ySize / 2;
    const xSegmentSize = xSize / xSegments;
    const yPowMax = Math.log(ySize);
    const yBase = Math.E;

    let vertices = [];
    let indices = [];

    for (let i = 0; i <= xSegments; i++) {
        let x = i * xSegmentSize - xHalfSize;
        for (let j = 0; j <= ySegments; j++) {
            let pow = ((ySegments - j) / ySegments) * yPowMax;
            let y = -Math.pow(yBase, pow) + yHalfSize + 1;
            vertices.push(x, y, 0);
        }
    }

    for (let i = 0; i < xSegments; i++) {
        for (let j = 0; j < ySegments; j++) {
            let a = i * (ySegments + 1) + (j + 1);
            let b = i * (ySegments + 1) + j;
            let c = (i + 1) * (ySegments + 1) + j;
            let d = (i + 1) * (ySegments + 1) + (j + 1);
            indices.push(a, b, d, b, c, d);
        }
    }

    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute(
        "displacement",
        new THREE.Uint8BufferAttribute(new Uint8Array((frequencySamples + 1) * (timeSamples + 1)), 1)
    );
    geometry.computeVertexNormals();
};

const computeSpectrogramData = async ({ audioFile, xrange, frequencySamples, timeSamples }) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const nyquist = sampleRate / 2;
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = frequencySamples * 2;
    const hopSize = Math.floor(((xrange[1] - xrange[0]) * sampleRate) / timeSamples);
    const startSample = Math.floor(xrange[0] * sampleRate);
    const endSample = Math.min(Math.floor(xrange[1] * sampleRate), channelData.length);

    const fft = new FFT(fftSize);
    const windowFunc = (i, N) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));

    const magnitudes = [];
    let actualTimeSamples = 0;
    let minDb = Infinity;
    let maxDb = -Infinity;

    for (let t = 0; t <= timeSamples; t++) {
        const offset = startSample + t * hopSize;
        if (offset + fftSize > endSample) break;

        const frame = new Float32Array(fftSize);
        for (let i = 0; i < fftSize; i++) {
            frame[i] = channelData[offset + i] * windowFunc(i, fftSize);
        }

        const out = fft.createComplexArray();
        fft.realTransform(out, frame);
        fft.completeSpectrum(out);

        const row = [];
        for (let f = 0; f <= frequencySamples; f++) {
            const re = out[2 * f];
            const im = out[2 * f + 1];
            const mag = Math.sqrt(re * re + im * im);
            const db = 20 * Math.log10(mag + 1e-12);
            row.push(db);
            if (db > maxDb) maxDb = db;
            if (db < minDb) minDb = db;
        }
        magnitudes.push(row);
        actualTimeSamples++;
    }

    const noiseFloor = Math.max(minDb, maxDb - 80);
    const heightMap = new Uint8Array((frequencySamples + 1) * (timeSamples + 1));

    for (let t = 0; t < actualTimeSamples; t++) {
        for (let f = 0; f <= frequencySamples; f++) {
            const db = magnitudes[t][f];
            const clippedDb = Math.max(noiseFloor, db);
            const norm = (clippedDb - noiseFloor) / (maxDb - noiseFloor);
            const byteVal = Math.floor(norm * 255);
            heightMap[t * (frequencySamples + 1) + f] = byteVal;
        }
    }

    await audioContext.close();

    return { heightMap, sampleRate, nyquist };
};

export const setSpectrogramData = async ({
    audioFile,
    geometryRef,
    xSize,
    ySize,
    xrange,
    yrange,
    frequencySamples,
    timeSamples,
}) => {
    if (!audioFile || !xrange || !yrange) return;

    const result = await computeSpectrogramData({
        audioFile,
        xrange,
        frequencySamples,
        timeSamples,
    });

    if (!result) return;

    const { heightMap, nyquist } = result;

    const totalFreqBins = frequencySamples + 1;
    const minBin = Math.floor((yrange[0] / nyquist) * totalFreqBins);
    const maxBin = Math.min(Math.ceil((yrange[1] / nyquist) * totalFreqBins), totalFreqBins);
    const clippedFreqBins = maxBin - minBin;

    const clippedHeightMap = new Uint8Array((timeSamples + 1) * clippedFreqBins);

    for (let t = 0; t <= timeSamples; t++) {
        for (let f = 0; f < clippedFreqBins; f++) {
            const originalIndex = t * totalFreqBins + (minBin + f);
            const newIndex = t * clippedFreqBins + f;
            clippedHeightMap[newIndex] = heightMap[originalIndex];
        }
    }

    defineGridGeometry({
        geometry: geometryRef.current,
        xSize,
        ySize,
        timeSamples,
        frequencySamples: clippedFreqBins - 1,
    });

    geometryRef.current.setAttribute(
        "displacement",
        new THREE.Uint8BufferAttribute(clippedHeightMap, 1)
    );
    geometryRef.current.attributes.displacement.needsUpdate = true;
};
