import React, { useEffect, useState } from "react";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import { Button } from "@mui/material";

import Sidebar from '../components/shared/Sidebar';
import theme from "../components/shared/Theme"
import SoundPlayer from "../components/SoundAnalysisTools/SoundPlayer";
import Spectrogram from "../components/SoundAnalysisTools/Spectrogram";
import SpectrogramControls from "../components/SoundAnalysisTools/SpectrogramControls";
import { handleLoad } from "../components/SoundAnalysisTools/SpectrogramDataReader"
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import coquiSample from "../components/assets/audio/ZOOM0010_LR_03.WAV"


const SpectralAnalysis = () => {

    const [isOpen, setIsOpen] = useState(false)
    const toggle = () => {
        setIsOpen(!isOpen)
    }

    const [rawAudioFile, setRawAudioFile] = useState(null)
    const updateRawAudioFile = (newAudioFile) => {
        setRawAudioFile(newAudioFile)
    }
    const [xData, setXData] = useState(null)
    const [yData, setYData] = useState(null)
    const [zData, setZData] = useState(null)

    const [currentTime, setCurrentTime] = useState(0)
    const updateTime = (newTime) => {
        setCurrentTime(newTime)
    }
    const [type, setType] = useState("basic-spectrogram")
    const updateType = (newType) => {
        setType(newType)
    }
    const [colorscale, setColorscale] = useState("Jet")
    const updateColorscale = (newColor) => {
        setColorscale(newColor)
    }
    const [xrange, setXrange] = useState([0, 60])
    const updateXrange = (newXrange) => {
        setXrange(newXrange)
    }
    const [yrange, setYrange] = useState([0, 10000])

    const updateYrange = (newYrange) => {
        setYrange(newYrange)
    }

    const [demo, setDemo] = useState(false)

    useEffect(() => {

        const getData = async () => {
            if (rawAudioFile && type) {

                let data;
                if (type === "mel-spectrogram") {

                    data = await handleLoad(rawAudioFile, "mel")
                }

                else {
                    data = await handleLoad(rawAudioFile, "basic")
                }
                setXData(data['x'])
                setYData(data['y'])
                setZData(data['z'])
            }
        }

        getData()
    }, [rawAudioFile, type])

    const handleDemo = () => {

        setDemo(true)
        setRawAudioFile(coquiSample)

    }
    return (
        <ThemeProvider theme={theme}>
            <Sidebar isOpen={isOpen} toggle={toggle} />
            <Navbar toggle={toggle} />
            <Box sx={{ display: 'flex' }}>
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
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Paper elevation={4} sx={{ p: 2 }}>
                                    <Typography variant="h3" color="primary" align="center">
                                        Spectral Analysis
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={12} lg={12}>
                                <Paper elevation={4} sx={{ p: 2, height: 'auto' }}>
                                    {zData ?
                                        (<Spectrogram
                                            xData={xData}
                                            yData={yData}
                                            zData={zData}
                                            colorscale={colorscale}
                                            xrange={xrange}
                                            yrange={yrange}
                                            currentTime={currentTime}
                                            fileName={rawAudioFile.name}
                                        />) :
                                        (
                                            rawAudioFile ?
                                                <LinearProgress color="secondary" /> :
                                                <Typography variant="h4" color="primary" align="center">
                                                    No file Added
                                                </Typography>
                                        )
                                    }
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6} lg={6}>
                                <Paper elevation={4} sx={{ p: 2, height: 'auto' }}>
                                    <SpectrogramControls
                                        setAudioFile={updateRawAudioFile}
                                        type={type}
                                        setType={updateType}
                                        colorscale={colorscale}
                                        setColorscale={updateColorscale}
                                        xrange={xrange}
                                        setXrange={updateXrange}
                                        yrange={yrange}
                                        setYrange={updateYrange}
                                    />
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6} lg={6}>
                                <Paper elevation={4} sx={{ p: 2, height: 'auto' }}>
                                    <SoundPlayer
                                        file={rawAudioFile}
                                        setCurrentTime={updateTime}
                                        yrange={yrange}
                                        xrange={xrange}
                                        currentTime={currentTime}
                                        demo={demo}
                                    />
                                    {!demo &&
                                        <Button
                                            variant="condensed"

                                            onClick={handleDemo}
                                        >
                                            DEMO
                                        </Button>}
                                </Paper>
                            </Grid>
                        </Grid>

                    </Container>
                </Box>
            </Box>
            <Footer />
        </ThemeProvider >
    )
}

export default SpectralAnalysis;