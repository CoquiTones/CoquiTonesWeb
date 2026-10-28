import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import diegoPhoto from '../assets/images/DiegoProfessionalPFP.webp';
import edwinPhoto from '../assets/images/EdwinCamuyPFP.webp';
import rolandoPhoto from '../assets/images/RolandoProfessionalPFP.webp';

const TEAM = [
  {
    name: 'Diego A. Santiago Uriarte',
    role: 'Full-stack software engineer',
    bio: 'A little bit of everything. Interested in hiking and swimming in the local rivers of Puerto Rico.',
    photo: diegoPhoto,
  },
  {
    name: 'Edwin J. Camuy Medina',
    role: 'Software engineer · backend & AI',
    bio: 'Interested in creating new and unorthodox things.',
    photo: edwinPhoto,
  },
  {
    name: 'Rolando Ríos Bonilla',
    role: 'Computer science & engineering · front end',
    bio: 'Interested in anything sports-related and music.',
    photo: rolandoPhoto,
  },
];

export default function AboutUsSection() {
  return (
    <Box component="section" sx={{ py: { xs: 7, md: 10 }, backgroundColor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Typography component="h2" variant="h2" color="text.primary" sx={{ mb: 1.5 }}>
          About us
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mb: { xs: 4, md: 6 } }}>
          A small team of engineers from Puerto Rico building tools that help researchers protect
          the island&apos;s amphibian population.
        </Typography>

        <Grid container spacing={3}>
          {TEAM.map((member) => (
            <Grid key={member.name} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Paper
                component="article"
                sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              >
                <Box
                  component="img"
                  src={member.photo}
                  alt={`Portrait of ${member.name}`}
                  loading="lazy"
                  sx={{
                    width: { xs: 132, sm: 160 },
                    height: { xs: 132, sm: 160 },
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid',
                    borderColor: 'divider',
                    mb: 2,
                  }}
                />
                <Typography component="h3" variant="h5" color="text.primary">
                  {member.name}
                </Typography>
                <Typography variant="overline" component="p" sx={{ color: 'secondary.light', mt: 0.5 }}>
                  {member.role}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {member.bio}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
