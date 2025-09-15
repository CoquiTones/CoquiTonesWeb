import { Fragment, useEffect, useState } from "react";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Title from "./Title";
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import Box from "@mui/material/Box";

export default function RecentEntries() {
  const [recentReports, setRecentReports] = useState(null);
  const columnHeaders = [
    "Date",
    "coqui",
    "wightmanae",
    "gryllus",
    "portoricensis",
    "unicolor",
    "hedricki",
    "locustus",
    "richmondi",
    "Humidity",
    "Temperature",
    "Pressure",
    "Raining",
  ];

  useEffect(() => {
    const getRecentReports = async () => {
      const dashboardAPIHandler = new APIHandlerDashboard();
      let recent_reports = await dashboardAPIHandler.get_recent_reports();
      setRecentReports(recent_reports);
    };

    getRecentReports();
  }, []);

  return (
    <div>
      <Title>Recent Database Entries</Title>
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              {columnHeaders.map((header) => (
                <TableCell key={header} align="center" sx={{ padding: "16px" }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {recentReports &&
              recentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell align="center">
                    {new Date(report.ttime).toUTCString()}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.coqui}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wightmanae}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.gryllus}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.portoricensis}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.unicolor}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.hedricki}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.locustus}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.richmondi}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wdhumidity}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wdtemperature}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wdpressure}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wddid_rain ? "YES" : "NO"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
    </div>
  );
}
