import { useEffect, useRef, useState } from "react";
import {
  computeSpectrogramData,
  createSpectrogramGeometry,
} from "../processing/SpectrogramDataComputer";

export const useSpectrogramGeometry = ({
  audioFile,
  currentTimeRange,
  currentFrequencyRange,
  xSize,
  ySize,
  frequencySamples,
  timeSamples,
  setIsLoading,
}) => {
  const geometryRef = useRef(null);
  const fullSpectrogramRef = useRef(null);
  const audioMetadataRef = useRef({ nyquist: 0, duration: 0 });
  const [isReady, setIsReady] = useState(false);

  // Calculate full spectrogram only once when audio file changes
  useEffect(() => {
    if (!audioFile) {
      console.log("No audio file provided");
      setIsReady(false);
      return;
    }

    let isCancelled = false;

    const process = async () => {
      try {
        console.log("Starting spectrogram processing...");

        setIsReady(false);

        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const fullDuration = audioBuffer.duration;

        console.log(`Audio duration: ${fullDuration}s`);

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

        console.log(
          `Spectrogram calculated: ${heightMap.length} samples, nyquist: ${nyquist}Hz`
        );

        // Store the full spectrogram data
        fullSpectrogramRef.current = heightMap;
        audioMetadataRef.current = { nyquist, duration: fullDuration };

        // Create initial geometry with full data
        const geometry = createSpectrogramGeometry({
          heightMap,
          nyquist,
          xSize,
          ySize,
          currentTimeRange: [0, fullDuration],
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
    setIsLoading(true);
    process();
    setIsLoading(false);

    return () => {
      console.log("Cleanup: cancelling processing");
      isCancelled = true;
    };
  }, [audioFile, frequencySamples, timeSamples]);

  // Update view bounds using Three.js clipping/scaling instead of recalculating data
  useEffect(() => {
    if (!isReady || !geometryRef.current || !fullSpectrogramRef.current) {
      console.log("Skipping view update - not ready or missing data");
      return;
    }

    console.log("Updating view bounds:", {
      currentTimeRange,
      currentFrequencyRange,
    });
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

  console.log("Hook state:", {
    isReady,
    hasGeometry: !!geometryRef.current,
    hasData: !!fullSpectrogramRef.current,
  });

  return {
    geometry: geometryRef.current,
    isReady,
    audioMetadata: audioMetadataRef.current,
  };
};
