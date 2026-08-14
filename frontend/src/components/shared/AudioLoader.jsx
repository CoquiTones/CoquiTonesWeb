import React, { useMemo, useState, useCallback, useEffect } from "react";
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import { Box, Modal, Typography, Stack, Button } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DataGrid } from "@mui/x-data-grid";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import RecentDataRequest from "../../services/rest/RequestORM/Dashboard/RecentDataRequest";



const AudioLoader = ({ isOpen, setAudioFile }) => {
    const apiHandler = useMemo(() => new APIHandlerDashboard(), []);
    const paginationModel = { page: 0, pageSize: 5 };
    const [minTime, setMinTime] = useState(new Date().getTime() - (1000 * 60 * 60 * 24 * 100));
    const [maxTime, setMaxTime] = useState(new Date().getTime());
    const [rows, setRows] = useState([]);
    const fetchRecentDataRows = useCallback(async () => {
        // setLoading(true);
        try {
            const recentDataRequest = new RecentDataRequest(minTime, maxTime);
            const rows = await apiHandler.get_recent_data(recentDataRequest);
            setRows(rows.getData());
        } catch (error) {
            console.error("oh no!")
        } finally {
            console.log("finally.")
        }
    }, [minTime, maxTime, apiHandler]);

    useEffect(() => {
        fetchRecentDataRows();
    }, [fetchRecentDataRows]);
    const handleLoadAudio = async (audioId) => {
        const audioFileRequest = new AudioFileRequest(afid);
        const audioFile = await apiHandler.getAudioById(audioFileRequest);
        setAudioFile(audioFile);
    }
    const columns = [
        { field: 'time', headerName: 'Time', width: 115 },
        { field: 'nid', headerName: 'Node ID', width: 115 },
        { field: 'afid', headerName: 'Audio ID', width: 115 },
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
                        onClick={() => handleLoadAudio(params.row.afid)}
                    >
                        load that shit
                    </Button>
                </Stack>
            )
        }
    ];

    return (
        <Modal open={isOpen}>
            <Box >
                <Stack>
                    <Typography id="modal-modal-title" variant="h4" component="h2">
                        Select Audio to Load
                    </Typography>
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
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        initialState={{ pagination: { paginationModel } }}
                        pageSizeOptions={[5, 10, 100]}
                    />
                </Stack>
                {/* table with audio id, node that recorded it, date, Load button */}
            </Box>
        </Modal>
    )
}

export default AudioLoader;