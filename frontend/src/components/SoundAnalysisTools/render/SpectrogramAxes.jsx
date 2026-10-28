import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';

import { makeTicks } from '../processing/spectrogramTransforms';
import { formatFrequencyTick, formatTimeTick } from '../processing/spectrogramFormat';

export default function SpectrogramAxes({ timeRange, frequencyRange, plotRect }) {
  const theme = useTheme();
  const timeTicks = makeTicks(timeRange[0], timeRange[1], 6);
  const frequencyTicks = makeTicks(frequencyRange[0], frequencyRange[1], 6);
  const axisY = plotRect.top + plotRect.height;
  const axisX = plotRect.left;
  const color = theme.palette.text.secondary;
  const labelColor = theme.palette.text.primary;
  const fontFamily = theme.typography.caption.fontFamily;

  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <line x1={axisX} y1={axisY} x2={axisX + plotRect.width} y2={axisY} stroke={color} strokeWidth={1} />
      <line x1={axisX} y1={plotRect.top} x2={axisX} y2={axisY} stroke={color} strokeWidth={1} />

      {timeTicks.map((tick) => {
        const x = axisX + tick.fraction * plotRect.width;
        return (
          <g key={`time-${tick.fraction}`}>
            <line x1={x} y1={axisY} x2={x} y2={axisY + 5} stroke={color} strokeWidth={1} />
            <text
              x={x}
              y={axisY + 19}
              fill={color}
              fontFamily={fontFamily}
              fontSize={11}
              textAnchor="middle"
            >
              {formatTimeTick(tick.value)}
            </text>
          </g>
        );
      })}

      {frequencyTicks.map((tick) => {
        const y = axisY - tick.fraction * plotRect.height;
        return (
          <g key={`frequency-${tick.fraction}`}>
            <line x1={axisX - 5} y1={y} x2={axisX} y2={y} stroke={color} strokeWidth={1} />
            <text
              x={axisX - 9}
              y={y}
              fill={color}
              fontFamily={fontFamily}
              fontSize={11}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatFrequencyTick(tick.value)}
            </text>
          </g>
        );
      })}

      <text
        x={axisX + plotRect.width / 2}
        y={axisY + 38}
        fill={labelColor}
        fontFamily={fontFamily}
        fontSize={12}
        textAnchor="middle"
      >
        Time (s)
      </text>
      <text
        x={16}
        y={plotRect.top + plotRect.height / 2}
        fill={labelColor}
        fontFamily={fontFamily}
        fontSize={12}
        textAnchor="middle"
        transform={`rotate(-90 16 ${plotRect.top + plotRect.height / 2})`}
      >
        Frequency (Hz)
      </text>
    </svg>
  );
}

SpectrogramAxes.propTypes = {
  timeRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  frequencyRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  plotRect: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
};
