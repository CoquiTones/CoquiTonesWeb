import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha } from '@mui/material/styles';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

/**
 * Shared page hero used by every top-level page.
 *
 * The background video is decorative (muted, `aria-hidden`), pauses when the
 * user prefers reduced motion, and exposes an explicit pause/play control.
 */
export default function PageHero({
  id,
  eyebrow,
  title,
  description,
  image,
  imageAlt = '',
  videoSrc,
  actions,
  compact = false,
  children,
}) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const videoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const hasVideo = Boolean(videoSrc);
  const titleId = `${id ?? 'page'}-title`;

  useEffect(() => {
    if (prefersReducedMotion) setVideoPlaying(false);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (videoPlaying && !prefersReducedMotion) {
      video.play().catch(() => setVideoPlaying(false));
    } else {
      video.pause();
    }
  }, [videoPlaying, prefersReducedMotion]);

  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={titleId}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'background.default',
        minHeight: compact ? { xs: 260, md: 300 } : { xs: '72vh', md: '84vh' },
        py: compact ? { xs: 8, md: 10 } : { xs: 12, md: 14 },
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {(image || hasVideo) && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            '& img, & video': {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            },
          }}
        >
          {hasVideo && (
            <Box
              ref={videoRef}
              component="video"
              src={videoSrc}
              poster={image}
              muted
              loop
              playsInline
              preload="metadata"
              autoPlay={!prefersReducedMotion}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
            />
          )}
          {!hasVideo && image && (
            <Box component="img" src={image} alt={imageAlt} loading="lazy" />
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${alpha('#14120F', 0.55)} 0%, ${alpha(
                '#14120F',
                0.75,
              )} 55%, ${alpha('#14120F', 0.96)} 100%)`,
            }}
          />
        </Box>
      )}

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ maxWidth: 760, mx: 'auto', textAlign: 'center' }}>
          {eyebrow && (
            <Typography
              variant="overline"
              component="p"
              sx={{ color: 'primary.main', mb: 1.5 }}
            >
              {eyebrow}
            </Typography>
          )}
          <Typography id={titleId} component="h1" variant={compact ? 'h2' : 'h1'} color="text.primary">
            {title}
          </Typography>
          {description && (
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mt: 2.5, mx: 'auto', maxWidth: 640 }}
            >
              {description}
            </Typography>
          )}
          {children}
          {actions && (
            <Box
              sx={{
                mt: 4,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'center',
              }}
            >
              {actions}
            </Box>
          )}
        </Box>
      </Container>

      {hasVideo && !prefersReducedMotion && (
        <Tooltip title={videoPlaying ? 'Pause background video' : 'Play background video'}>
          <IconButton
            aria-label={videoPlaying ? 'Pause background video' : 'Play background video'}
            onClick={() => setVideoPlaying((playing) => !playing)}
            sx={{
              position: 'absolute',
              right: { xs: 12, md: 24 },
              bottom: { xs: 12, md: 24 },
              zIndex: 2,
              backgroundColor: alpha('#14120F', 0.6),
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { backgroundColor: alpha('#14120F', 0.85) },
            }}
          >
            {videoPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
