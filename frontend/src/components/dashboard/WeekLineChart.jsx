import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineChart } from '@mui/x-charts';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';

import Title from './Title';
import EmptyState from '../shared/EmptyState';
import { useErrors } from '../shared/ErrorContext';
import { APIHandlerDashboard } from '../../services/rest/APIHandler/APIHandlerDashboard';

const SERIES_COLORS = [
  '#FFC857',
  '#7FC4FF',
  '#6FD98A',
  '#FFB020',
  '#F2B880',
  '#C4A7FF',
  '#FF7A7A',
  '#8FE3D0',
];

export default function WeekLineChart() {
  const theme = useTheme();
  const { addError } = useErrors();
  const apiHandler = useMemo(() => new APIHandlerDashboard(), []);
  const [chartData, setChartData] = useState(null);
  const [status, setStatus] = useState('loading');

  const fetchChartData = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await apiHandler.get_week_species_summary();
      setChartData(data);
      setStatus('ready');
    } catch (error) {
      addError(error);
      setStatus('error');
    }
  }, [apiHandler, addError]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const series = useMemo(() => {
    if (!chartData) return [];
    return chartData.getSeriesData().map((entry, index) => ({
      ...entry,
      color: SERIES_COLORS[index % SERIES_COLORS.length],
      showMark: false,
      curve: 'monotoneX',
    }));
  }, [chartData]);

  if (status === 'loading') {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Title>Detections this week</Title>
        <LinearProgress sx={{ mb: 1 }} />
        <Box sx={{ flex: 1, minHeight: 320 }} aria-busy="true" />
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        title="The weekly summary could not be loaded"
        description="Check the API connection and try again."
        action={
          <Button variant="outlined" onClick={fetchChartData}>
            Retry
          </Button>
        }
        minHeight={360}
      />
    );
  }

  if (!chartData || chartData.isEmpty()) {
    return (
      <EmptyState
        title="No detections recorded yet"
        description="Species detections from the last seven days will appear here once nodes report data."
        minHeight={360}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Title>Detections this week</Title>
      <Box sx={{ flex: 1, minHeight: 340, minWidth: 0 }}>
        <LineChart
          height={340}
          series={series}
          xAxis={[
            {
              data: chartData.getXData(),
              scaleType: 'point',
              label: 'Date',
              tickLabelStyle: { fill: theme.palette.text.secondary, fontSize: 12 },
              labelStyle: { fill: theme.palette.text.secondary, fontSize: 12 },
            },
          ]}
          margin={{ top: 16, right: 24, bottom: 56, left: 56 }}
          grid={{ horizontal: true }}
          sx={{
            '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
              stroke: theme.palette.divider,
            },
            '& .MuiChartsGrid-line': { stroke: theme.palette.divider },
            '& .MuiChartsLegend-label': { fill: theme.palette.text.secondary },
          }}
        />
      </Box>
    </Box>
  );
}
