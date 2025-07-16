import React from "react";
import PropTypes from "prop-types";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * Reusable 3D Axis with ticks and labels.
 */
const Axis = ({
  orientation = "x", // "x" or "y"
  axisLength = 10,
  numTicks = 5,
  position = [0, 0, 0],
  tickLabels = [],
  label = "",
  color = "white",
  fontSize = 0.8,
}) => {
  const isX = orientation === "x";

  // Main axis size
  const axisSize = isX ? [axisLength, 0.1, 0.1] : [0.1, axisLength, 0.1];

  // Tick mark size - make them more visible
  const tickSize = isX ? [0.1, 0.8, 0.1] : [0.8, 0.1, 0.1];

  // Label offsets - adjust for better positioning
  const tickLabelOffset = isX ? [0, -1.5, 0] : [-1.8, 0, 0];
  const axisLabelPosition = isX ? [0, -3, 0] : [-3.5, 0, 0];
  const axisLabelRotation = isX ? [0, 0, 0] : [0, 0, Math.PI / 2];

  // Generate tick positions that align with actual data
  const ticks = Array.from({ length: numTicks }, (_, i) => {
    let tickPos;

    if (isX) {
      // For X-axis: distribute evenly across the length, centered at origin
      const t = i / (numTicks - 1); // 0 to 1
      const x = (t - 0.5) * axisLength; // Center around 0
      tickPos = [x, 0, 0];
    } else {
      // For Y-axis: distribute evenly across the length, centered at origin
      const t = i / (numTicks - 1); // 0 to 1
      const y = (t - 0.5) * axisLength; // Center around 0
      tickPos = [0, y, 0];
    }

    return (
      <group key={i} position={tickPos}>
        <mesh>
          <boxGeometry args={tickSize} />
          <meshStandardMaterial color={color} />
        </mesh>
        {tickLabels[i] && (
          <Text
            position={tickLabelOffset}
            fontSize={fontSize}
            color={color}
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
      {/* Axis line */}
      <mesh>
        <boxGeometry args={axisSize} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Ticks */}
      {ticks}

      {/* Axis label */}
      {label && (
        <Text
          position={axisLabelPosition}
          rotation={axisLabelRotation}
          fontSize={fontSize + 0.2}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

Axis.propTypes = {
  orientation: PropTypes.oneOf(["x", "y"]),
  axisLength: PropTypes.number,
  numTicks: PropTypes.number,
  position: PropTypes.arrayOf(PropTypes.number),
  tickLabels: PropTypes.arrayOf(PropTypes.string),
  label: PropTypes.string,
  color: PropTypes.string,
  fontSize: PropTypes.number,
};

export default Axis;
