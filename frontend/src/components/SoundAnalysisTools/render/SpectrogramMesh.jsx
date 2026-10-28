import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import colormap from 'colormap';
import PropTypes from 'prop-types';

import { useSpectrogramGeometry } from '../processing/useSpectrogramGeometry';

/**
 * Renders the spectrogram height map as a shader-driven plane.
 */
export default function SpectrogramMesh({
  audioFile,
  colorscale = 'jet',
  currentTimeRange,
  currentFrequencyRange,
  xSize = 60,
  ySize = 20,
  frequencySamples = 4096,
  timeSamples = 1024,
}) {
  const meshRef = useRef(null);

  const { geometry, isReady } = useSpectrogramGeometry({
    audioFile,
    currentTimeRange,
    currentFrequencyRange,
    xSize,
    ySize,
    frequencySamples,
    timeSamples,
  });

  const colors = useMemo(() => {
    const ramp = colormap({
      colormap: colorscale,
      nshades: 256,
      format: 'rgba',
      alpha: 1,
    });
    return ramp.map((color) => new THREE.Vector3(color[0] / 255, color[1] / 255, color[2] / 255));
  }, [colorscale]);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          vLut: { value: colors },
          timeScale: { value: 1.0 },
          freqScale: { value: 1.0 },
          timeOffset: { value: 0.0 },
          freqOffset: { value: 0.0 },
          viewBounds: { value: new THREE.Vector4(0.0, 1.0, 0.0, 1.0) },
        },
        vertexShader: `
          uniform vec3 vLut[256];
          uniform float timeScale;
          uniform float freqScale;
          uniform float timeOffset;
          uniform float freqOffset;
          uniform vec4 viewBounds;

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
            if (vVisible < 0.5) discard;
            gl_FragColor = vec4(vColor, 1.0);
          }
        `,
      }),
    [colors, xSize, ySize],
  );

  // Free GPU resources when the material is replaced or the view unmounts.
  useEffect(() => () => shaderMaterial.dispose(), [shaderMaterial]);

  // Push view bounds + scale into the shader after each geometry update.
  useEffect(() => {
    if (!geometry || !shaderMaterial || !isReady) return;

    const userData = geometry.userData;
    if (!userData) return;

    shaderMaterial.uniforms.timeScale.value = userData.timeScale || 1.0;
    shaderMaterial.uniforms.freqScale.value = userData.freqScale || 1.0;
    shaderMaterial.uniforms.timeOffset.value = userData.timeOffset || 0.0;
    shaderMaterial.uniforms.freqOffset.value = userData.freqOffset || 0.0;

    if (userData.viewBounds) {
      shaderMaterial.uniforms.viewBounds.value.set(
        userData.viewBounds.timeMin,
        userData.viewBounds.timeMax,
        userData.viewBounds.freqMin,
        userData.viewBounds.freqMax,
      );
    }

    shaderMaterial.uniformsNeedUpdate = true;
  }, [geometry, shaderMaterial, isReady, currentTimeRange, currentFrequencyRange]);

  if (!isReady || !geometry) return null;

  return <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} frustumCulled={false} />;
}

SpectrogramMesh.propTypes = {
  audioFile: PropTypes.instanceOf(File).isRequired,
  colorscale: PropTypes.string,
  currentTimeRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  currentFrequencyRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  xSize: PropTypes.number,
  ySize: PropTypes.number,
  frequencySamples: PropTypes.number,
  timeSamples: PropTypes.number,
};
