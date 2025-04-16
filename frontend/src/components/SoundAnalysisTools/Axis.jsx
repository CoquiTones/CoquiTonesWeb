import React from "react";
import { Text } from "@react-three/drei";

const Axis = ({
  axisLength = 40,
  numTicks = 5,
  orientation = "x",
  position = [0, 0, 0],
  tickLabels = [],
  label = "",
}) => {
  const ticks = [];
  for (let i = 0; i < numTicks; i++) {
    const t = i / (numTicks - 1);
    const tickPosition =
      orientation === "x"
        ? [t * axisLength - axisLength / 2, 0, 0]
        : [0, t * axisLength - axisLength / 2, 0];

    ticks.push(
      <group key={i} position={tickPosition}>
        <mesh>
          <boxGeometry
            args={orientation === "x" ? [0.05, 0.5, 0.05] : [0.5, 0.05, 0.05]}
          />
          <meshStandardMaterial color="white" />
        </mesh>
        {tickLabels[i] && (
          <Text
            position={orientation === "x" ? [0, -1, 0] : [-1, 0, 0]}
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
  }

  return (
    <group position={position}>
      {/* Axis Line */}
      <mesh>
        <boxGeometry
          args={
            orientation === "x"
              ? [axisLength, 0.05, 0.05]
              : [0.05, axisLength, 0.05]
          }
        />
        <meshStandardMaterial color="white" />
      </mesh>
      {ticks}
      {label && (
        <Text
          position={orientation === "x" ? [0, -2, 0] : [-2.5, 0, 0]}
          fontSize={1}
          color="white"
          rotation={orientation === "y" ? [0, 0, Math.PI / 2] : [0, 0, 0]}
        >
          {label}
        </Text>
      )}
    </group>
  );
};

export default Axis;
