import Plot from "react-plotly.js";
import React, { useMemo } from "react";





export default function HeatMapML({ data, filename }) {

  /**
   * Create x ticks by making an array of 5 second increments
   */
  const getXData = () => {
    let xData = [0]
    let seconds = 0;
    for (let i = 0; i < data["data"].length; i++) {
      seconds += 5;
      xData.push(seconds);
    }
    return xData;
  }

  /**
   * Get array of all classifications in correct index
   */
  const getZData = () => {

    let percentages = [];
    for (let i = 0; i < data["data"].length; i++) {
      const probabilitiesOfSegment = data["data"][i];
      percentages.push(probabilitiesOfSegment);
    }

    return percentages;
  }
  const xData = useMemo(getXData, [data]);
  const yData = useMemo(() => data["species_schema"], [data]);
  const zData = useMemo(getZData, [data]);
  return (
    <Plot
      data={[
        {
          type: "heatmap",
          x: xData,
          y: yData,
          z: zData,
          colorscale: "RdBu",
          connectgaps: true,
          ncontours: 30,
          hovertemplate:
            "<b>Time</b>: %{x} s<br><b>Species</b>: %{y} Hz<br><b>Probability </b>: %{z} dB",
        },
      ]}
      layout={{
        title: `${filename} Detected Species Probability`,
        xaxis: {
          title: "Time (s)",
        },
        yaxis: {
          title: "Species",
        },
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
          color: "white",
        },
        dragmode: "zoom", // Enable zoom tool
      }}
    >

    </Plot>
  );
}
