import React from "react";
import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";

import Chart from "../components/dashboard/WeekLineChart";
import LatestNodeHeartbeat from "../components/dashboard/NodeHeartbeat";
import RecentEntries from "../components/dashboard/RecentEntries";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import theme from "../components/shared/Theme";
import Sidebar from "../components/shared/Sidebar";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <Sidebar isOpen={isOpen} toggle={toggle} />
      <Navbar toggle={toggle} />
      {
        <Box sx={{ display: "flex", width: "100%" }}>
          <CssBaseline />
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
                <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                  <Paper
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: 500,
                    }}
                  >
                    <Chart />
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                  <Paper
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: 500,
                    }}
                  >
                    <LatestNodeHeartbeat />
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
                    <RecentEntries />
                  </Paper>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </Box>
      }
      <Footer />
    </ThemeProvider>
  );
}
