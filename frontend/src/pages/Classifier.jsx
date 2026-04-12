import React, { useState, useEffect, useMemo, useContext } from "react";
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
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";
import { useTheme } from "@mui/material/styles";

import FileUpload from "../components/shared/FileUpload";
import Footer from "../components/shared/Footer";
import HeroSectionClassifier from "../components/shared/HeroSectionClassifier";

import { APIHandlerClassifier } from "../services/rest/APIHandler/APIHandlerClassifier";
import { ClassifyAudioRequest } from "../services/rest/RequestORM/Classifier/ClassifyAudioRequest";
import ErrorAlerts from "../components/shared/ErrorAlerts";
import { ErrorContext } from "../components/shared/ErrorContext";

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

  const theme = useTheme();
  const { errors, setErrors } = useContext(ErrorContext);
  const apiHandler = useMemo(() => new APIHandlerClassifier());
  const [rawAudioFile, setRawAudioFile] = useState(null);
  const [classifierReport, setClassifierReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const classifyAudiofile = async () => {
    try {
      if (rawAudioFile) {
        setIsLoading(true);
        const classifyAudioFileRequest = new ClassifyAudioRequest(rawAudioFile);
        let report = await apiHandler.fetchClassification(
          classifyAudioFileRequest
        );
        setClassifierReport(report);
        setPage(0);
      }
    } catch (error) {
      setErrors([...errors, error]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    classifyAudiofile();
  }, [rawAudioFile]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getDetectionChip = (isDetected) => {
    return (
      <Chip
        label={isDetected ? "Detected" : "Not Found"}
        color={isDetected ? "success" : "default"}
        variant="outlined"
        size="small"
        sx={{
          fontWeight: 600,
        }}
      />
    );
  };

  const renderSpeciesCell = (slice, speciesName) => {
    const isDetected = slice[speciesName];
    return (
      <TableCell key={speciesName} align="center">
        {getDetectionChip(isDetected)}
      </TableCell>
    );
  };

  const paginatedData = classifierReport
    ? classifierReport.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : [];

  const exportToCSV = () => {
    if (!classifierReport || classifierReport.length === 0) return;

    // Create CSV header
    const headers = column_headers.join(",");

    // Create CSV rows
    const rows = classifierReport.map((slice) => {
      const timeCell = `"${slice.start_time}s – ${slice.end_time}s"`;
      const speciesCells = species
        .map((speciesName) => (slice[speciesName] ? "Detected" : "Not Found"))
        .join(",");
      return `${timeCell},${speciesCells}`;
    });

    // Combine header and rows
    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `classification_report_${Date.now()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 10, mb: 10 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <FileUpload setAudioFile={setRawAudioFile} />
                </Paper>
              </Grid>

              {isLoading && (
                <Grid item xs={12}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "400px",
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="textSecondary">
                      Analyzing audio file...
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      align="center"
                    >
                      This may take a moment depending on the file size
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {classifierReport && !isLoading && (
                <Grid item xs={12}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <Typography
                        variant="h5"
                        color="primary"
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        Classification Report
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<DownloadIcon />}
                        onClick={exportToCSV}
                        disabled={
                          !classifierReport || classifierReport.length === 0
                        }
                      >
                        Export to CSV
                      </Button>
                    </Box>

                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 2 }}
                    >
                      File: <strong>{rawAudioFile.name}</strong>
                    </Typography>

                    <Alert severity="info" sx={{ mb: 2 }}>
                      Showing {paginatedData.length} of {classifierReport.length}{" "}
                      time slices
                    </Alert>

                    <TableContainer>
                      <Table
                        sx={{
                          minWidth: 650,
                          "& thead": {
                            backgroundColor:
                              theme.palette.mode === "light"
                                ? theme.palette.grey[200]
                                : theme.palette.grey[800],
                          },
                          "& th": {
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            textTransform: "capitalize",
                            color:
                              theme.palette.mode === "light"
                                ? theme.palette.grey[900]
                                : theme.palette.grey[100],
                          },
                          "& tbody tr:hover": {
                            backgroundColor:
                              theme.palette.mode === "light"
                                ? theme.palette.action.hover
                                : theme.palette.action.hover,
                          },
                          "& tbody tr": {
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          },
                        }}
                        aria-label="classification table"
                      >
                        <TableHead>
                          <TableRow>
                            {column_headers.map((header) => (
                              <TableCell
                                key={header}
                                align={
                                  header === "Time Slice" ? "left" : "center"
                                }
                                sx={{
                                  py: 2,
                                  px: 1.5,
                                }}
                              >
                                {header === "Time Slice"
                                  ? header
                                  : header.charAt(0).toUpperCase() +
                                  header.slice(1)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedData.map((slice, index) => (
                            <TableRow
                              key={`slice-${page * rowsPerPage + index}`}
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontWeight: 500,
                                  py: 2,
                                  px: 1.5,
                                }}
                              >
                                {slice.start_time}s – {slice.end_time}s
                              </TableCell>
                              {species.map((speciesName) =>
                                renderSpeciesCell(slice, speciesName)
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={classifierReport.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      sx={{
                        ".MuiTablePagination-toolbar": {
                          pl: 0,
                        },
                      }}
                    />
                  </Paper>
                </Grid>
              )}

              {!isLoading && !classifierReport && rawAudioFile && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    No results available. Please try uploading another file.
                  </Alert>
                </Grid>
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
