import React, { useEffect, useState, useMemo } from "react";
import { DataGrid } from '@mui/x-data-grid'
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import RecentDataRequest from "../../services/rest/RequestORM/Dashboard/RecentDataRequest";
export default function DataTable() {
    const APIHandler = useMemo(() => new APIHandlerDashboard(), []);
    const paginationModel = { page: 0, pageSize: 5 };
    const columns = [
        { field: 'id', headerName: 'ID' },
        { field: 'nid', headerName: 'Node ID' },
        { field: 'afid', headerName: 'Audio ID' }, // make available to download 
        { field: 'humidity', headerName: 'Humidity (RH%)' },
        { field: 'temperature', headerName: 'Temperature (F)' },
        { field: 'pressure', headerName: 'Pressure (hPa)' },
        { field: 'rain', headerName: 'Rain' }
    ]

    const [rows, setRows] = useState([]);
    const [minTime, setMinTime] = useState((new Date().getTime() - (1000 * 60 * 24)))
    const [maxTime, setMaxTime] = useState((new Date().getTime()));
    useEffect(() => {
        const fetchRecentDataRows = async () => {
            const recentDataRequest = new RecentDataRequest(minTime, maxTime);
            const rows = await APIHandler.get_recent_data(recentDataRequest)
            return rows;
        }
        setRows(fetchRecentDataRows());
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