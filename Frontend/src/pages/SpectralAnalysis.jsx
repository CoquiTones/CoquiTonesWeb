import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";

import Sidebar from "../components/shared/Sidebar";
import theme from "../components/shared/Theme";
import SoundPlayer from "../components/SoundAnalysisTools/SoundPlayer";
import SpectrogramVisualizer from "../components/SoundAnalysisTools/Spectrogram";
import SpectrogramControls from "../components/SoundAnalysisTools/SpectrogramControls";
import { handleLoad } from "../components/SoundAnalysisTools/SpectrogramDataReader";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import HeroSectionSpectralAnalysis from "../components/shared/HeroSectionSpectralAnalysis";

const SpectralAnalysis = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };

  const [rawAudioFile, setRawAudioFile] = useState(null);
  const updateRawAudioFile = (newAudioFile) => {
    setRawAudioFile(newAudioFile);
  };

  const [currentTime, setCurrentTime] = useState(0);
  const updateTime = (newTime) => {
    setCurrentTime(newTime);
  };
  const [type, setType] = useState("mel-spectrogram");
  const updateType = (newType) => {
    setType(newType);
  };
  const [colorscale, setColorscale] = useState("Jet");
  const updateColorscale = (newColor) => {
    setColorscale(newColor);
  };
  const [xrange, setXrange] = useState([0, 60]);
  const updateXrange = (newXrange) => {
    setXrange(newXrange);
  };
  const [yrange, setYrange] = useState([0, 10000]);

  const updateYrange = (newYrange) => {
    setYrange(newYrange);
  };

  const [defaultX, setDefaultX] = useState([0, 60]);
  const [defaultY, setDefaultY] = useState([0, 10000]);

  // useEffect(() => {
  //   const getData = async () => {
  //     if (rawAudioFile && type) {
  //       let data;
  //       if (type === "mel-spectrogram") {
  //         data = await handleLoad(rawAudioFile, "mel");
  //       } else {
  //         data = await handleLoad(rawAudioFile, "basic");
  //       }
  //       setXData(data["x"]);
  //       setYData(data["y"]);
  //       setZData(data["z"]);

  //       setDefaultX([data["x"][0], data["x"][data["x"].length - 1]]);
  //       setDefaultY([data["y"][0], data["y"][data["y"].length - 1]]);
  //     }
  //   };

  //   getData();
  // }, [rawAudioFile, type]);

  return (
    <ThemeProvider theme={theme}>
      <Sidebar isOpen={isOpen} toggle={toggle} />
      <Navbar toggle={toggle} />
      <HeroSectionSpectralAnalysis />
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
            overflow: "auto",
          }}
        >
          <Container sx={{ mt: 10, mb: 10 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                <Paper
                  elevation={4}
                  sx={{ p: 2, height: "60vh", width: "60vw" }}
                >
                  <SpectrogramVisualizer audioFile={rawAudioFile} />
                </Paper>
                <Paper elevation={4} sx={{ p: 2, height: "auto", mt: 2 }}>
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
                    defaultX={defaultX}
                    defaultY={defaultY}
                  />
                </Paper>
              </Grid>
              <Grid sx={{ p: 2 }}>
                <Paper elevation={4}>
                  <SoundPlayer
                    file={rawAudioFile}
                    setCurrentTime={updateTime}
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
      <Footer />
    </ThemeProvider>
  );
};

export default SpectralAnalysis;
