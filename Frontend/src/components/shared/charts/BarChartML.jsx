import React from 'react';
import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { BarChart, axisClasses } from '@mui/x-charts';

import Title from '../Title';



export default function BarChartML({ data, title }) {
  const theme = useTheme();

  return (
    <React.Fragment>
      <Title>{title}</Title>

      <div style={{ width: '100%', flexGrow: 1, }}>
        <BarChart
          xAxis={[{ scaleType: 'band', data: Object.keys(data) }]}
          series={[{ data: Object.values(data) }]}
          colors={["#ffc857"]}
        >
        </BarChart>
      </div>

    </React.Fragment>
  );
}
