import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";

import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Title from "./Title";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DangerousIcon from '@mui/icons-material/Dangerous';
import { styled } from '@mui/material/styles';

export default function LatestNodeHeartbeat() {
  const [heartbeatInfo, setHeartbeatInfo] = useState(null);
  const MAX_ALLOWED_TIME_IN_HOURS_BEFORE_DECLARED_UNRESPONSIVE = 48 // hours
  const columnHeaders = [
    "Latest Time",
    "Node Type",
    "Node Description",
    "Responsive"
  ]
  useEffect(() => {
    const fetchHeartbeatInfo = async () => {
      const apiHandler = new APIHandlerDashboard();
      const heartbeatInfo = await apiHandler.get_node_health_check();
      setHeartbeatInfo(heartbeatInfo);
    };
    fetchHeartbeatInfo();
  }, []);
  const isResponsive = (node_info) => {
    const node_info_latest_time = new Date(node_info.latest_time).getTime() / 1000 / 60 / 60;
    const now = new Date().getTime() / 1000 / 60 / 60;

    if (Math.abs(node_info_latest_time - now) > MAX_ALLOWED_TIME_IN_HOURS_BEFORE_DECLARED_UNRESPONSIVE) {
      return <RedUnresponsiveMark />;
    }

    return <GreenCheckmark />;
  }

  const GreenCheckmark = styled(CheckCircleIcon)({
    color: '#03f910',
  });

  const RedUnresponsiveMark = styled(DangerousIcon)({
    color: "red"
  })
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
              <TableCell align="center">
                {isResponsive(node_report)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>

  );
}
