import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import RecentDataRequest from "../../services/rest/RequestORM/Dashboard/RecentDataRequest";
import AudioFileRequest from "../../services/rest/RequestORM/Shared/AudioFileRequest";
import { useAudioDownload } from "../../hooks/useAudioDownload";
import DeleteRecordRequest from "../../services/rest/RequestORM/Dashboard/DeleteRecordRequest";

export default function DataTable({ errors, setErrors }) {
    const apiHandler = useMemo(() => new APIHandlerDashboard(), []);
    const paginationModel = { page: 0, pageSize: 5 };

    const [rows, setRows] = useState([]);
    // ms since epoch
    const [minTime, setMinTime] = useState(new Date().getTime() - (1000 * 60 * 60 * 24 * 100));
    const [maxTime, setMaxTime] = useState(new Date().getTime());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]); // needed for initial rendering
    const [loading, setLoading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);

    const { downloadAudio, loading: downloadLoading, error: downloadErrorMsg } = useAudioDownload(apiHandler);

    const fetchRecentDataRows = useCallback(async () => {
        setLoading(true);
        try {
            const recentDataRequest = new RecentDataRequest(minTime, maxTime);
            const rows = await apiHandler.get_recent_data(recentDataRequest);
            setRows(rows.getData());
        } catch (error) {
            setDownloadError("Failed to fetch data");
            setErrors([...errors, error])
        } finally {
            setLoading(false);
        }
    }, [minTime, maxTime, apiHandler]);

    const handleSelectionChange = useCallback((newSelection) => {

        if (newSelection.type === "exclude") {
            setSelectedRows(rows)
        }
        else {

            const newSelectedRows = rows.filter((row) => newSelection.ids?.has(row.id));
            setSelectedRows(newSelectedRows);
        }
    })
    useEffect(() => {
        fetchRecentDataRows();
    }, [fetchRecentDataRows]);

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedRows === null) return;

        try {
            setLoading(true)
            const deleteRecordsRequest = new DeleteRecordRequest(selectedRows.map((selectedRow) => (selectedRow.tid)));
            await apiHandler.delete_records(deleteRecordsRequest);
            fetchRecentDataRows();
        } catch (error) {
            setDownloadError("Failed to delete record");
        } finally {
            setLoading(false)
            setDeleteDialogOpen(false);
        }
    };

    const handleDownloadAudio = useCallback(async (afid) => {
        setDownloadError(null);
        const audioFileRequest = new AudioFileRequest(afid);
        await downloadAudio(afid, audioFileRequest);
    }, [downloadAudio]);

    const handleExportCSV = () => {
        // Use selected rows if any are selected, otherwise export all
        const dataToExport = selectedRows;

        if (dataToExport.length === 0) {
            setDownloadError("No rows to export");
            return;
        }

        const headers = ['Time', 'Node ID', 'Audio ID', 'Humidity', 'Temperature', 'Pressure', 'Rain'];
        const csvContent = [
            headers.join(','),
            ...dataToExport.map((row) =>
                [row.time, row.nid, row.afid, row.humidity, row.temperature, row.pressure, row.rain]
                    .map((val) => `"${val}"`) // Wrap in quotes to handle commas in data
                    .join(',')
            )
        ].join('\n');

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
        element.setAttribute('download', `recent_data_${new Date().toISOString()}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const columns = [
        { field: 'time', headerName: 'Time', width: 115 },
        { field: 'nid', headerName: 'Node ID', width: 115 },
        { field: 'afid', headerName: 'Audio ID', width: 115 },
        { field: 'humidity', headerName: 'Humidity (RH%)', width: 115 },
        { field: 'temperature', headerName: 'Temperature (F)', width: 115 },
        { field: 'pressure', headerName: 'Pressure (hPa)', width: 115 },
        { field: 'rain', headerName: 'Rain', width: 115 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 250,
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CloudDownloadIcon />}
                        onClick={() => handleDownloadAudio(params.row.afid)}
                        disabled={downloadLoading}
                    >
                        {downloadLoading ? 'Downloading...' : 'Audio'}
                    </Button>

                </Stack>
            )
        }
    ];

    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportCSV}
                >
                    Export CSV {selectedRows.length > 0 && `(${selectedRows.length})`}
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick()}
                >
                    Delete
                </Button>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                        label="MinDateTime"
                        onChange={(newMinDate) => setMinTime(new Date(newMinDate).getTime())}
                    />
                    <DateTimePicker
                        label="MaxDateTime"
                        onChange={(newMaxDate) => setMaxTime(new Date(newMaxDate).getTime())}
                    />
                </LocalizationProvider>
            </Stack>

            {(downloadError || downloadErrorMsg) && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDownloadError(null)}>
                    {downloadError || downloadErrorMsg}
                </Alert>
            )}

            <DataGrid
                columns={columns}
                rows={rows}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5, 10, 100]}
                onRowSelectionModelChange={handleSelectionChange}
                loading={loading || downloadLoading}
                checkboxSelection
                disableRowSelectionOnClick
            />

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this record? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
