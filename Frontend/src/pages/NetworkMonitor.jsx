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
import DataHandler from "../services/DataHandler";
import NewNodeDialog from "../components/shared/NewNodeDialog";
import HeroSectionCDN from "../components/shared/HeroSectionCDN";
import MapEmbed from "../components/NetworkMonitor/Map";
const NetworkMonitor = () => {
  const getDate = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const date = today.getDate();
    return `${month}/${date}/${year}`;
  };

  const [ducks, setDucks] = useState([]);

  useEffect(() => {
    const fetchDucks = async () => {
      const dataHandler = new DataHandler("node");
      const nodes = await dataHandler.get_all();
      console.log(nodes);
      setDucks(nodes);
    };

    fetchDucks();
  }, []);

  const calcultaCols = () => {
    return Math.ceil(Math.sqrt(ducks.length));
  };
  const numCols = useMemo(() => calcultaCols(), [ducks]);

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
        <NewNodeDialog
          setDucks={setDucks}
          style={{ display: "flex", justifyContent: "flex-end" }}
        />
        <NodeWrapper>
          {ducks.map((duck) => (
            <NodeCard item key={duck.nid}>
              <NodeTitle>Duck ID: {duck.nid}</NodeTitle>
              <NodeInfo>Type: {duck.ntype}</NodeInfo>
              <NodeInfo>Description: {duck.ndescription}</NodeInfo>
              <NodeInfo>Latitude: {duck.nlatitude}</NodeInfo>
              <NodeInfo>Longitude: {duck.nlongitude}</NodeInfo>
              <Link href="#" variant="button" style={{ marginTop: "16px" }}>
                View Details
              </Link>
            </NodeCard>
          ))}
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
            <MapEmbed ducks={ducks} />
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
