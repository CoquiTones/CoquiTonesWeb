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
import { Alert, Container, Typography, Button, Stack, Snackbar, TextField } from "@mui/material";
import { useGlobalState } from "../services/Authentication/GlobalStateManager";
const NetworkMonitor = () => {
  const [nodes, setNodes] = useState([]);
  const [nodesWithNoClient, setNodesWithNoClient] = useState([]);
  const [nodePasswords, setNodePasswords] = useState([])
  const { errors, setErrors } = useGlobalState();
  const apiHandler = useMemo(() => new APIHandlerNetworkMonitor());

  const fetchNodes = async () => {
    const nodes = await apiHandler.get_all_nodes();
    setNodes(nodes);
  };

  const checkNodesWithNoClient = async () => {
    const nodes_with_no_client = await apiHandler.get_nodes_with_no_client();
    if (!nodes_with_no_client.isEmpty()) {
      setIsWarningOpen(true)
      setNodesWithNoClient(nodes_with_no_client);
    }
  };

  const createClientForNode = async (node) => {
    try {
      const nodeClientPassword = nodePasswords.find((nodePasswords) => nodePasswords.node === node.nid).password
      await apiHandler.create_client_for_node(node, nodeClientPassword);
      fetchNodes();
    } catch (apiException) {
      setErrors([...errors, apiException]);
    };
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
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  return (
    <ThemeProvider theme={theme}>
      {/* Warning Snackbars */}
      <Snackbar
        open={isWarningOpen}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          action={
            <>
              <Button
                size="small"
                onClick={() => setIsWarningOpen(false)}>
                Hide
              </Button>
            </>
          }
        >
          Some Nodes were found to not have mqtt clients. Nodes: {nodesWithNoClient.map((node) => (node.nid)).join(", ")}
        </Alert>
      </Snackbar >


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
                  {nodesWithNoClient.find((node_from_list) => node.nid === node_from_list.nid) && // if node doesn't have mqtt client.
                    <>
                      <TextField
                        required
                        margin="dense"
                        id={`node-${node.nid}-password`}
                        label="mqtt-node-password"
                        type="password"
                        fullWidth
                        variant="standard"
                        onChange={(event) => setNodePasswords([...nodePasswords, { node: node.nid, password: event.target.value }])}
                      />
                      <Button onClick={() => createClientForNode(node)} >
                        Create Client
                      </Button>
                    </>
                  }
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
    </ThemeProvider >
  );
};

export default NetworkMonitor;
