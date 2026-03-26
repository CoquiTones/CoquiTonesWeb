import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import Sidebar from "../components/shared/Sidebar";
import theme from "../components/shared/Theme";
import DataManager from "../components/shared/DataManager";
import SoundPlayer from "../components/SoundAnalysisTools/render/SoundPlayer";
import SpectrogramVisualizer from "../components/SoundAnalysisTools/render/Spectrogram";
import SpectrogramControls from "../components/SoundAnalysisTools/render/SpectrogramControls";
import Navbar from "../components/shared/Navbar";

const drawerWidth = 380;

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [fileInfoOpen, setFileInfoOpen] = useState(false);

  const handleDrawerOpen = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", height: "100vh", width: "100%" }}>
        <Sidebar isOpen={isOpen} toggle={toggle} />

        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <Navbar toggle={toggle} />

          <Box
            sx={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],
            }}
          >
            {/* Main content */}
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  p: 2,
                  pt: 10,
                  overflow: "hidden",
                }}
              >
                {/* Top bar: upload controls + audio player + info button */}
                <Paper sx={{ p: 2, flexShrink: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DataManager
                      audioFile={rawAudioFile}
                      setAudioFile={setRawAudioFile}
                      setDefaultX={setDefaultX}
                      setDefaultY={setDefaultY}
                      setStats={setStats}
                    />
                    <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                      {rawAudioFile && (
                        <IconButton onClick={() => setFileInfoOpen(true)} size="small">
                          <MoreVertIcon />
                        </IconButton>
                      )}
                      <SoundPlayer
                        file={rawAudioFile}
                        setCurrentTime={setCurrentTime}
                        yrange={yrange}
                        xrange={xrange}
                        currentTime={currentTime}
                      />
                      <IconButton
                        onClick={drawerOpen ? handleDrawerClose : handleDrawerOpen}
                        size="small"
                      >
                        {drawerOpen ? <ChevronRightIcon /> : <MenuIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>

                {/* Spectrogram */}
                <Paper
                  elevation={4}
                  sx={{
                    p: 2,
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
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
              </Box>
            </Box>

            {/* Controls panel */}
            <Box
              sx={{
                pt: 10,
                width: drawerOpen ? drawerWidth : 0,
                flexShrink: 0,
                overflow: "hidden",
                transition: (theme) =>
                  theme.transitions.create("width", {
                    easing: drawerOpen
                      ? theme.transitions.easing.easeOut
                      : theme.transitions.easing.sharp,
                    duration: drawerOpen
                      ? theme.transitions.duration.enteringScreen
                      : theme.transitions.duration.leavingScreen,
                  }),
                borderLeft: drawerOpen ? "1px solid" : "none",
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              {/* Inner box keeps full drawerWidth so content doesn't squish during transition */}
              <Box
                sx={{
                  width: drawerWidth,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ px: 3, py: 2, overflow: "auto", flex: 1 }}>
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
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* File info modal */}
      <Dialog
        open={fileInfoOpen}
        onClose={() => setFileInfoOpen(false)}
        slotProps={{
          sx: {
            backgroundColor: "#313338",
            backgroundImage: "none",
            color: "#fff",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle>File Information</DialogTitle>
        <DialogContent>
          {stats && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography><strong>Duration:</strong> {stats.duration.toFixed(2)} sec</Typography>
              <Typography><strong>Sample Rate:</strong> {stats.sampleRate} Hz</Typography>
              <Typography><strong>Channels:</strong> {stats.number_of_channels}</Typography>
              <Typography><strong>Bitrate:</strong> {stats.bitrate} bps</Typography>
              <Typography><strong>Codec:</strong> {stats.codec}</Typography>
              <Typography><strong>Size:</strong> {(stats.size / 1024).toFixed(2)} KB</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default SpectralAnalysis;
