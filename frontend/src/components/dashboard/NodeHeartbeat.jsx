import React, { useEffect, useState } from "react";
import { Fragment } from "react";
import Link from "@mui/material/Link";
import { Box } from "@mui/material";
import Typography from "@mui/material/Typography";
import Title from "./Title";
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";

export default function LatestNodeHeartbeat() {
  const [heartbeatInfo, setHeartbeatInfo] = useState(null);

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
    <Fragment>
      <Title>Latest Message</Title>
      <Typography component="p" variant="h4">
        From Node {heartbeatInfo.ndescription}
      </Typography>
      <Typography
        component="p"
        variant="h6"
        color="text.s]"
        sx={{ flex: 1, my: 3 }}
      >
        From {new Date(heartbeatInfo.latest_time).toUTCString()}
      </Typography>
      <div>
        <Link color="primary" href="#">
          View Message
        </Link>
      </div>
    </Fragment>
  );
}
