import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import colormap from "colormap";
import {
  computeSpectrogramData,
  createSpectrogramGeometry,
  updateSpectrogramGeometry,
} from "../processing/SpectrogramDataComputer";

const SpectrogramMesh = ({
  audioFile,
  colorscale = "inferno",
  xrange,
  yrange,
  xSize = 10,
  ySize = 5,
  frequencySamples = 248,
  timeSamples = 150,
}) => {
  const meshRef = useRef();
  const geometryRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const previousYRangeRef = useRef(yrange);

  // Color map generation
  const colors = useMemo(() => {
    return colormap({
      colormap: colorscale,
      nshades: 256,
      format: "rgba",
      alpha: 1,
    }).map((c) => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255));
  }, [colorscale]);

  // Shader material
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

  // Process audio data and update geometry
  useEffect(() => {
    if (!audioFile || !xrange || !yrange) return;

    const processAudio = async () => {
      try {
        const { heightMap, nyquist } = await computeSpectrogramData({
          audioFile,
          xrange,
          frequencySamples,
          timeSamples,
        });

        // Check if yrange has changed significantly
        const yrangeChanged =
          previousYRangeRef.current[0] !== yrange[0] ||
          previousYRangeRef.current[1] !== yrange[1];

        if (!initialized || yrangeChanged) {
          // Create new geometry when:
          // 1. First run
          // 2. Y-range has changed significantly
          const geometry = createSpectrogramGeometry({
            heightMap,
            nyquist,
            xSize,
            ySize,
            xrange,
            yrange,
            frequencySamples,
            timeSamples,
          });

          geometryRef.current = geometry;
          setInitialized(true);
          previousYRangeRef.current = yrange;

          // Update mesh reference
          if (meshRef.current) {
            meshRef.current.geometry = geometry;
          }
        } else {
          // Update existing geometry for other changes
          updateSpectrogramGeometry({
            geometry: geometryRef.current,
            heightMap,
            nyquist,
            yrange,
            frequencySamples,
            timeSamples,
          });
        }
      } catch (error) {
        console.error("Error processing audio data:", error);
      }
    };

    processAudio();
  }, [
    audioFile,
    xrange,
    yrange,
    xSize,
    ySize,
    frequencySamples,
    timeSamples,
    initialized,
  ]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometryRef.current}
      material={shaderMaterial}
    />
  );
};

export default SpectrogramMesh;
