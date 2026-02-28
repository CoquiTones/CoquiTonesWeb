import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DataGrid } from '@mui/x-data-grid'
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import RecentDataRequest from "../../services/rest/RequestORM/Dashboard/RecentDataRequest";
import { Box, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function DataTable() {
    const APIHandler = useMemo(() => new APIHandlerDashboard(), []);
    const paginationModel = { page: 0, pageSize: 5 };

    const [rows, setRows] = useState([]);
    const [minTime, setMinTime] = useState(new Date().getTime() - (1000 * 60 * 60 * 24 * 30));
    const [maxTime, setMaxTime] = useState(new Date().getTime());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRowForDelete, setSelectedRowForDelete] = useState(null);
    const [loading, setLoading] = useState(false);

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
    }, [minTime, maxTime]);

    // Delete row handler
    const handleDeleteClick = (id) => {
        setSelectedRowForDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
    };

    // Download audio file
    const handleDownloadAudio = async (afid) => {
    };

    // Export CSV
    const handleExportCSV = () => {
    };

    const columns = [
        { field: 'time', headerName: 'Time', width: 115, },
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
                    >
                        Audio
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

            <DataGrid
                columns={columns}
                rows={rows}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5, 10, 100]}
                checkboxSelection
                loading={loading}
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
