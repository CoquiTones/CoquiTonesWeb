import React, { useState, useMemo, useEffect } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { NodeContainer, NodeWrapper, NodeCard, NodeTitle, NodeInfo } from "../components/NetworkMonitor/NodeStyle";
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
import NewNodeDialog from "../components/NetworkMonitor/NewNodeDialog";
import Footer from "../components/shared/Footer";
import HeroSectionCDN from "../components/NetworkMonitor/HeroSectionCDN";
import MapEmbed from "../components/NetworkMonitor/Map";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';

const NetworkMonitor = () => {

    const getDate = () => {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const date = today.getDate();
        return `${month}/${date}/${year}`;
    }



    const [ducks, setDucks] = useState([])
    const [DeleteNodeId, setDeleteNodeId] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const fetchDucks = async () => {

        const dataHandler = new DataHandler("node")
        const nodes = await dataHandler.get_all()
        setDucks(nodes)
    }
    useEffect(() => {


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

    const handleDelete = (nodeId) => {
        setDeleteNodeId(nodeId);
        setIsDeleteDialogOpen(true);
    }

    const handleDeleteConfirm = () => {
        // Perform delete operation here using the nodeId
        // Then close the dialog and update state accordingly
        setIsDeleteDialogOpen(false);
        const web_url = process.env.REACT_APP_WEB_URL || 'http://localhost:8080';
        const endpoint = `/api/node/delete/${DeleteNodeId}`;

        fetch(web_url + endpoint, {
            method: "DELETE"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json()
            })
            .then(data => {
                console.log(data);
                fetchDucks()

            })
            .catch(error => {
                console.error('Error:', error);
                throw error; // Re-throw the error for further handling
            });

        // Example: call a delete function from DataHandler
        // dataHandler.deleteNode(deleteNodeId);
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
                            <DeleteOutlineIcon style={{ color: '#ffc857', cursor: 'pointer', position: 'relative', alignSelf: 'flex-end', top: '0px', right: '0px', zIndex: 1 }} onClick={() => handleDelete(duck.nid)} />
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
                            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                                <DialogContent>
                                    <DialogContentText>
                                        Are you sure you want to delete the following node?
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setIsDeleteDialogOpen(false)}>No</Button>
                                    <Button onClick={handleDeleteConfirm}>Yes</Button>
                                </DialogActions>
                            </Dialog>

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
                            </Box> */}
            <Footer />
        </ThemeProvider>
    )
}

export default NetworkMonitor;