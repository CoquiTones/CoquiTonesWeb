import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { APIHandlerDashboard } from '../../services/rest/APIHandler/APIHandlerDashboard';
import RecentDataRequest from '../../services/rest/RequestORM/Dashboard/RecentDataRequest';
import AudioFileRequest from '../../services/rest/RequestORM/Shared/AudioFileRequest';
import DeleteRecordRequest from '../../services/rest/RequestORM/Dashboard/DeleteRecordRequest';
import { useAudioDownload } from '../../hooks/useAudioDownload';
import { useErrors } from './ErrorContext';
import { downloadCsv, toCsv } from '../../utils/format';

const DEFAULT_RANGE_DAYS = 100;
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function DataTable() {
  const apiHandler = useMemo(() => new APIHandlerDashboard(), []);
  const { addError } = useErrors();
  const { downloadAudio } = useAudioDownload(apiHandler);

  const [rows, setRows] = useState([]);
  const [minTime, setMinTime] = useState(() => dayjs().subtract(DEFAULT_RANGE_DAYS, 'day'));
  const [maxTime, setMaxTime] = useState(() => dayjs());
  const [selectionModel, setSelectionModel] = useState({ type: 'include', ids: new Set() });
  const [loading, setLoading] = useState(false);
  const [downloadingAfid, setDownloadingAfid] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const rangeError =
    minTime && maxTime && minTime.isAfter(maxTime)
      ? 'The start date must be before the end date.'
      : null;

  const fetchRecentData = useCallback(async () => {
    if (!minTime || !maxTime || minTime.isAfter(maxTime)) return;

    setLoading(true);
    setNotice(null);
    try {
      const request = new RecentDataRequest(minTime.valueOf(), maxTime.valueOf());
      const recentData = await apiHandler.get_recent_data(request);
      setRows(recentData.getData());
      setSelectionModel({ type: 'include', ids: new Set() });
    } catch (error) {
      addError(error);
    } finally {
      setLoading(false);
    }
  }, [apiHandler, addError, minTime, maxTime]);

  useEffect(() => {
    fetchRecentData();
  }, [fetchRecentData]);

  const handleDownloadAudio = useCallback(
    async (afid) => {
      setDownloadingAfid(afid);
      try {
        await downloadAudio(afid, new AudioFileRequest(afid));
      } finally {
        setDownloadingAfid(null);
      }
    },
    [downloadAudio],
  );

  const selectedRows = useMemo(() => {
    const { type, ids } = selectionModel;
    return rows.filter((row) => (type === 'include' ? ids.has(row.id) : !ids.has(row.id)));
  }, [rows, selectionModel]);

  const handleExportCsv = () => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : rows;
    if (dataToExport.length === 0) {
      setNotice({ severity: 'warning', message: 'There are no rows to export yet.' });
      return;
    }

    const csv = toCsv(
      ['Time', 'Node ID', 'Audio ID', 'Humidity (RH%)', 'Temperature (F)', 'Pressure (hPa)', 'Rain'],
      dataToExport.map((row) => [
        row.time,
        row.nid,
        row.afid,
        row.humidity,
        row.temperature,
        row.pressure,
        row.rain,
      ]),
    );

    downloadCsv(`coquitones_recent_data_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`, csv);
    setNotice({
      severity: 'success',
      message: `Exported ${dataToExport.length} row${dataToExport.length === 1 ? '' : 's'}.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (selectedRows.length === 0) return;

    setLoading(true);
    try {
      const request = new DeleteRecordRequest(selectedRows.map((row) => row.tid));
      await apiHandler.delete_records(request);
      setDeleteDialogOpen(false);
      setNotice({
        severity: 'success',
        message: `Deleted ${selectedRows.length} record${selectedRows.length === 1 ? '' : 's'}.`,
      });
      await fetchRecentData();
    } catch (error) {
      addError(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'time',
        headerName: 'Time',
        minWidth: 190,
        flex: 1,
        valueGetter: (_value, row) => row.timestamp,
        valueFormatter: (_value, row) => row.time,
      },
      { field: 'nid', headerName: 'Node ID', minWidth: 110, flex: 0.6 },
      { field: 'afid', headerName: 'Audio ID', minWidth: 100, flex: 0.6 },
      { field: 'humidity', headerName: 'Humidity %', minWidth: 130, flex: 0.6 },
      { field: 'temperature', headerName: 'Temp °F', minWidth: 110, flex: 0.5 },
      { field: 'pressure', headerName: 'Pressure hPa', minWidth: 150, flex: 0.6 },
      { field: 'rain', headerName: 'Rain', minWidth: 80, flex: 0.4 },
      {
        field: 'actions',
        headerName: 'Audio',
        minWidth: 150,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudDownloadRoundedIcon />}
            onClick={() => handleDownloadAudio(params.row.afid)}
            disabled={downloadingAfid === params.row.afid}
            aria-label={`Download audio for node ${params.row.nid}`}
          >
            {downloadingAfid === params.row.afid ? 'Saving…' : 'Download'}
          </Button>
        ),
      },
    ],
    [downloadingAfid, handleDownloadAudio],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box>
          <Typography component="h2" variant="h6" color="text.primary">
            Recent recordings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rows.length} record{rows.length === 1 ? '' : 's'} in the selected range
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchRecentData}
            disabled={loading || Boolean(rangeError)}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={handleExportCsv}
            disabled={loading || rows.length === 0}
          >
            Export CSV{selectedRows.length > 0 ? ` (${selectedRows.length})` : ''}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={selectedRows.length === 0 || loading}
          >
            Delete{selectedRows.length > 0 ? ` (${selectedRows.length})` : ''}
          </Button>
        </Stack>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <DateTimePicker
            label="From"
            value={minTime}
            onChange={setMinTime}
            maxDateTime={maxTime ?? undefined}
            slotProps={{ textField: { size: 'small', error: Boolean(rangeError) } }}
          />
          <DateTimePicker
            label="To"
            value={maxTime}
            onChange={setMaxTime}
            minDateTime={minTime ?? undefined}
            slotProps={{ textField: { size: 'small', error: Boolean(rangeError) } }}
          />
        </Stack>
      </LocalizationProvider>

      {rangeError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {rangeError}
        </Alert>
      )}

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={setSelectionModel}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        autoHeight
        sx={{
          minHeight: 420,
          borderColor: 'divider',
          '& .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-columnHeader:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: -2,
          },
        }}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete selected records?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes {selectedRows.length} record
            {selectedRows.length === 1 ? '' : 's'}, together with the linked audio and weather data.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={loading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
