import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";

import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Title from "./Title";
import { NodeHealthCheck } from "../../services/rest/ResponseORM/Dashboard/NodeHealthCheck";
export default function LatestNodeHeartbeat() {
  const [heartbeatInfo, setHeartbeatInfo] = useState(null);
  const columnHeaders = [
    "Latest Time",
    "Node Type",
    "Node Description"
  ]
  useEffect(() => {
    const fetchHeartbeatInfo = async () => {
      const apiHandler = new APIHandlerDashboard();
      const heartbeatInfo = await apiHandler.get_node_health_check();
      setHeartbeatInfo(heartbeatInfo);
    };
    fetchHeartbeatInfo();
  }, []);

  // Show message if no  message available
  if (!heartbeatInfo) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
        minHeight="400px"
      >
        <div>No messages yet...</div>
      </Box>
    );
  }
  return (
    <Box
      sx={{ overflowX: "auto" }} >
      <Title>
        Node Health Check
      </Title>
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
          {heartbeatInfo.map((node_report) => (
            <TableRow key={node_report.node_description}>
              <TableCell align="center">
                {new Date(node_report.latest_time).toUTCString()}
              </TableCell>
              <TableCell align="center">
                {node_report.node_type}
              </TableCell>
              <TableCell align="center">
                {node_report.node_description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>

  );
}
