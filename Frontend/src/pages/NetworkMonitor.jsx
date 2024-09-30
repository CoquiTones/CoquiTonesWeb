import React, { useState, useMemo, useEffect } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { NodeContainer, NodeWrapper, NodeCard, NodeTitle, NodeInfo } from "../components/shared/NodeStyle";
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import theme from "../components/shared/Theme"
import DataHandler from "../services/DataHandler";
import NewNodeDialog from "../components/shared/NewNodeDialog";
import Footer from "../components/shared/Footer";
import HeroSectionCDN from "../components/shared/HeroSectionCDN";
import MapEmbed from "../components/NetworkMonitor/Map";
const NetworkMonitor = () => {

  const getDate = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const date = today.getDate();
    return `${month}/${date}/${year}`;
  }



  const [ducks, setDucks] = useState([])

  useEffect(() => {
    const fetchDucks = async () => {
      const dataHandler = new DataHandler("node")
      const nodes = await dataHandler.get_all()
      console.log(nodes)
      setDucks(nodes)
    }

    fetchDucks()

  }, [])

  const calcultaCols = () => {
    return Math.ceil(Math.sqrt(ducks.length));
  }
  const numCols = useMemo(() => calcultaCols(), [ducks])

  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <ThemeProvider theme={theme}>
      <Sidebar isOpen={isOpen} toggle={toggle} />
      <Navbar toggle={toggle} />
      <HeroSectionCDN />
      <NodeContainer>
        <NewNodeDialog setDucks={setDucks} style={{ display: 'flex', justifyContent: 'flex-end' }} />
        <NodeWrapper>
          {ducks.map((duck) =>
            <NodeCard item key={duck.nid}>
              <NodeTitle>
                Duck ID: {duck.nid}
              </NodeTitle>
              <NodeInfo>
                Type: {duck.ntype}
              </NodeInfo>
              <NodeInfo>
                Description: {duck.ndescription}
              </NodeInfo>
              <NodeInfo>
                Latitude: {duck.nlatitude}
              </NodeInfo>
              <NodeInfo>
                Longitude: {duck.nlongitude}
              </NodeInfo>
              <Link href='#' variant='button' style={{ marginTop: '16px' }}>
                View Details
              </Link>

            </NodeCard>)}
        </NodeWrapper>
      </NodeContainer>
      {/* <Box sx={{ display: 'flex' }} >
                <CssBaseline />
                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'light'
                                ? theme.palette.grey[100]
                                : theme.palette.grey[900],
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                    }}
                >
                    <Container maxWidth="lg" sx={{ mt: 10, mb: 10 }}>
                        <Grid item xs={8} md={4} lg={5}>
                            <Paper elevation={4}
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: 150,
                                }}
                            >
                                <Typography variant="h3" color="primary" align="center">
                                    Cluster Duck Network Management
                                </Typography>

                            </Paper >
                        </Grid>
                    </Container >

                    <Container maxWidth sx={{ mt: 10, mb: 10 }}>
                        <NewNodeDialog style={{display: 'flex', justifyContent: 'flex-end'}} />
                        <Grid container spacing={3}>
                            {ducks.map((duck) => (
                                <Grid item key={duck.nid} xs={12} md={6} lg={Math.floor(12 / numCols)}>
                                    <Paper elevation={4}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '100%',
                                        }}
                                    >
                                        <Typography variant="h6" gutterBottom>
                                            Duck ID: {duck.nid}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            Type: {duck.ntype}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            Description: {duck.ndescription}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            Latitude: {duck.nlatitude}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            Longitude: {duck.nlongitude}
                                        </Typography>

                                        <Link href="#" variant="button">
                                            View Details
                                        </Link>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid> */}
      <Grid item xs={12} md={12} lg={12}>
        <Paper elevation={4}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '75vh',
          }}
        >
          <div style={{ height: '100%' }}> {/* Ensure map container fills parent's height */}
            <MapEmbed ducks={ducks} />
          </div>
        </Paper>
      </Grid>

      {/* </Container>
                </Box>
            </Box>
            <Footer/> */}
    </ThemeProvider>
  )
}

export default NetworkMonitor;