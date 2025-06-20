import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import colormap from "colormap";
import { useSpectrogramGeometry } from "../hooks/useSpectrogramGeometry";

const SpectrogramMesh = ({
  audioFile,
  colorscale = "inferno",
  currentTimeRange,
  currentFrequencyRange,
  xSize = 10,
  ySize = 5,
  frequencySamples = 248,
  timeSamples = 150,
  setIsLoading,
}) => {
  const meshRef = useRef();

  console.log("SpectrogramMesh render:", {
    audioFile: !!audioFile,
    currentTimeRange,
    currentFrequencyRange,
    xSize,
    ySize,
  });

  const { geometry, isReady, audioMetadata } = useSpectrogramGeometry({
    audioFile,
    currentTimeRange,
    currentFrequencyRange,
    xSize,
    ySize,
    frequencySamples,
    timeSamples,
    setIsLoading,
  });

  console.log("Geometry hook result:", {
    hasGeometry: !!geometry,
    isReady,
    audioMetadata,
  });

  const colors = useMemo(() => {
    const colorArray = colormap({
      colormap: colorscale,
      nshades: 256,
      format: "rgba",
      alpha: 1,
    }).map((c) => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255));
    console.log("Generated colors:", colorArray.length);
    return colorArray;
  }, [colorscale]);

  // Enhanced shader material that uses view bounds from geometry.userData
  const shaderMaterial = useMemo(() => {
    console.log("Creating shader material");
    return new THREE.ShaderMaterial({
      uniforms: {
        vLut: { value: colors },
        timeScale: { value: 1.0 },
        freqScale: { value: 1.0 },
        timeOffset: { value: 0.0 },
        freqOffset: { value: 0.0 },
        viewBounds: {
          value: new THREE.Vector4(0.0, 1.0, 0.0, 1.0), // timeMin, timeMax, freqMin, freqMax
        },
      },
      vertexShader: `
        uniform vec3 vLut[256];
        uniform float timeScale;
        uniform float freqScale;
        uniform float timeOffset;
        uniform float freqOffset;
        uniform vec4 viewBounds; // timeMin, timeMax, freqMin, freqMax
        
        attribute float displacement;
        varying vec3 vColor;
        varying float vVisible;
        
        void main() {
          // Calculate normalized coordinates (0 to 1) based on original geometry
          float normalizedX = (position.x + ${xSize / 2}.0) / ${xSize}.0;
          float normalizedY = (position.y + ${ySize / 2}.0) / ${ySize}.0;
          
          // Check if this vertex is within the view bounds
          vVisible = 1.0;
          if (normalizedX < viewBounds.x || normalizedX > viewBounds.y ||
              normalizedY < viewBounds.z || normalizedY > viewBounds.w) {
            vVisible = 0.0;
          }
          
          // Color mapping
          int colorIndex = int(clamp(displacement, 0.0, 255.0));
          vColor = vLut[colorIndex];
          
          // Keep the geometry in its original position - don't apply transformations
          // The clipping is handled by the view bounds check above
          vec3 newPosition = position + normal * displacement * 0.01;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vVisible;
        
        void main() {
          if (vVisible < 0.5) {
            discard;
          }
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
    });
  }, [colors, xSize, ySize]);

  // Update shader uniforms when geometry userData changes
  useEffect(() => {
    if (!geometry || !shaderMaterial || !isReady) return;

    const userData = geometry.userData;
    if (userData) {
      console.log("Updating shader uniforms:", userData);

      shaderMaterial.uniforms.timeScale.value = userData.timeScale || 1.0;
      shaderMaterial.uniforms.freqScale.value = userData.freqScale || 1.0;
      shaderMaterial.uniforms.timeOffset.value = userData.timeOffset || 0.0;
      shaderMaterial.uniforms.freqOffset.value = userData.freqOffset || 0.0;

      if (userData.viewBounds) {
        shaderMaterial.uniforms.viewBounds.value.set(
          userData.viewBounds.timeMin,
          userData.viewBounds.timeMax,
          userData.viewBounds.freqMin,
          userData.viewBounds.freqMax
        );
      }

      shaderMaterial.uniformsNeedUpdate = true;
    }
  }, [
    geometry,
    shaderMaterial,
    isReady,
    currentTimeRange,
    currentFrequencyRange,
  ]);

  // Add a fallback simple geometry for testing
  const fallbackGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(xSize, ySize, 32, 32);
    const positionAttribute = geo.getAttribute("position");
    const displacementArray = new Float32Array(positionAttribute.count);

    // Add some test displacement data
    for (let i = 0; i < displacementArray.length; i++) {
      displacementArray[i] = Math.random() * 100; // Random values for testing
    }

    geo.setAttribute(
      "displacement",
      new THREE.BufferAttribute(displacementArray, 1)
    );
    console.log("Created fallback geometry");
    return geo;
  }, [xSize, ySize]);

  if (!isReady && !geometry) {
    console.log("Rendering fallback geometry for testing");
    return (
      <mesh
        ref={meshRef}
        geometry={fallbackGeometry}
        material={shaderMaterial}
      />
    );
  }

  if (!isReady || !geometry) {
    console.log("Not ready or no geometry, returning null");
    return null;
  }

  console.log("Rendering actual geometry");
  return <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} />;
};

export default SpectrogramMesh;
