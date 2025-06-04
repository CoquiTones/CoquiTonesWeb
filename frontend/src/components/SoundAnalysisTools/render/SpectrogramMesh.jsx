import { useEffect, useMemo, useRef } from "react";

import * as THREE from "three";
import colormap from "colormap";
import { setSpectrogramData } from "../processing/SpectrogramDataComputer";

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

export default SpectrogramMesh;
