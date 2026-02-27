import React, { useEffect, useState, useMemo } from "react";
import { DataGrid } from '@mui/x-data-grid'
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import RecentDataRequest from "../../services/rest/RequestORM/Dashboard/RecentDataRequest";
export default function DataTable() {
    const APIHandler = useMemo(() => new APIHandlerDashboard(), []);
    const paginationModel = { page: 0, pageSize: 5 };
    const columns = [
        { field: 'id', headerName: 'ID', width: 140 },
        { field: 'nid', headerName: 'Node ID', width: 140 },
        { field: 'afid', headerName: 'Audio ID', width: 140 }, // make available to download 
        { field: 'humidity', headerName: 'Humidity (RH%)', width: 140 },
        { field: 'temperature', headerName: 'Temperature (F)', width: 140 },
        { field: 'pressure', headerName: 'Pressure (hPa)', width: 140 },
        { field: 'rain', headerName: 'Rain', width: 140 }
    ]

    const [rows, setRows] = useState([]);
    const [minTime, setMinTime] = useState(new Date().getTime() - (1000 * 60 * 60 * 24 * 5));
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