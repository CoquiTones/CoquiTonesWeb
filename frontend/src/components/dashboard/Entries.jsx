import { Fragment, useEffect, useState } from "react";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import Title from "./Title";
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
export default function RecentEntries() {
  const [recentReports, setRecentReports] = useState(null);
  useEffect(() => {
    const getRecentReports = async () => {
      const dashboardAPIHandler = new APIHandlerDashboard();
      let recentReportsAPIResponse = dashboardAPIHandler.get_recent_reports();
    };
  }, []);
  return (
    <Fragment>
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
    </Fragment>
  );
}
