import React, { useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
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
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import theme from "../components/shared/Theme";
import { APIHandlerNetworkMonitor } from "../services/rest/APIHandler/APIHandlerNetworkMonitor";
import NewNodeDialog from "../components/shared/NewNodeDialog";
import HeroSectionCDN from "../components/shared/HeroSectionCDN";
import MapEmbed from "../components/NetworkMonitor/Map";
import { Alert, Container, Typography, Button, Stack, Snackbar } from "@mui/material";
import { APIHandlerError } from "../services/rest/APIHandler/Errors";

const NetworkMonitor = () => {
  const [nodes, setNodes] = useState([]);
  const [nodesWithNoClient, setNodesWithNoClient] = useState([]);
  const [warningsAndActionMap, setWarningsAndActionMap] = useState([]); // list of string warnings
  const [errors, setErrors] = useState([]); // list of exceptions (mostly all from api handling)
  const apiHandler = useMemo(() => new APIHandlerNetworkMonitor());

  const fetchNodes = async () => {
    const nodes = await apiHandler.get_all_nodes();
    setNodes(nodes);
  };

  const checkNodesWithNoClient = async () => {
    const nodes_with_no_client = await apiHandler.get_nodes_with_no_client();
    if (!nodes_with_no_client.isEmpty()) {
      const node_id_with_no_client = nodes_with_no_client.map((node) => node.nid);
      setWarningsAndActionMap([
        ...warningsAndActionMap,
        {
          message: "Some Nodes were found to not have mqtt clients. This could mean that nodes aren't publishing data. Nodes: " +
            node_id_with_no_client, action: handleSyncNodeClients
        },
      ]);
      setNodesWithNoClient(nodes_with_no_client);
    }
  };

  const handleSyncNodeClients = async (warningMessageAndActionMap) => {
    nodesWithNoClient.map(async (node) => {
      try {
        await apiHandler.create_client_for_node(node);
        const new_warnings = warningsAndActionMap.filter((warning) => warning.message !== warningMessageAndActionMap);
        setWarningsAndActionMap(new_warnings);
      } catch (apiException) {
        setErrors([...errors, apiException]);
      }
    });
  };

  const handleCloseWarning = (warningMessageAndActionMap) => {
    const new_warnings = warningsAndActionMap.filter((warning) => warning.message !== warningMessageAndActionMap.message);
    setWarningsAndActionMap(new_warnings);
  };

  const handleCloseError = (error) => {
    const new_errors = errors.filter((e) => e !== error);
    setErrors(new_errors);
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  useEffect(() => {
    checkNodesWithNoClient();
  }, [nodes]);

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Warning Snackbars */}
      {warningsAndActionMap &&
        warningsAndActionMap.length !== 0 &&
        warningsAndActionMap.map((warningMessageAndActionMap, index) => (
          <Snackbar
            key={`warning-${index}`}
            open={warningsAndActionMap.length !== 0}
            onClose={() => handleCloseWarning(warningMessageAndActionMap)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            sx={{
              top: `${80 + index * 100}px !important`,
            }}
          >
            <Alert
              severity="warning"
              onClose={() => handleCloseWarning(warningMessageAndActionMap)}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => warningMessageAndActionMap.action(warningMessageAndActionMap)}
                >
                  {warningMessageAndActionMap.action.name}
                </Button>
              }
            >
              {warningMessageAndActionMap.message}
            </Alert>
          </Snackbar>
        ))}

      {/* Error Snackbars */}
      {errors &&
        errors.length !== 0 &&
        errors.map((error, index) => (
          <Snackbar
            key={`error-${index}`}
            open={errors.length !== 0}
            autoHideDuration={8000}
            onClose={() => handleCloseError(error)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            sx={{
              top: `${80 + (warningsAndActionMap.length + index) * 100}px !important`,
            }}
          >
            <Alert
              severity="error"
              onClose={() => handleCloseError(error)}
            >
              {error.message}
            </Alert>
          </Snackbar>
        ))}

      <Stack>
        <Sidebar isOpen={isOpen} toggle={toggle} />
        <Navbar toggle={toggle} />
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

        <Container id="map-embed-id" sx={{ mt: 4, mb: 4, width: "100%" }}>
          <Grid item lg={8}>
            <Paper
              elevation={4}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: "95%",
                width: "95%",
              }}
            >
              <MapEmbed Nodes={nodes} />
            </Paper>
          </Grid>
        </Container>
      </Stack>
    </ThemeProvider>
  );
};

export default NetworkMonitor;
