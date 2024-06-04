import React, { useState } from "react";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';


import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';


import theme from "../components/shared/Theme"
import FileUpload from "../components/shared/FileUpload";
import Sidebar from "../components/shared/Sidebar";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import HeroSectionClassifier from "../components/shared/HeroSectionClassifier";
const Classifier = () => {

    const initDummyReport = () => {
        const rows = [
            { filename: 'coqui.WAV', crid: 1, tid: 2, crsamples: 100, crcoqui: 50, crantillensis: 30, crcochranae: 20, cre_monensis: 10, crgryllus: 5, crhedricki: 3, crlocustus: 2, crportoricensis: 1, crrichmondi: 0, crwightmanae: 0, crno_hit: 0 },

        ];

        return rows

    }

    const [isOpen, setIsOpen] = useState(false)
    const toggle = () => {
        setIsOpen(!isOpen)
    }


    const [report, setReport] = useState(initDummyReport())

    const table = (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell aligh="center">File Name</TableCell>
                        <TableCell align="center">ID</TableCell>
                        <TableCell align="center">Samples</TableCell>
                        <TableCell align="center">Coqui</TableCell>
                        <TableCell align="center">Antillensis</TableCell>
                        <TableCell>Cochranae</TableCell>
                        <TableCell align="center">Monensis</TableCell>
                        <TableCell align="center">Gryllus</TableCell>
                        <TableCell align="center">Hedricki</TableCell>
                        <TableCell align="center">locustus</TableCell>
                        <TableCell>Portoricensis</TableCell>
                        <TableCell align="center">Richmondi</TableCell>
                        <TableCell align="center">Wighmanae</TableCell>
                        <TableCell align="center">Total Detected</TableCell>

                    </TableRow>
                </TableHead>
                <TableBody>
                    {report.map((row) => (
                        <TableRow
                            key={row.filename}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {row.filename}
                            </TableCell>
                            <TableCell align="center">{row.crid}</TableCell>
                            <TableCell align="center">{row.crsamples}</TableCell>
                            <TableCell align="center">{row.crcoqui}</TableCell>
                            <TableCell align="center">{row.crantillensis}</TableCell>
                            <TableCell align="center">{row.crcochranae}</TableCell>
                            <TableCell align="center">{row.cre_monensis}</TableCell>
                            <TableCell align="center">{row.crgryllus}</TableCell>
                            <TableCell align="center">{row.crhedricki}</TableCell>
                            <TableCell align="center">{row.crlocustus}</TableCell>
                            <TableCell align="center">{row.crportoricensis}</TableCell>
                            <TableCell align="center">{row.crrichmondi}</TableCell>
                            <TableCell align="center">{row.crwightmanae}</TableCell>
                            <TableCell align="center">{row.crno_hit}</TableCell>

                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
    const [rawAudioFile, setRawAudioFile] = useState(null)
    return (
        <ThemeProvider theme={theme}>
            <Sidebar isOpen={isOpen} toggle={toggle}/>
            <Navbar toggle={toggle}/>
            <HeroSectionClassifier/>
            <Box sx={{ display: 'flex' }} >
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
                        <Grid item xs={12} md={8} lg={9}>
                            <Paper elevation={4}
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: 240,
                                }}
                            >
                                {/* <Typography variant="h3" color="primary" align="center">
                                    Machine Learning Analysis
                                </Typography> */}

                                <FileUpload setAudioFile={setRawAudioFile} />
                            </Paper >


                            {
                                rawAudioFile && <Paper elevation={4}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 'auto',
                                    }}
                                >
                                    <Typography variant="h5" color="primary" align="center" gutterBottom>
                                        Classifier Report
                                    </Typography>

                                    {table}
                                </Paper>
                            }
                        </Grid>
                    </Container >
                </Box>
            </Box>
            <Footer/>
        </ThemeProvider>
    )
}

export default Classifier;