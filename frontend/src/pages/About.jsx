import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import PageHero from '../components/layout/PageHero';
import AboutUsSection from '../components/shared/AboutUsSection';
import aboutBackground from '../components/assets/images/AboutBGImage.svg';

const TOPICS = [
  {
    title: 'Mission statement',
    body: `One of the many beautiful things in Puerto Rico is its nature, with the coquí frog at the forefront as a cultural symbol. Unfortunately, due to widespread issues like deforestation and forest fires, around 60% of coquís are in danger of going extinct.

CoquiTones, in collaboration with Proyecto Coquí, is committed to the conservation of the coquí species. Our mission is to enhance hardware implementation, streamline software usability, and optimise data structures to bolster the technological side of preservation.`,
  },
  {
    title: 'How we collaborated',
    body: `Proyecto Coquí faced manual analysis of large volumes of audio, ongoing device maintenance, and inconsistent data storage. CoquiTones addressed these problems with technology that brings efficiency to every stage of the preservation process.`,
  },
  {
    title: 'Hardware',
    body: `We integrated an IoT network of interconnected nodes equipped with multiple sensors across the forest. The nodes capture acoustic and meteorological data every five minutes within a thirty-minute cycle, then transmit it over LTE to a remote server.

To reduce how often devices must be retrieved, we engineered a solar-powered supply that extends operational life to at least three weeks.`,
  },
  {
    title: 'Software',
    body: `Collected data is structured in a relational database so it can be queried efficiently. A sound analysis tool turns recordings into interactive spectrograms, and a machine-learning classifier automates species identification to streamline the workflow.`,
  },
  {
    title: 'The future of CoquiTones',
    body: `Given the educational, non-commercial nature of this project, we made it open source. Anyone can build on it, adapt it to their environment, and contribute improvements back to the community.`,
  },
];

export default function About() {
  const [activeTopic, setActiveTopic] = useState(0);
  const topic = TOPICS[activeTopic];

  const goToPrevious = () => setActiveTopic((current) => Math.max(current - 1, 0));
  const goToNext = () => setActiveTopic((current) => Math.min(current + 1, TOPICS.length - 1));

  return (
    <>
      <PageHero
        compact
        eyebrow="Proyecto Coquí"
        title="Conservation through open technology"
        description="CoquiTones is an open-source platform for monitoring amphibian species with acoustics, built alongside the people who protect them."
        image={aboutBackground}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Typography component="h2" variant="h2" color="text.primary" sx={{ mb: 3 }}>
          Our work
        </Typography>

        <Tabs
          value={activeTopic}
          onChange={(_event, value) => setActiveTopic(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="About CoquiTones topics"
          sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {TOPICS.map((item) => (
            <Tab key={item.title} label={item.title} />
          ))}
        </Tabs>

        <Paper
          component="section"
          aria-live="polite"
          sx={{ p: { xs: 3, md: 5 }, minHeight: { xs: 320, md: 300 } }}
        >
          <Typography variant="overline" component="p" sx={{ color: 'primary.main' }}>
            Topic {activeTopic + 1} of {TOPICS.length}
          </Typography>
          <Typography component="h3" variant="h3" color="text.primary" sx={{ mt: 1, mb: 2 }}>
            {topic.title}
          </Typography>
          {topic.body.split('\n\n').map((paragraph) => (
            <Typography key={paragraph.slice(0, 24)} variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {paragraph}
            </Typography>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4 }}>
            <Button
              onClick={goToPrevious}
              disabled={activeTopic === 0}
              startIcon={<ArrowBackRoundedIcon />}
            >
              Previous topic
            </Button>
            <Button
              onClick={goToNext}
              disabled={activeTopic === TOPICS.length - 1}
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Next topic
            </Button>
          </Box>
        </Paper>
      </Container>

      <AboutUsSection />
    </>
  );
}
