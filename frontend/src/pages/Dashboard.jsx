import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import WeekLineChart from '../components/dashboard/WeekLineChart';
import NodeHealthCheck from '../components/dashboard/NodeHealthCheck';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';

export default function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Conservation overview"
        title="Dashboard"
        description="Weekly species detections, node heartbeats, and every recent recording in one place."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper sx={{ p: { xs: 2, md: 3 }, height: { xs: 440, lg: 480 } }}>
              <WeekLineChart />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper sx={{ p: { xs: 2, md: 3 }, height: { xs: 460, lg: 480 } }}>
              <NodeHealthCheck />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <DataTable />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
