import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import Title from './Title';
import EmptyState from '../shared/EmptyState';
import { useErrors } from '../shared/ErrorContext';
import { APIHandlerDashboard } from '../../services/rest/APIHandler/APIHandlerDashboard';
import { formatRelativeTime, formatShortDateTime } from '../../utils/format';

const MAX_HOURS_BEFORE_UNRESPONSIVE = 48;

export default function NodeHealthCheck() {
  const apiHandler = useMemo(() => new APIHandlerDashboard(), []);
  const { addError } = useErrors();
  const [heartbeatInfo, setHeartbeatInfo] = useState(null);
  const [status, setStatus] = useState('loading');

  const fetchHeartbeatInfo = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await apiHandler.get_node_health_check();
      setHeartbeatInfo(data);
      setStatus('ready');
    } catch (error) {
      addError(error);
      setStatus('error');
    }
  }, [apiHandler, addError]);

  useEffect(() => {
    fetchHeartbeatInfo();
  }, [fetchHeartbeatInfo]);

  const rows = useMemo(() => {
    if (!heartbeatInfo) return [];
    return heartbeatInfo.toArray().sort((a, b) => (b.latestTimestamp ?? 0) - (a.latestTimestamp ?? 0));
  }, [heartbeatInfo]);

  if (status === 'loading') {
    return (
      <Box sx={{ height: '100%' }}>
        <Title>Node health</Title>
        <LinearProgress sx={{ mb: 1 }} />
        <Box sx={{ height: 320 }} aria-busy="true" />
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        title="Node health could not be loaded"
        description="Check the API connection and try again."
        action={
          <Button variant="outlined" onClick={fetchHeartbeatInfo}>
            Retry
          </Button>
        }
        minHeight={360}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No nodes have reported yet"
        description="Register a node on the IoT Network page to start collecting heartbeats."
        minHeight={360}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Title>Node health</Title>
      <TableContainer sx={{ flex: 1, maxHeight: 380 }}>
        <Table size="small" stickyHeader aria-label="Node health check" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '30%' }}>Node</TableCell>
              <TableCell sx={{ width: '30%' }}>Last reading</TableCell>
              <TableCell align="right" sx={{ width: '40%' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((report, index) => {
              const hoursSinceReading = report.latestTimestamp
                ? Math.abs(Date.now() - report.latestTimestamp) / 3_600_000
                : Number.POSITIVE_INFINITY;
              const isResponsive = hoursSinceReading <= MAX_HOURS_BEFORE_UNRESPONSIVE;

              return (
                <TableRow key={`${report.node_description ?? 'node'}-${index}`} hover>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                    <Box component="span" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {report.node_description || 'Unnamed node'}
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: 'block', color: 'text.secondary', typography: 'caption', textTransform: 'capitalize' }}
                    >
                      {report.node_type || '—'}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Box component="span" sx={{ display: 'block' }}>
                      {formatShortDateTime(report.latest_time)}
                    </Box>
                    <Box component="span" sx={{ color: 'text.secondary', typography: 'caption' }}>
                      {formatRelativeTime(report.latestTimestamp)}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      variant="outlined"
                      color={isResponsive ? 'success' : 'error'}
                      icon={
                        isResponsive ? (
                          <CheckCircleRoundedIcon fontSize="small" />
                        ) : (
                          <WarningAmberRoundedIcon fontSize="small" />
                        )
                      }
                      label={isResponsive ? 'Online' : 'Stale'}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box component="p" sx={{ m: 0, mt: 1.5, color: 'text.secondary', typography: 'caption' }}>
        A node is marked unresponsive after {MAX_HOURS_BEFORE_UNRESPONSIVE} hours without a reading.
      </Box>
    </Box>
  );
}
