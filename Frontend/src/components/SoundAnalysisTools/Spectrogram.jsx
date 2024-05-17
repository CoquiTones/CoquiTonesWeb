import Plot from "react-plotly.js";
import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

export default function Spectrogram({
  xData,
  yData,
  zData,
  colorscale,
  xrange,
  setXrange,
  yrange,
  setYrange,
  currentTime,
  fileName,
}) {
  const [lineX, setLineX] = useState(null);
  const [lineY, setLineY] = useState(null);
  const [label, setLabel] = useState(null);
  const plotRef = useRef(null);

  const handleOnRelayout = (event) => {
    const newXrange = [
      event["xaxis.range[0]"] ?? xrange[0],
      event["xaxis.range[1]"] ?? xrange[1],
    ];
    const newYrange = [
      event["yaxis.range[0]"] ?? yrange[0],
      event["yaxis.range[1]"] ?? yrange[1],
    ];

    setXrange(newXrange);
    setYrange(newYrange);
    console.log("Updated ranges!", newXrange, newYrange);
  };

  useEffect(() => {
    const label = {
      text: `Current Time: ${currentTime.toFixed(2)} s`, // Customize label text as needed
      x: currentTime,
      y: Math.max(...yrange),
      showarrow: true,
      arrowhead: 0,
      ax: 0,
      ay: -30,
    };
    const verticalLineX = [currentTime, currentTime];
    const verticalLineY = [Math.min(...yrange), Math.max(...yrange)];

    setLineX(verticalLineX);
    setLineY(verticalLineY);
    setLabel(label);
  }, [currentTime, yrange]);

  return (
    <Plot
      data={[
        {
          type: "heatmap",
          x: xData,
          y: yData,
          z: zData,
          colorscale: colorscale,
          connectgaps: true,
          ncontours: 30,
          hovertemplate:
            "<b>Time</b>: %{x} s<br><b>Frequency</b>: %{y} Hz<br><b>Amplitude</b>: %{z} dB",
        },
        {
          type: "scatter",
          mode: "lines",
          x: lineX,
          y: lineY,
          line: {
            color: "red",
            width: 1,
            opacity: 0.7,
          },
        },
      ]}
      layout={{
        title: `${fileName} Spectrogram`,
        xaxis: {
          title: "Time (s)",
          range: xrange,
        },
        yaxis: {
          title: "Frequency (Hz)",
          range: yrange,
        },
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
          color: "white",
        },
        dragmode: "zoom", // Enable zoom tool
        annotations: [label],
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
      onRelayout={handleOnRelayout}
      ref={plotRef}
    />
  );
}
