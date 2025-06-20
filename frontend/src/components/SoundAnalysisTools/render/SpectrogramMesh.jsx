import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
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
  const [tooltipData, setTooltipData] = useState(null);
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

  const colors = useMemo(() => {
    const colorArray = colormap({
      colormap: colorscale,
      nshades: 256,
      format: "rgba",
      alpha: 1,
    }).map((c) => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255));
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
          float percentX = (position.x + ${xSize / 2}.0) / ${xSize}.0;
          float percentY = (position.y + ${ySize / 2}.0) / ${ySize}.0;

          vVisible = 1.0;
          if (percentX < viewBounds.x || percentX > viewBounds.y ||
              percentY < viewBounds.z || percentY > viewBounds.w) {
            vVisible = 0.0;
          }

          float visibleX = (percentX - viewBounds.x) / (viewBounds.y - viewBounds.x);
          float visibleY = (percentY - viewBounds.z) / (viewBounds.w - viewBounds.z);

          float remappedX = visibleX * ${xSize}.0 - ${xSize / 2}.0;
          float remappedY = visibleY * ${ySize}.0 - ${ySize / 2}.0;

          int colorIndex = int(clamp(displacement, 0.0, 255.0));
          vColor = vLut[colorIndex];

          vec3 newPosition = vec3(remappedX, remappedY, 0.0) + normal * displacement * 0.01;
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

  const onPointerMove = (event) => {
    event.stopPropagation();

    if (!meshRef.current || !geometry) return;

    const uv = event.uv;
    if (!uv) return;

    const { duration, nyquist } = audioMetadata;
    const time =
      uv.x * (currentTimeRange[1] - currentTimeRange[0]) + currentTimeRange[0];
    const freq =
      uv.y * (currentFrequencyRange[1] - currentFrequencyRange[0]) +
      currentFrequencyRange[0];

    const xBin = Math.floor(uv.x * timeSamples);
    const yBin = Math.floor(uv.y * frequencySamples);

    const displacementAttr = geometry.getAttribute("displacement");
    const index = xBin * (frequencySamples + 1) + yBin;

    if (index >= 0 && index < displacementAttr.count) {
      const value = displacementAttr.array[index] * (80.0 / 255.0) - 80; // reverse normalization
      setTooltipData({ x: time, y: freq, value });
      setAnchorEl(gl.domElement);
    } else {
      setTooltipData(null);
      setAnchorEl(null);
    }
  };

  const onPointerOut = () => {
    setTooltipData(null);
    setAnchorEl(null);
  };

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
  return (
    <>
      <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} />{" "}
      {tooltipData && (
        <SpectrogramTooltip
          anchorEl={anchorEl}
          open={!!tooltipData}
          x={tooltipData.x}
          y={tooltipData.y}
          value={tooltipData.value}
        />
      )}
    </>
  );
};

export default SpectrogramMesh;
