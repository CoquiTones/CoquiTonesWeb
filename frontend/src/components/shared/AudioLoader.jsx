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
import { APIHandlerDashboard } from '../../services/rest/APIHandler/APIHandlerDashboard';
import RecentDataRequest from '../../services/rest/RequestORM/Dashboard/RecentDataRequest';
import AudioFileRequest from '../../services/rest/RequestORM/Shared/AudioFileRequest';

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
  const apiHandler = useMemo(() => new APIHandlerDashboard(), []);
  const { addError } = useErrors();
  const [rows, setRows] = useState([]);
  const [minTime, setMinTime] = useState(() => dayjs().subtract(100, 'day'));
  const [maxTime, setMaxTime] = useState(() => dayjs());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingAfid, setLoadingAfid] = useState(null);

  const fetchRows = useCallback(async () => {
    if (!minTime || !maxTime || minTime.isAfter(maxTime)) return;

    setLoading(true);
    setError('');
    try {
      const request = new RecentDataRequest(minTime.valueOf(), maxTime.valueOf());
      const recentData = await apiHandler.get_recent_data(request);
      setRows(recentData.getData());
    } catch (fetchError) {
      setError('Recordings could not be loaded. Check the API connection and try again.');
      addError(fetchError);
    } finally {
      setLoading(false);
    }
  }, [apiHandler, addError, minTime, maxTime]);

  useEffect(() => {
    if (open) fetchRows();
  }, [open, fetchRows]);

  const handleLoad = async (row) => {
    setLoadingAfid(row.afid);
    try {
      const blob = await apiHandler.getAudioById(new AudioFileRequest(row.afid));
      const file = new File([blob], `node-${row.nid}-${row.afid}.${extensionFor(blob.type)}`, {
        type: blob.type || 'audio/mpeg',
      });
      onSelect(file);
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
          disabled={loadingAfid === params.row.afid}
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
            <Button variant="outlined" onClick={fetchRows} disabled={loading}>
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
