import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box } from "@mui/material";
import Axis from "./Axis";
import SpectrogramMesh from "./SpectrogramMesh";

const Spectrogram = ({
  audioFile,
  colorscale,
  currentTimeRange,
  currentFrequencyRange,
}) => {
  const frequencyTicks = useMemo(() => {
    if (!currentFrequencyRange) return [];
    const [minFreq, maxFreq] = currentFrequencyRange;
    const step = (maxFreq - minFreq) / 5;
    return Array.from({ length: 6 }, (_, i) => {
      const val = minFreq + i * step;
      return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val.toFixed(0)}`;
    });
  }, [currentFrequencyRange]);

  const timeTicks = useMemo(() => {
    if (!currentTimeRange) return [];
    const [minTime, maxTime] = currentTimeRange;
    const step = (maxTime - minTime) / 5;
    return Array.from({ length: 6 }, (_, i) => {
      const val = minTime + i * step;
      return val.toFixed(1);
    });
  }, [currentTimeRange]);

  const frequencySamples = 4096;
  const timeSamples = 1024;
  const xSize = 60;
  const ySize = 20;

  if (!audioFile) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          minHeight: "400px",
        }}
      >
        <div>No audio file loaded</div>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "400px" }}>
      <Canvas camera={{ position: [0, 0, 90], fov: 20 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <SpectrogramMesh
          audioFile={audioFile}
          colorscale={colorscale}
          currentTimeRange={currentTimeRange}
          currentFrequencyRange={currentFrequencyRange}
          xSize={xSize}
          ySize={ySize}
          frequencySamples={frequencySamples}
          timeSamples={timeSamples}
        />

        {currentTimeRange && currentTimeRange.length === 2 && (
          <Axis
            orientation="x"
            axisLength={xSize}
            numTicks={6}
            position={[0, -ySize / 2 - 2, 0]}
            tickLabels={timeTicks}
            label="Time (s)"
            key={`time-${currentTimeRange[0]}-${currentTimeRange[1]}`}
          />
        )}

        {currentFrequencyRange && currentFrequencyRange.length === 2 && (
          <Axis
            orientation="y"
            axisLength={ySize}
            numTicks={6}
            position={[-xSize / 2 - 2, 0, 0]}
            tickLabels={frequencyTicks}
            label="Frequency (Hz)"
            key={`freq-${currentFrequencyRange[0]}-${currentFrequencyRange[1]}`}
          />
        )}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </Box>
  );
};

export default Spectrogram;
