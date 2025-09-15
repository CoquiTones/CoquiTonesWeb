import React, { useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  NodeContainer,
  NodeWrapper,
  NodeCard,
  NodeTitle,
  NodeInfo,
} from "../components/shared/NodeStyle";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import theme from "../components/shared/Theme";
import { APIHandlerNetworkMonitor } from "../services/rest/APIHandler/APIHandlerNetworkMonitor";
import NewNodeDialog from "../components/shared/NewNodeDialog";
import HeroSectionCDN from "../components/shared/HeroSectionCDN";
import MapEmbed from "../components/NetworkMonitor/Map";
import { Typography } from "@mui/material";
const NetworkMonitor = () => {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const fetchNodes = async () => {
      const dataHandler = new APIHandlerNetworkMonitor();
      const nodes = await dataHandler.get_all_nodes();
      console.log(nodes);
      setNodes(nodes);
    };

    fetchNodes();
  }, []);

  const calcultaCols = () => {
    return Math.ceil(Math.sqrt(nodes.length));
  };
  const numCols = useMemo(() => calcultaCols(), [nodes]);

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <ThemeProvider theme={theme}>
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

      {/* </Container>
                </Box>
            </Box>
            <Footer/> */}
    </ThemeProvider>
  );
};

export default NetworkMonitor;
