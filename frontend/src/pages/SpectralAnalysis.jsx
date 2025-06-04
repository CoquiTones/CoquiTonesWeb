import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import Sidebar from "../components/shared/Sidebar";
import theme from "../components/shared/Theme";
import DataManager from "../components/shared/DataManager";
import SoundPlayer from "../components/SoundAnalysisTools/render/SoundPlayer";
import SpectrogramVisualizer from "../components/SoundAnalysisTools/render/Spectrogram";
import SpectrogramControls from "../components/SoundAnalysisTools/render/SpectrogramControls";
import Navbar from "../components/shared/Navbar";
// import HeroSectionSpectralAnalysis from "../components/shared/HeroSectionSpectralAnalysis";

const SpectralAnalysis = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const [rawAudioFile, setRawAudioFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [type, setType] = useState("mel-spectrogram");
  const [colorscale, setColorscale] = useState("inferno");
  const [xrange, setXrange] = useState([0, 15]);
  const [yrange, setYrange] = useState([0, 10000]);
  const [defaultX, setDefaultX] = useState([0, 60]);
  const [defaultY, setDefaultY] = useState([0, 10000]);

  return (
    <ThemeProvider theme={theme}>
      <Sidebar isOpen={isOpen} toggle={toggle} />
      <Navbar toggle={toggle} />
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            width: "100vw",
            overflow: "auto",
          }}
        >
          <Container
            maxWidth={false}
            disableGutters
            sx={{ mt: 10, mb: 10, px: 2 }}
          >
            <Grid container spacing={3}>
              {/* Data Manager */}
              <Grid item xs={12}>
                <Paper sx={{ width: "100%", p: 2 }}>
                  <DataManager
                    audioFile={rawAudioFile}
                    setAudioFile={setRawAudioFile}
                  />
                </Paper>
              </Grid>

              {/* Spectrogram */}
              <Grid item xs={12}>
                <Paper
                  elevation={4}
                  sx={{ p: 2, width: "100%", height: "80vh" }}
                >
                  <SpectrogramVisualizer
                    audioFile={rawAudioFile}
                    colorscale={colorscale}
                    xrange={xrange}
                    yrange={yrange}
                  />
                </Paper>
              </Grid>

              {/* Controls */}
              <Grid item xs={12}>
                <Paper elevation={4} sx={{ p: 2, width: "100%" }}>
                  <SpectrogramControls
                    setAudioFile={setRawAudioFile}
                    type={type}
                    setType={setType}
                    colorscale={colorscale}
                    setColorscale={setColorscale}
                    xrange={xrange}
                    setXrange={setXrange}
                    yrange={yrange}
                    setYrange={setYrange}
                    defaultX={defaultX}
                    defaultY={defaultY}
                  />
                </Paper>
              </Grid>

              {/* Audio Player */}
              <Grid item xs={12}>
                <Paper elevation={4} sx={{ p: 2, width: "100%" }}>
                  <SoundPlayer
                    file={rawAudioFile}
                    setCurrentTime={setCurrentTime}
                    yrange={yrange}
                    xrange={xrange}
                    currentTime={currentTime}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default SpectralAnalysis;
