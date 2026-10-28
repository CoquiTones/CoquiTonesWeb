import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';

import PageHero from '../components/layout/PageHero';
import InfoSection from '../components/shared/InfoSection';
import { HOME_SECTIONS } from '../components/shared/InfoData';

const HERO_VIDEO =
  'https://videos.pexels.com/video-files/9777616/9777616-hd_1920_1080_30fps.mp4';

export default function Home() {
  return (
    <>
      <PageHero
        id="home"
        eyebrow="Proyecto Coquí · Open source"
        title="All the tools you need for monitoring amphibian species with acoustics."
        description="Field sensors, automated species classification, and spectral analysis — all in one place, and completely open source."
        videoSrc={HERO_VIDEO}
        actions={
          <>
            <Button component={RouterLink} to="/Classifier" variant="contained" size="large">
              Classify a recording
            </Button>
            <Button component={RouterLink} to="/About" variant="outlined" size="large">
              Read our story
            </Button>
          </>
        }
      />

      {HOME_SECTIONS.map((section) => (
        <InfoSection key={section.id} {...section} />
      ))}
    </>
  );
}
