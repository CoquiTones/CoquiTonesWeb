import React, { useEffect, useState, useMemo } from "react";
import { DataGrid } from '@mui/x-data-grid'
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import RecentDataRequest from "../../services/rest/RequestORM/Dashboard/RecentDataRequest";
export default function DataTable() {
    const APIHandler = useMemo(() => new APIHandlerDashboard(), []);
    const paginationModel = { page: 0, pageSize: 5 };
    const columns = [
        { field: 'time', headerName: 'Time', width: 135 },
        { field: 'nid', headerName: 'Node ID', width: 135 },
        { field: 'afid', headerName: 'Audio ID', width: 135 }, // make available to download 
        { field: 'humidity', headerName: 'Humidity (RH%)', width: 135 },
        { field: 'temperature', headerName: 'Temperature (F)', width: 135 },
        { field: 'pressure', headerName: 'Pressure (hPa)', width: 135 },
        { field: 'rain', headerName: 'Rain', width: 135 }

    ]

    const [rows, setRows] = useState([]);
    const [minTime, setMinTime] = useState(new Date().getTime() - (1000 * 60 * 60 * 24 * 30)); // 5 days ago
    const [maxTime, setMaxTime] = useState((new Date().getTime()));
    useEffect(() => {
        const fetchRecentDataRows = async () => {
            const recentDataRequest = new RecentDataRequest(minTime, maxTime);
            const rows = await APIHandler.get_recent_data(recentDataRequest);
            setRows(rows.getData());
        }
        fetchRecentDataRows();
    }, [])

    return (
        <DataGrid
            columns={columns}
            rows={rows}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10]}
            checkboxSelection
        >

        </DataGrid>
    )
}