import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';

import { useErrors } from './ErrorContext';
import {
  AuthenticationStatus,
  useGlobalState,
} from '../../services/Authentication/GlobalStateManager';
import { APIHandlerSpectralAnalysis } from '../../services/rest/APIHandler/APIHandlerSpectralAnalysis';
import AudioFileRequest from '../../services/rest/RequestORM/Shared/AudioFileRequest';
import { formatDateTime, parseApiDate } from '../../utils/format';

const extensionFor = (mimeType = '') => {
  if (mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'audio';
};

/**
 * Dialog for loading a stored recording into the analysis workspace.
 */
export default function AudioLoader({ open, onClose, onSelect }) {
  const apiHandler = useMemo(() => new APIHandlerSpectralAnalysis(), []);
  const { addError } = useErrors();
  const { authStatus } = useGlobalState();
  const isAuthenticated = authStatus === AuthenticationStatus.AUTHENTICATED;
  const [rows, setRows] = useState([]);
  const [minTime, setMinTime] = useState(() => dayjs().subtract(1, 'year'));
  const [maxTime, setMaxTime] = useState(() => dayjs());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingAfid, setLoadingAfid] = useState(null);

  const loadRows = useCallback(async (from, to) => {
    if (!isAuthenticated) return;
    if (!from || !to || from.isAfter(to)) return;

    setLoading(true);
    setError('');
    try {
      const audioFiles = await apiHandler.getAudioFiles();
      const minTimestamp = from.valueOf();
      const maxTimestamp = to.valueOf();
      const nextRows = (Array.isArray(audioFiles) ? audioFiles : [])
        .map((entry, index) => {
          const parsed = parseApiDate(entry.time);
          return {
            id: entry.afid ?? index,
            afid: entry.afid,
            nid: entry.nid,
            tid: entry.tid,
            time: formatDateTime(entry.time),
            timestamp: parsed.getTime(),
          };
        })
        .filter((row) => (
          Number.isFinite(row.timestamp)
          && row.timestamp > minTimestamp
          && row.timestamp < maxTimestamp
        ));

      setRows(nextRows);
    } catch (fetchError) {
      setError('Recordings could not be loaded. Check the API connection and try again.');
      addError(fetchError);
    } finally {
      setLoading(false);
    }
  }, [apiHandler, addError, isAuthenticated]);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    // Refresh the upper bound when the dialog opens; a recording saved after
    // the page loaded must still fall inside the default range.
    const now = dayjs();
    setMaxTime(now);
    loadRows(minTime, now);
  }, [open, isAuthenticated, loadRows, minTime]);

  const handleLoad = async (row) => {
    setLoadingAfid(row.afid);
    try {
      const blob = await apiHandler.getAudioById(new AudioFileRequest(row.afid));
      const file = new File([blob], `node-${row.nid}-${row.afid}.${extensionFor(blob.type)}`, {
        type: blob.type || 'audio/mpeg',
      });
      onSelect(file, { afid: row.afid, nid: row.nid });
    } catch (loadError) {
      addError(loadError?.message ?? 'That recording could not be downloaded.');
    } finally {
      setLoadingAfid(null);
    }
  };

  const columns = [
    { field: 'time', headerName: 'Recorded', minWidth: 180, flex: 1 },
    { field: 'nid', headerName: 'Node', minWidth: 90, flex: 0.5 },
    { field: 'afid', headerName: 'Audio ID', minWidth: 90, flex: 0.5 },
    {
      field: 'actions',
      headerName: 'Load',
      sortable: false,
      filterable: false,
      minWidth: 130,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloudDownloadRoundedIcon />}
          onClick={() => handleLoad(params.row)}
          disabled={!isAuthenticated || loadingAfid === params.row.afid}
        >
          {loadingAfid === params.row.afid ? 'Loading…' : 'Load'}
        </Button>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="audio-loader-title">
      <DialogTitle id="audio-loader-title">Load a recording</DialogTitle>
      <DialogContent>
        {!isAuthenticated && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Sign in to load recordings stored in the database.
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1, mb: 2 }}>
            <DateTimePicker
              label="From"
              value={minTime}
              onChange={setMinTime}
              maxDateTime={maxTime ?? undefined}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DateTimePicker
              label="To"
              value={maxTime}
              onChange={setMaxTime}
              minDateTime={minTime ?? undefined}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Button
              variant="outlined"
              onClick={() => loadRows(minTime, maxTime)}
              disabled={loading}
            >
              Search
            </Button>
          </Stack>
        </LocalizationProvider>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ height: 420 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            localeText={{ noRowsLabel: 'No recordings found in this date range.' }}
            sx={{ borderColor: 'divider' }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
