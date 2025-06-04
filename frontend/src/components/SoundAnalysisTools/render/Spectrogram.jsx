import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import colormap from "colormap";
import { setSpectrogramData } from "../processing/SpectrogramDataComputer";
import Axis from "./Axis";

const SpectrogramMesh = ({
  audioFile,
  colorscale = "inferno",
  xrange,
  yrange,
  xSize,
  ySize,
  frequencySamples,
  timeSamples,
}) => {
  const meshRef = useRef();
  const geometryRef = useRef(new THREE.BufferGeometry());

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
    });
  }, [colors]);

  useEffect(() => {
    setSpectrogramData({
      audioFile,
      geometryRef,
      xSize,
      ySize,
      xrange,
      yrange,
      frequencySamples,
      timeSamples,
    });
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
  const frequencyTicks = useMemo(() => {
    const step = (yrange[1] - yrange[0]) / 5;
    return Array.from({ length: 6 }, (_, i) => {
      const val = yrange[1] - i * step;
      return val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val.toFixed(0)}`;
    });
  }, [yrange]);

  const timeTicks = useMemo(() => {
    const step = (xrange[1] - xrange[0]) / 5;
    return Array.from({ length: 6 }, (_, i) =>
      (xrange[0] + i * step).toFixed(1)
    );
  }, [xrange]);

  // TODO: Add these as additional settings in
  const frequencySamples = 2048;
  const timeSamples = 1024;
  const xSize = 60;
  const ySize = 20;
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 90], fov: 20 }}>
        <ambientLight />

        <SpectrogramMesh
          audioFile={audioFile}
          colorscale={colorscale}
          xrange={xrange}
          yrange={yrange}
          xSize={xSize}
          ySize={ySize}
          frequencySamples={frequencySamples}
          timeSamples={timeSamples}
        />

        <Axis
          orientation="x"
          axisLength={xSize}
          numTicks={6}
          position={[0, -11, 0]}
          tickLabels={timeTicks}
          label="Time (s)"
        />

        <Axis
          orientation="y"
          axisLength={ySize}
          numTicks={6}
          position={[-xSize / 2 - 1, 0, 0]}
          tickLabels={frequencyTicks}
          label="Frequency (Hz)"
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default Spectrogram;
