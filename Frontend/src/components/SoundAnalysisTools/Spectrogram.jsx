import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';





export default function Spectrogram({ xData, yData, zData, colorscale, xrange, yrange, currentTime, fileName }) {

    // todo calculate zmin and zmax from data
    // 
    // Define label for the vertical line
    const [lineX, setLineX] = useState(null);
    const [lineY, setLineY] = useState(null);
    const [label, setLabel] = useState(null);

    useEffect(() => {
        const label = {
            text: `Current Time: ${(currentTime).toFixed(2)} s`, // Customize label text as needed
            x: currentTime,
            y: Math.max(...yrange),
            showarrow: true,
            arrowhead: 0,
            ax: 0,
            ay: -30,
        };
        // Create x and y coordinates for the vertical line
        const verticalLineX = [currentTime, currentTime];
        const verticalLineY = [Math.min(...yrange), Math.max(...yrange)];

        setLineX(verticalLineX)
        setLineY(verticalLineY)
        setLabel(label)

    }, [currentTime])
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
                    ncontours: 500,
                    hovertemplate: '<b>Time</b>: %{x} s<br><b>Frequency</b>: %{y} Hz<br><b>Amplitude</b>: %{z} dB',

                },
                {
                    type: "scatter",
                    mode: "lines",
                    x: lineX,
                    y: lineY,
                    line: {
                        color: "red", // Change color as needed
                        width: 1,
                        opacity: 0.7, // Set opacity to 70%
                    },
                },
            ]}

            layout={{
                title: fileName + " Spectrogram",
                xaxis: {
                    title: "Time (s)",
                    range: xrange

                },
                yaxis: {
                    title: "Frequency (Hz)",
                    range: yrange
                },
                plot_bgcolor: 'rgba(0, 0, 0, 0)', // Set plot background color to transparent for dark mode
                paper_bgcolor: 'rgba(0, 0, 0, 0)', // Set paper background color to transparent for dark mode
                font: {
                    color: 'white', // Set font color to white for dark mode
                },
                annotations: [label]
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}


        />


    )
}
