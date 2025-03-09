import * as React from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from './Title';

// Generate Order Data
function createData(id, date, name, shipTo, paymentMethod, amount) {
    return { id, date, name, shipTo, paymentMethod, amount };
}

const rows = [
    createData(
        0,
        '16 February, 2024',
        '1',
        'Bosque Susua, Yauco',
        'Temp: 77 F, Humidity: 70 RH%, Pressure: 1000 hPa',
        '5MB',
    ),
    createData(
        1,
        '16 February, 2024',
        '1',
        'Bosque Susua, Yauco',
        'Temp: 77 F, Humidity: 70 RH%, Pressure: 1000 hPa',
        '5MB',
    ),
    createData(2,
        '16 February, 2024',
        '3',
        'Bosque Susua, Yauco',
        'Temp: 77 F, Humidity: 70 RH%, Pressure: 1000 hPa',
        '5MB',
    ),

    createData(
        3,
        '16 February, 2024',
        '2',
        'Bosque Susua, Yauco',
        'Temp: 77 F, Humidity: 70 RH%, Pressure: 1000 hPa',
        '5MB',
    ),
    createData(
        4,
        '15 February, 2024',
        '2',
        'Bosque Susua, Yauco',
        'Temp: 77 F, Humidity: 70 RH%, Pressure: 1000 hPa',
        '5MB',
    ),
];

function preventDefault(event) {
    event.preventDefault();
}

export default function RecentEntries() {
    return (
        <React.Fragment>
            <Title>Recent Database Entries </Title>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell align="center">Date</TableCell>
                        <TableCell align="center">Node ID</TableCell>
                        <TableCell align="center">Location</TableCell>
                        <TableCell align="center">Climate Data</TableCell>
                        <TableCell align="center">Audio File Size</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell align="center">{row.date}</TableCell>
                            <TableCell align="center">{row.name}</TableCell>
                            <TableCell align="center">{row.shipTo}</TableCell>
                            <TableCell align="center">{row.paymentMethod}</TableCell>
                            <TableCell align="center">{row.amount}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
                See all Entries
            </Link>
        </React.Fragment>
    );
}
