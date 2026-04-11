import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import FileUpload from "../components/shared/FileUpload";
import Footer from "../components/shared/Footer";
import HeroSectionClassifier from "../components/shared/HeroSectionClassifier";

import { APIHandlerClassifier } from "../services/rest/APIHandler/APIHandlerClassifier";
import { ClassifyAudioRequest } from "../services/rest/RequestORM/Classifier/ClassifyAudioRequest";
import ErrorAlerts from "../components/shared/ErrorAlerts";
const Classifier = () => {
  const species = [
    "coqui",
    "wightmanae",
    "gryllus",
    "portoricensis",
    "unicolor",
    "hedricki",
    "locustus",
    "richmondi",
  ];
  const column_headers = ["Time Slice", ...species];

  const [errors, setErrors] = useState([]);
  const apiHandler = useMemo(() => new APIHandlerClassifier());
  const [rawAudioFile, setRawAudioFile] = useState(null);
  const classifyAudiofile = async () => {
    try {
      if (rawAudioFile) {
        const classifyAudioFileRequest = new ClassifyAudioRequest(rawAudioFile);
        let report = await apiHandler.fetchClassification(
          classifyAudioFileRequest
        );
        setClassifierReport(report);
      }
    } catch (error) {
      setErrors([...errors, error]);
    }
  };

  useEffect(() => {
    classifyAudiofile();
  }, [rawAudioFile]);
  const [classifierReport, setClassifierReport] = useState(null);

  return (
    <>
      <ErrorAlerts errors={errors} setErrors={setErrors} />
      <HeroSectionClassifier />
      <Box sx={{ display: "flex" }}>
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
          <Container maxWidth="lg" sx={{ mt: 10, mb: 10 }}>
            <Grid item xs={12} md={8} lg={9}>
              <Paper
                elevation={4}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* <Typography variant="h3" color="primary" align="center">
                                    Machine Learning Analysis
                                    </Typography> */}

                <FileUpload setAudioFile={setRawAudioFile} />
              </Paper>

              {classifierReport && (
                <Paper
                  elevation={4}
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                  }}
                >
                  <Typography
                    variant="h5"
                    color="primary"
                    align="center"
                    gutterBottom
                  >
                    Classifier Report for {rawAudioFile.name}
                  </Typography>

                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          {column_headers.map((column_header) => (
                            <TableCell align="center">
                              {column_header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {classifierReport.map((slice) => (
                          <TableRow
                            sx={{
                              "&:last-child td, &:last-child th": { border: 0 },
                            }}
                          >
                            <TableCell key="1" align="center">
                              {slice.start_time}s to {slice.end_time}s
                            </TableCell>
                            <TableCell key="2" align="center">
                              {slice.coqui ? "detected" : "not detected"}
                            </TableCell>
                            <TableCell key="3" align="center">
                              {slice.wightmanae ? "detected" : "not detected"}
                            </TableCell>
                            <TableCell key="4" align="center">
                              {slice.gryllus ? "detected" : "not detected"}
                            </TableCell>
                            <TableCell key="5" align="center">
                              {slice.portoricensis
                                ? "detected"
                                : "not detected"}
                            </TableCell>
                            <TableCell key="6" align="center">
                              {slice.unicolor ? "detected" : "not detected"}
                            </TableCell>
                            <TableCell key="7" align="center">
                              {slice.hedricki ? "detected" : "not detected"}
                            </TableCell>
                            <TableCell key="8" align="center">
                              {slice.locustus ? "detected" : "not detected"}
                            </TableCell>
                            <TableCell key="9" align="center">
                              {slice.richmondi ? "detected" : "not detected"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Grid>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default Classifier;
