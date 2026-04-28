import { Fragment, useEffect, useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts";
import { Box } from "@mui/material";

import Title from "./Title";
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";

export default function Chart({errors, setErrors}) {
  const theme = useTheme();
  const [chartData, setChartData] = useState(null);
  const apiHandler = useMemo(() => new APIHandlerDashboard());

  const fetchChartData = async () => {
    try {
       
      const chartData = await apiHandler.get_week_species_summary();
      setChartData(chartData);
    } catch (error) {
      setErrors([...errors, error]);
    }
  };
  useEffect(() => {

    fetchChartData();
  }, []);

  if (!chartData || chartData.isEmpty()) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
        minHeight="400px"
      >
        <div>No messages yet...</div>
      </Box>
    );
  }
  return (
    <Fragment>
      <Title>Detected Coqui Species vs Time </Title>
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <LineChart
          xAxis={[
            {
              label: "Time",
              scaleType: "point",
              data: chartData.getXData(),
              tickNumber: 2,
              tickLabelStyle: theme.typography.body2,
            },
          ]}
          series={chartData.getSeriesData()}
        />
      </div>
    </Fragment>
  );
}
