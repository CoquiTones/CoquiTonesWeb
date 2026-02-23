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

const SpectralAnalysis = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const [rawAudioFile, setRawAudioFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [type, setType] = useState("mel-spectrogram");
  const [colorscale, setColorscale] = useState("jet");
  const [xrange, setXrange] = useState([0, 15]);
  const [yrange, setYrange] = useState([0, 20000]);
  const [defaultX, setDefaultX] = useState([0, 120]);
  const [defaultY, setDefaultY] = useState([0, 10000]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", height: "100vh", width: "100%" }}>
        <Sidebar isOpen={isOpen} toggle={toggle} />
        
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <Navbar toggle={toggle} />
          
          <Box
            component="main"
            sx={{
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],
              flex: 1,
              overflow: "auto",
              width: "100%",
              minWidth: 0,
            }}
          >
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 3, p: 2, pt: 10 }}>
              {/* Left Column - Main Content */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                {/* Data Manager */}
                <Paper sx={{ p: 2 }}>
                  <DataManager
                    audioFile={rawAudioFile}
                    setAudioFile={setRawAudioFile}
                    setDefaultX={setDefaultX}
                    setDefaultY={setDefaultY}
                  />
                </Paper>

                {/* Spectrogram */}
                <Paper
                  elevation={4}
                  sx={{ p: 2, flex: 1, minHeight: "500px", display: "flex", flexDirection: "column" }}
                >
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <SpectrogramVisualizer
                      audioFile={rawAudioFile}
                      colorscale={colorscale}
                      currentTimeRange={xrange}
                      currentFrequencyRange={yrange}
                      setDefaultX={setDefaultX}
                      setDefaultY={setDefaultY}
                    />
                  </Box>
                </Paper>

                {/* Audio Player */}
                <Paper elevation={4} sx={{ p: 2 }}>
                  <SoundPlayer
                    file={rawAudioFile}
                    setCurrentTime={setCurrentTime}
                    yrange={yrange}
                    xrange={xrange}
                    currentTime={currentTime}
                  />
                </Paper>
              </Box>

              {/* Right Column - Controls */}
              <Paper elevation={4} sx={{ p: 2, height: "fit-content", position: "sticky", top: 100 }}>
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
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default SpectralAnalysis;
