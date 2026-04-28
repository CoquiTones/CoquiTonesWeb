import React from "react";
import { useState, useMemo, useContext } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import Chart from "../components/dashboard/WeekLineChart";
import NodeHealthCheck from "../components/dashboard/NodeHealthCheck";
import Footer from "../components/shared/Footer";
import ErrorAlerts from "../components/shared/ErrorAlerts";
import { ErrorContext } from "../components/shared/ErrorContext";
import DataTable from "../components/shared/DataTable";

export default function Dashboard() {
  const { errors, setErrors } = useContext(ErrorContext);

  return (
    <>
      <ErrorAlerts errors={errors} setErrors={setErrors} />
      {
        <Box sx={{ display: "flex", width: "100%" }}>
          <Box
            component="main"
            sx={{
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],
              flexGrow: 1,
            }}
          >
            <Toolbar />
            <Container sx={{ mt: 4, mb: 4, width: "100%" }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8, lg: 7 }}>
                  <Paper
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: 500,
                    }}
                  >
                    <Chart errors={errors} setErrors={setErrors} />
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4, lg: 5 }}>
                  <Paper
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: 500,
                    }}
                  >
                    <NodeHealthCheck errors={errors} setErrors={setErrors} />
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                  <Paper
                    sx={{
                      p: 2,
                      flexDirection: "column",
                      width: "100%",
                    }}
                  >
                    <DataTable errors={errors} setErrors={setErrors} />
                  </Paper>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </Box>
      }
      <Footer />
    </>
  );
}
