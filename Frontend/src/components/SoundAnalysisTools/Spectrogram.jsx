import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import colormap from "colormap";

const frequencySamples = 256;
const timeSamples = 400;
const xSize = 40;
const ySize = 20;

const Spectrogram = ({ audioFile }) => {
  const meshRef = useRef();
  const analyserRef = useRef();
  const data = new Uint8Array(frequencySamples);
  const heights = new Uint8Array((frequencySamples + 1) * (timeSamples + 1));

  const geometryRef = useRef(new THREE.BufferGeometry());

  // Generate colormap for LUT (color lookup table)
  const colors = colormap({
    colormap: "jet",
    nshades: 256,
    format: "rgba",
    alpha: 1,
  }).map(
    (color) => new THREE.Vector3(color[0] / 255, color[1] / 255, color[2] / 255)
  );

  useEffect(() => {
    if (audioFile) {
      const objectUrl = URL.createObjectURL(audioFile);
      const audio = new Audio(objectUrl);
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4 * frequencySamples;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyserRef.current = analyser;
      audio.play();

      return () => {
        URL.revokeObjectURL(objectUrl);
        audioContext.close();
      };
    }
  }, [audioFile]);

  // Create grid geometry
  useEffect(() => {
    const xSegments = timeSamples;
    const ySegments = frequencySamples;
    const xHalfSize = xSize / 2;
    const yHalfSize = ySize / 2;
    const xSegmentSize = xSize / xSegments;
    const ySegmentSize = ySize / ySegments;

    let vertices = [];
    let indices = [];

    const yPowMax = Math.log(ySize);
    const yBase = Math.E;

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

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometryRef.current.setIndex(indices);
    geometryRef.current.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometryRef.current.setAttribute(
      "displacement",
      new THREE.Uint8BufferAttribute(heights, 1)
    );
    geometryRef.current.computeVertexNormals();
  }, []);

  // Update geometry based on frequency data
  useFrame(() => {
    if (analyserRef.current && meshRef.current) {
      analyserRef.current.getByteFrequencyData(data);

      // Shift existing height data (create scrolling effect)
      const startVal = frequencySamples + 1;
      const endVal = heights.length - startVal;
      heights.copyWithin(0, startVal, heights.length);
      heights.set(data, endVal - startVal);

      // Update displacement
      geometryRef.current.setAttribute(
        "displacement",
        new THREE.Uint8BufferAttribute(heights, 1)
      );
      geometryRef.current.attributes.displacement.needsUpdate = true;
    }
  });

  // Create ShaderMaterial
  const shaderMaterial = new THREE.ShaderMaterial({
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

  return (
    <mesh
      ref={meshRef}
      geometry={geometryRef.current}
      material={shaderMaterial}
    />
  );
};

const SpectrogramVisualizer = ({ audioFile }) => {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 75], fov: 20 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[0, 10, 10]} intensity={2} />
        <Spectrogram audioFile={audioFile} />
        <OrbitControls
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
          minAzimuthAngle={(5 * Math.PI) / 3}
          maxAzimuthAngle={-(5 * Math.PI) / 3}
        />
      </Canvas>
    </div>
  );
};

export default SpectrogramVisualizer;
