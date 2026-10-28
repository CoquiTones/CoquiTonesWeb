import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';

import Axis from './Axis';
import SpectrogramMesh from './SpectrogramMesh';

const X_SIZE = 60;
const Y_SIZE = 20;
const FREQUENCY_SAMPLES = 4096;
const TIME_SAMPLES = 1024;

/**
 * 3D spectrogram canvas with time/frequency axes.
 */
export default function Spectrogram({ audioFile, colorscale, currentTimeRange, currentFrequencyRange }) {
  const frequencyTicks = useMemo(() => {
    if (!currentFrequencyRange) return [];
    const [minFreq, maxFreq] = currentFrequencyRange;
    const step = (maxFreq - minFreq) / 5;
    return Array.from({ length: 6 }, (_, index) => {
      const value = minFreq + index * step;
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value.toFixed(0)}`;
    });
  }, [currentFrequencyRange]);

  const timeTicks = useMemo(() => {
    if (!currentTimeRange) return [];
    const [minTime, maxTime] = currentTimeRange;
    const step = (maxTime - minTime) / 5;
    return Array.from({ length: 6 }, (_, index) => (minTime + index * step).toFixed(1));
  }, [currentTimeRange]);

  if (!audioFile) {
    return (
      <Box
        sx={{
          height: '100%',
          minHeight: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          color: 'text.secondary',
        }}
      >
        <GraphicEqRoundedIcon sx={{ fontSize: 44 }} aria-hidden="true" />
        <Typography component="p" variant="subtitle1" color="text.primary">
          No recording loaded
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
          Upload a file or load a stored recording to render its spectrogram.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ width: '100%', height: '100%', minHeight: 360 }}
      role="img"
      aria-label={`Spectrogram of ${audioFile.name}, showing ${currentTimeRange[0]} to ${currentTimeRange[1]} seconds and ${currentFrequencyRange[0]} to ${currentFrequencyRange[1]} hertz`}
    >
      <Canvas
        camera={{ position: [0, 0, 90], fov: 20 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <Suspense fallback={null}>
          <SpectrogramMesh
            audioFile={audioFile}
            colorscale={colorscale}
            currentTimeRange={currentTimeRange}
            currentFrequencyRange={currentFrequencyRange}
            xSize={X_SIZE}
            ySize={Y_SIZE}
            frequencySamples={FREQUENCY_SAMPLES}
            timeSamples={TIME_SAMPLES}
          />
        </Suspense>

        {currentTimeRange?.length === 2 && (
          <Axis
            orientation="x"
            axisLength={X_SIZE}
            numTicks={6}
            position={[0, -Y_SIZE / 2 - 2, 0]}
            tickLabels={timeTicks}
            label="Time (s)"
          />
        )}

        {currentFrequencyRange?.length === 2 && (
          <Axis
            orientation="y"
            axisLength={Y_SIZE}
            numTicks={6}
            position={[-X_SIZE / 2 - 2, 0, 0]}
            tickLabels={frequencyTicks}
            label="Frequency (Hz)"
          />
        )}
      </Canvas>
    </Box>
  );
}
