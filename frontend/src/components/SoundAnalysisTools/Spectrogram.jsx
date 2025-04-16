import React, { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import colormap from "colormap";
import { defineGridGeometry, computeSpectrogramData } from "./SpectrogramUtils";
import Axis from "./Axis";

const SpectrogramMesh = ({
  audioFile,
  colorscale = "inferno",
  xrange,
  yrange,
}) => {
  const frequencySamples = 1024;
  const timeSamples = 512;
  const xSize = 60;
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

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { vLut: { value: colors } },
        vertexShader: `
      uniform vec3 vLut[256];
      attribute float displacement;
      varying vec3 vColor;
      void main() {
        vColor = vLut[int(displacement)];
        vec3 newPosition = position + normal * displacement * 0.03;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `,
      }),
    [colors]
  );

  const updateDisplacementAttribute = async () => {
    if (!audioFile || !xrange || !yrange) return;

    const result = await computeSpectrogramData({
      audioFile,
      xrange,
      yrange,
      frequencySamples,
      timeSamples,
    });

    if (!result) return;

    const { heightMap } = result;

    for (let i = 0; i < heightMap.length; i++) {
      heights.current[i] = heightMap[i];
    }

    geometryRef.current.setAttribute(
      "displacement",
      new THREE.Uint8BufferAttribute(heights.current, 1)
    );
    geometryRef.current.attributes.displacement.needsUpdate = true;
  };

  useEffect(() => {
    defineGridGeometry({
      geometry: geometryRef.current,
      xSize,
      ySize,
      timeSamples,
      frequencySamples,
    });
  }, []);

  useEffect(() => {
    updateDisplacementAttribute();
  }, [audioFile, xrange, yrange]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometryRef.current}
      material={shaderMaterial}
    />
  );
};

const Spectrogram = ({ audioFile, colorscale, xrange, yrange }) => {
  const xSize = 60;
  const ySize = 20;
  const frequencyTicks = useMemo(() => {
    const step = (yrange[1] - yrange[0]) / 5;
    return Array.from({ length: 6 }, (_, i) => {
      const val = yrange[0] + i * step; // low to high
      return val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val.toFixed(0)}`;
    });
  }, [yrange]);

  const timeTicks = useMemo(() => {
    const step = (xrange[1] - xrange[0]) / 5;
    return Array.from({ length: 6 }, (_, i) =>
      (xrange[0] + i * step).toFixed(1)
    );
  }, [xrange]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 90], fov: 20 }}>
        <ambientLight />

        {/* Spectrogram Mesh */}
        <SpectrogramMesh
          audioFile={audioFile}
          colorscale={colorscale}
          xrange={xrange}
          yrange={yrange}
        />

        {/* X Axis: Time */}
        <Axis
          orientation="x"
          axisLength={xSize}
          numTicks={6}
          position={[0, -10.5, 0]} // below mesh
          tickLabels={timeTicks}
          label="Time (s)"
        />

        {/* Y Axis: Frequency */}
        <Axis
          orientation="y"
          axisLength={ySize}
          numTicks={6}
          position={[-xSize / 2 - 1, 0, 0]} // to left of mesh
          tickLabels={frequencyTicks}
          label="Frequency (Hz)"
        />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default Spectrogram;
