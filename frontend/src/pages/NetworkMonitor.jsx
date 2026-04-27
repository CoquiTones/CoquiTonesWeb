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
import { Alert, Container, Typography, Button, Stack, Snackbar, TextField, CircularProgress, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useGlobalState } from "../services/Authentication/GlobalStateManager";
import { ErrorContext } from "../components/shared/ErrorContext";

const NetworkMonitor = () => {
  const [nodes, setNodes] = useState([]);
  const [nodesWithNoClient, setNodesWithNoClient] = useState([]);
  const [nodePasswords, setNodePasswords] = useState([]);
  const [syncingNodeIds, setSyncingNodeIds] = useState(new Set());
  const [failedNodeIds, setFailedNodeIds] = useState(new Set());
  const apiHandler = useMemo(() => new APIHandlerNetworkMonitor());
  const { errors, setErrors } = useContext(ErrorContext);

  const fetchNodes = async () => {
    const nodes = await apiHandler.get_all_nodes();
    setNodes(nodes);
  };

  const checkNodesWithNoClient = async () => {
    const nodes_with_no_client = await apiHandler.get_nodes_with_no_client();
    if (!nodes_with_no_client.isEmpty()) {
      setIsWarningOpen(true)
      setNodesWithNoClient(nodes_with_no_client);
    } else {
      setNodesWithNoClient([]);
      setIsWarningOpen(false);
    }
  };

  const handleChangePasswordForNode = async (node, nodePassword) => {
    setNodePasswords((prevPasswords) => {
      const exists = prevPasswords.find((np) => np.node === node.nid);

      if (exists) {
        // Update existing password
        return prevPasswords.map((np) =>
          np.node === node.nid ? { node: node.nid, password: nodePassword } : np
        );
      } else {
        // Add new password entry
        return [...prevPasswords, { node: node.nid, password: nodePassword }];
      }
    });
  };

  const createClientForNode = async (node) => {
    try {
      const nodePasswordObj = nodePasswords.find(
        (nodePasswords) => nodePasswords.node === node.nid
      );

      // Safety check - ensure the password object exists
      if (!nodePasswordObj) {
        setErrors([...errors, `No password provided for node ${node.nid}`]);
        setFailedNodeIds((prev) => new Set([...prev, node.nid]));
        return;
      }

      // Set loading state
      setSyncingNodeIds((prev) => new Set([...prev, node.nid]));

      await apiHandler.create_client_for_node(node, nodePasswordObj.password);

      // Remove password after successful creation
      setNodePasswords((prevPasswords) =>
        prevPasswords.filter((np) => np.node !== node.nid)
      );

      // Fetch updated nodes
      await fetchNodes();
      await checkNodesWithNoClient();

      // Clear loading state
      setSyncingNodeIds((prev) => {
        const updated = new Set(prev);
        updated.delete(node.nid);
        return updated;
      });
    } catch (apiException) {
      setErrors([...errors, apiException]);

      // Set failure state
      setFailedNodeIds((prev) => new Set([...prev, node.nid]));

      // Clear loading state
      setSyncingNodeIds((prev) => {
        const updated = new Set(prev);
        updated.delete(node.nid);
        return updated;
      });

      // Clear failure status after 3 seconds
      setTimeout(() => {
        setFailedNodeIds((prev) => {
          const updated = new Set(prev);
          updated.delete(node.nid);
          return updated;
        });
      }, 3000);
    }
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

  const isSyncing = (nodeId) => syncingNodeIds.has(nodeId);
  const isFailed = (nodeId) => failedNodeIds.has(nodeId);
  const hasClient = (nodeId) => !nodesWithNoClient.find((node) => node.nid === nodeId);

  return (
    <>
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
                        onChange={(event) => handleChangePasswordForNode(node, event.target.value)}
                        disabled={isSyncing(node.nid)}
                      />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                        <Button
                          onClick={() => createClientForNode(node)}
                          disabled={isSyncing(node.nid)}
                        >
                          Create Client
                        </Button>
                        {isSyncing(node.nid) && (
                          <CircularProgress size={24} />
                        )}
                        {isFailed(node.nid) && (
                          <ErrorIcon sx={{ color: "error.main", fontSize: 28 }} />
                        )}
                      </Box>
                    </>
                  }
                  {hasClient(node.nid) && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                      <CheckCircleIcon sx={{ color: "success.main", fontSize: 28 }} />
                      <Typography variant="body2" sx={{ color: "success.main" }}>
                        MQTT Client Created
                      </Typography>
                    </Box>
                  )}
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
    </>
  );
};

export default NetworkMonitor;
