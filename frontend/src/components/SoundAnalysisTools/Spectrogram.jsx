import React, { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import colormap from "colormap";
import FFT from "fft.js";

const SpectrogramMesh = ({ audioFile, colorscale, xrange }) => {
  const frequencySamples = 512;
  const timeSamples = 400;
  const xSize = 40;
  const ySize = 20;

  const meshRef = useRef();
  const geometryRef = useRef(new THREE.BufferGeometry());
  const heights = useRef(
    new Uint8Array((frequencySamples + 1) * (timeSamples + 1))
  );

  const colors = useMemo(() => {
    return colormap({
      colormap: colorscale,
      nshades: 256,
      format: "rgba",
      alpha: 1,
    }).map((c) => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255));
  }, [colorscale]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        vLut: { value: colors },
      },
      vertexShader: `
        uniform vec3 vLut[256];
        attribute float displacement;
        varying vec3 vColor;
        void main() {
          vColor = vLut[int(displacement)];
          vec3 newPosition = position + normal * displacement * 0.05;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
    });
  }, [colors]);

  const defineGridGeometry = () => {
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

    geometryRef.current.setIndex(indices);
    geometryRef.current.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometryRef.current.setAttribute(
      "displacement",
      new THREE.Uint8BufferAttribute(heights.current, 1)
    );
    geometryRef.current.computeVertexNormals();
  };

  const computeSpectrogram = async () => {
    if (!audioFile || !xrange) return;

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = frequencySamples * 2;
    const hopSize = Math.floor(
      ((xrange[1] - xrange[0]) * sampleRate) / timeSamples
    );
    const startSample = Math.floor(xrange[0] * sampleRate);
    const endSample = Math.min(
      Math.floor(xrange[1] * sampleRate),
      channelData.length
    );

    const fft = new FFT(fftSize);
    const windowFunc = (i, N) =>
      0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));

    let minDb = Infinity;
    let maxDb = -Infinity;
    const magnitudes = []; // store dB values before normalization

    // --- Step 1: Gather magnitudes and track min/max dB
    for (let t = 0; t <= timeSamples; t++) {
      const offset = startSample + t * hopSize;
      const frame = new Float32Array(fftSize);

      for (let i = 0; i < fftSize && offset + i < endSample; i++) {
        frame[i] = channelData[offset + i] * windowFunc(i, fftSize);
      }

      const out = fft.createComplexArray();
      fft.realTransform(out, frame);
      fft.completeSpectrum(out);

      let row = [];
      for (let f = 0; f <= frequencySamples; f++) {
        const re = out[2 * f];
        const im = out[2 * f + 1];
        const mag = Math.sqrt(re * re + im * im);
        const db = 20 * Math.log10(mag + 1e-12); // use log scale and avoid log(0)
        minDb = Math.min(minDb, db);
        maxDb = Math.max(maxDb, db);
        row.push(db);
      }
      magnitudes.push(row);
    }

    // --- Step 2: Normalize to 0–255 and store in heights
    for (let t = 0; t <= timeSamples; t++) {
      for (let f = 0; f <= frequencySamples; f++) {
        const db = magnitudes[t][f];
        const norm = (db - minDb) / (maxDb - minDb); // normalize to 0–1
        const byteVal = Math.floor(norm * 255); // scale to 0–255
        heights.current[t * (frequencySamples + 1) + f] = byteVal;
      }
    }

    geometryRef.current.setAttribute(
      "displacement",
      new THREE.Uint8BufferAttribute(heights.current, 1)
    );
    geometryRef.current.attributes.displacement.needsUpdate = true;

    audioContext.close();
  };

  useEffect(() => {
    defineGridGeometry();
  }, []);

  useEffect(() => {
    computeSpectrogram();
  }, [audioFile, xrange]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometryRef.current}
      material={shaderMaterial}
    />
  );
};

const Spectrogram = ({ audioFile, colorscale, xrange }) => {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 75], fov: 20 }}>
        <ambientLight />
        <SpectrogramMesh
          audioFile={audioFile}
          colorscale={colorscale}
          xrange={xrange}
        />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Spectrogram;
