import React from "react";
import { Text } from "@react-three/drei";

const Axis = ({
  axisLength = 40,
  numTicks = 5,
  orientation = "x", // 'x' or 'y'
  position = [0, 0, 0],
  tickLabels = [],
  label = "",
}) => {
  const isX = orientation === "x";

  const axisSize = isX ? [axisLength, 0.05, 0.05] : [0.05, axisLength, 0.05];
  const tickSize = isX ? [0.05, 0.5, 0.05] : [0.5, 0.05, 0.05];
  const labelOffset = isX ? [0, -1, 0] : [-1, 0, 0];
  const axisLabelPos = isX ? [0, -2, 0] : [-2.5, 0, 0];
  const axisLabelRot = isX ? [0, 0, 0] : [0, 0, Math.PI / 2];

  const ticks = Array.from({ length: numTicks }, (_, i) => {
    const t = i / (numTicks - 1);
    const tickPos = isX
      ? [t * axisLength - axisLength / 2, 0, 0]
      : [0, (1 - t) * axisLength - axisLength / 2, 0];

    return (
      <group key={i} position={tickPos}>
        <mesh>
          <boxGeometry args={tickSize} />
          <meshStandardMaterial color="white" />
        </mesh>
        {tickLabels[i] && (
          <Text
            position={labelOffset}
            fontSize={0.8}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {tickLabels[i]}
          </Text>
        )}
      </group>
    );
  });

  return (
    <group position={position}>
      {/* Main axis line */}
      <mesh>
        <boxGeometry args={axisSize} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Ticks and labels */}
      {ticks}

      {/* Axis label */}
      {label && (
        <Text
          position={axisLabelPos}
          fontSize={1}
          color="white"
          rotation={axisLabelRot}
        >
          {label}
        </Text>
      )}
    </group>
  );
};

export default Axis;
