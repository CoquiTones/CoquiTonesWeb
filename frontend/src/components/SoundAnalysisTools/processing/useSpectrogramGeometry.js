import { useEffect, useRef, useState } from "react";
import {
  computeSpectrogramData,
  createSpectrogramGeometry,
} from "./SpectrogramDataComputer";

export const useSpectrogramGeometry = ({
  audioFile,
  currentTimeRange,
  currentFrequencyRange,
  xSize,
  ySize,
  frequencySamples,
  timeSamples,
}) => {
  const geometryRef = useRef(null);
  const fullSpectrogramRef = useRef(null);
  const audioMetadataRef = useRef({ nyquist: 0, duration: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!audioFile) {
      setIsReady(false);
      return;
    }

    let isCancelled = false;

    const process = async () => {
      try {
        setIsReady(false);

        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const fullDuration = audioBuffer.duration;

        // Calculate spectrogram for ENTIRE file
        const { heightMap, sampleRate, nyquist } = await computeSpectrogramData(
          {
            audioFile,
            currentTimeRange: [0, fullDuration], // Full file
            frequencySamples,
            timeSamples,
          }
        );

        if (isCancelled) {
          console.log("Processing cancelled");
          return;
        }

        // Store the full spectrogram data
        fullSpectrogramRef.current = heightMap;
        audioMetadataRef.current = { nyquist, duration: fullDuration };

        // Create initial geometry with full data
        const geometry = createSpectrogramGeometry({
          heightMap,
          nyquist,
          xSize,
          ySize,
          currentFrequencyRange: [0, nyquist],
          frequencySamples,
          timeSamples,
        });

        console.log("Geometry created successfully");
        geometryRef.current = geometry;
        setIsReady(true);
      } catch (err) {
        console.error("Failed to process spectrogram:", err);
        if (!isCancelled) {
          setIsReady(false);
        }
      } finally {
        if (!isCancelled) {
          console.log("Processing complete, loading state cleared");
        }
      }
    };
    process();

    return () => {
      console.log("Cleanup: cancelling processing");
      isCancelled = true;
    };
  }, [audioFile]);

  useEffect(() => {
    if (!isReady || !geometryRef.current || !fullSpectrogramRef.current) {
      console.log("Skipping view update - not ready or missing data");
      return;
    }
    updateGeometryView();
  }, [currentTimeRange, currentFrequencyRange, xSize, ySize, isReady]);

  const updateGeometryView = () => {
    if (!geometryRef.current) {
      console.log("No geometry to update");
      return;
    }

    const { nyquist, duration } = audioMetadataRef.current;

    // Calculate scaling factors for the view
    const timeScale = (currentTimeRange[1] - currentTimeRange[0]) / duration;
    const freqScale =
      (currentFrequencyRange[1] - currentFrequencyRange[0]) / nyquist;

    // Calculate offsets for positioning
    const timeOffset = (currentTimeRange[0] / duration - 0.5) * 2; // Normalize to [-1, 1]
    const freqOffset = (currentFrequencyRange[0] / nyquist - 0.5) * 2; // Normalize to [-1, 1]

    console.log("View update params:", {
      timeScale,
      freqScale,
      timeOffset,
      freqOffset,
    });

    // Update geometry attributes for view bounds
    geometryRef.current.userData = {
      timeScale,
      freqScale,
      timeOffset,
      freqOffset,
      viewBounds: {
        timeMin: currentTimeRange[0] / duration,
        timeMax: currentTimeRange[1] / duration,
        freqMin: currentFrequencyRange[0] / nyquist,
        freqMax: currentFrequencyRange[1] / nyquist,
      },
    };
  };

  return {
    geometry: geometryRef.current,
    isReady,
    audioMetadata: audioMetadataRef.current,
  };
};
