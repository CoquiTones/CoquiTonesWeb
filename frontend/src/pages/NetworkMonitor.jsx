import React, { useState, useMemo, useEffect, useContext } from "react";
import {
  NodeContainer,
  NodeWrapper,
  NodeCard,
  NodeTitle,
  NodeInfo,
} from "../components/shared/NodeStyle";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import { APIHandlerNetworkMonitor } from "../services/rest/APIHandler/APIHandlerNetworkMonitor";
import NewNodeDialog from "../components/shared/NewNodeDialog";
import HeroSectionCDN from "../components/shared/HeroSectionCDN";
import MapEmbed from "../components/NetworkMonitor/Map";
import { Typography, Stack } from "@mui/material";
import ErrorAlerts from "../components/shared/ErrorAlerts";
import { ErrorContext } from "../components/shared/ErrorContext";
const NetworkMonitor = () => {
  const [nodes, setNodes] = useState([]);
  const { errors, setErrors } = useContext(ErrorContext);

  const [warningsAndActions, setWarningsAndActions] = useState([]);
  const apiHandler = useMemo(() => new APIHandlerNetworkMonitor());
  const fetchNodes = async () => {
    try {
      const nodes = await apiHandler.get_all_nodes();
      setNodes(nodes);
    } catch (error) {
      setErrors([...errors, error])
    }
  };
  useEffect(() => {

    fetchNodes();
  }, []);
  return (
    <>
      <ErrorAlerts errors={errors} setErrors={setErrors} />
      <Stack>
        <HeroSectionCDN />
        <NodeContainer>
          <Typography
            sx={{ display: "flex", justifyContent: "center" }}
            color="primary"
            variant="h3"
          >
            Duck Network
          </Typography>
          <NewNodeDialog
            setDucks={setNodes}
            errors={errors}
            setErrors={setErrors}
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "5vh",
            }}
          />
          <NodeWrapper>
            {nodes.length === 0 ? (
              <Typography
                sx={{ display: "flex", justifyContent: "center" }}
                color="primary"
                variant={"h3"}
              >
                {" "}
                No Ducks to display
              </Typography>
            ) : (
              nodes.map((node) => (
                <NodeCard item key={node.nid}>
                  <NodeTitle>Duck ID: {node.nid}</NodeTitle>
                  <NodeInfo>Type: {node.ntype}</NodeInfo>
                  <NodeInfo>Description: {node.ndescription}</NodeInfo>
                  <NodeInfo>Latitude: {node.nlatitude}</NodeInfo>
                  <NodeInfo>Longitude: {node.nlongitude}</NodeInfo>
                  <Link href="#" variant="button" style={{ marginTop: "16px" }}>
                    View Details
                  </Link>
                </NodeCard>
              ))
            )}
          </NodeWrapper>
        </NodeContainer>

        <Grid item lg={8}>
          <Paper
            elevation={4}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "75vh",
            }}
          >
            <div style={{ height: "100%" }}>
              {" "}
              {/* Ensure map container fills parent's height */}
              <MapEmbed ducks={nodes} />
            </div>
          </Paper>
        </Grid>
      </Stack>

      {/* </Container>
                </Box>
                </Box>
                <Footer/> */}
    </>
  );
};

export default NetworkMonitor;
