import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import RecentDataRequest from "../../services/rest/RequestORM/Dashboard/RecentDataRequest";
import AudioFileRequest from "../../services/rest/RequestORM/Shared/AudioFileRequest";
import { useAudioDownload } from "../../hooks/useAudioDownload";

export default function DataTable({ Actions }) {
    const APIHandler = useMemo(() => new APIHandlerDashboard(), []);
    const paginationModel = { page: 0, pageSize: 5 };

    const [rows, setRows] = useState([]);
    const [minTime, setMinTime] = useState(new Date().getTime() - (1000 * 60 * 60 * 24 * 7)); // last week
    const [maxTime, setMaxTime] = useState(new Date().getTime());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRowForDelete, setSelectedRowForDelete] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);

    // Use custom hook
    const { downloadAudio, loading: downloadLoading, error: downloadErrorMsg } = useAudioDownload(APIHandler);

    // Fetch data with backend sorting
    const fetchRecentDataRows = useCallback(async () => {
        setLoading(true);
        try {
            const recentDataRequest = new RecentDataRequest(minTime, maxTime);
            const rows = await APIHandler.get_recent_data(recentDataRequest);
            setRows(rows.getData());
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [minTime, maxTime, APIHandler]);

    // Initial fetch
    useEffect(() => {
        fetchRecentDataRows();
    }, [fetchRecentDataRows]);

    // Delete row handler
    const handleDeleteClick = (id) => {
        setSelectedRowForDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        // Implement delete logic
        setDeleteDialogOpen(false);
    };

    // Download audio file
    const handleDownloadAudio = useCallback(async (afid) => {
        setDownloadError(null);
        const audioFileRequest = new AudioFileRequest(afid);
        await downloadAudio(afid, audioFileRequest);
    }, [downloadAudio]);

    // Export CSV
    const handleExportCSV = () => {
        // Implement CSV export
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
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(params.row.id)}
                    >
                        Delete
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
                    Export CSV
                </Button>
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
                checkboxSelection
                loading={loading || downloadLoading}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
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
