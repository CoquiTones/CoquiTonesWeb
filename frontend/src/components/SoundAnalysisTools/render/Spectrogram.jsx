import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Axis from "./Axis";
import SpectrogramMesh from "./SpectrogramMesh";

// TODO: Fix Axis, frequency and actual spec data doesnt line up
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
