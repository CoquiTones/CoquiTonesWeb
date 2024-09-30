import React, { useState, useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import Toolbar from '@mui/material/Toolbar';
import theme from "../components/shared/Theme";
import FileUpload from "../components/shared/FileUpload";
import Sidebar from "../components/shared/Sidebar";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import HeroSectionClassifier from "../components/shared/HeroSectionClassifier";
import DataHandler from "../services/DataHandler";

import BarChartML from '../components/shared/charts/BarChartML'
import RecentEntries from '../components/shared/dashboardDump/Entries';
import Title from "../components/shared/Title";

const Classifier = () => {


  const [report, setReport] = useState({})
  const hasReported = useMemo(() => Object.keys(report).length !== 0)
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };
  const [rawAudioFile, setRawAudioFile] = useState(null);


  useEffect(() => {
    const classify = async () => {
      const dataHandler = new DataHandler("report");
      if (rawAudioFile) {
        const classification = await dataHandler.fetchClassification(rawAudioFile);
        console.log(classification)
        setReport(classification)
      }
    }
    //need to do this way to await shit in react
    classify()
  }, [rawAudioFile]);


  return (
    <ThemeProvider theme={theme}>
      <Sidebar isOpen={isOpen} toggle={toggle} />
      <Navbar toggle={toggle} />
      <HeroSectionClassifier />
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
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Chart */}
              <Grid item lg={12}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',

                  }}
                >
                  <Title > File Upload</Title>
                  <FileUpload setAudioFile={setRawAudioFile} />
                </Paper>
              </Grid>
              {
                hasReported &&

                <Grid maxWidth="lg" lg={12}>

                  <Grid item xs={12} md={8} lg={12}>
                    <Paper
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '40vh'
                      }}
                    >
                      <BarChartML data={report} title={"Detected Species Probability"} />
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                      <RecentEntries />
                    </Paper>
                  </Grid>
                </Grid>
              }
            </Grid>
          </Container>
        </Box>
      </Box>
      <Footer />
    </ThemeProvider >
  );
}
export default Classifier;
