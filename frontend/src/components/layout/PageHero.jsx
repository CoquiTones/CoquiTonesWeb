import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

/**
 * Shared page hero used by every top-level page.
 *
 * The background video is decorative (muted, `aria-hidden`), starts playing by
 * default, and exposes an explicit pause/play control so visitors can stop it.
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
  const videoRef = useRef(null);
  // Tracks whether the visitor explicitly paused the video, so browser
  // events (tab switches, stalled loads) do not override their choice.
  const userPausedRef = useRef(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = Boolean(videoSrc) && !videoFailed;
  const titleId = `${id ?? 'page'}-title`;

  /**
   * Start playback. `play()` is called directly from the click handler (not
   * from an effect) so browsers count the click as a user gesture.
   */
  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch((error) => {
        // A newer play/pause request replaced this one; not a real failure.
        if (error?.name === 'AbortError') return;
        setVideoPlaying(false);
      });
    }
  }, []);

  const pauseVideo = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  /**
   * Some browsers (notably Safari) only allow muted autoplay when the `muted`
   * content attribute is present. React sets the property, so set the
   * attribute explicitly as soon as the element is attached.
   */
  const attachVideo = useCallback((node) => {
    videoRef.current = node;
    if (!node) return;
    node.muted = true;
    node.defaultMuted = true;
    node.setAttribute('muted', '');
  }, []);

  // Kick off playback on mount (and if the source changes) unless the visitor
  // has paused it. This also recovers from interrupted autoplay attempts.
  useEffect(() => {
    if (!hasVideo) return;
    if (userPausedRef.current) pauseVideo();
    else playVideo();
  }, [hasVideo, videoSrc, playVideo, pauseVideo]);

  // Resume when the tab/page becomes visible again, unless the visitor paused.
  useEffect(() => {
    if (!hasVideo) return undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !userPausedRef.current) {
        playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasVideo, playVideo]);

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      userPausedRef.current = false;
      playVideo();
    } else {
      userPausedRef.current = true;
      pauseVideo();
    }
  };

  const handleCanPlay = () => {
    // If autoplay was interrupted while the media was loading, retry once the
    // browser has enough data. Explicit user pauses are never overridden.
    if (!userPausedRef.current && videoRef.current?.paused) {
      playVideo();
    }
  };

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
              ref={attachVideo}
              component="video"
              src={videoSrc}
              poster={image}
              muted
              loop
              playsInline
              preload="auto"
              autoPlay
              disablePictureInPicture
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onCanPlay={handleCanPlay}
              onError={() => {
                setVideoFailed(true);
                setVideoPlaying(false);
              }}
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

      {hasVideo && (
        <Tooltip title={videoPlaying ? 'Pause background video' : 'Play background video'}>
          <IconButton
            aria-label={videoPlaying ? 'Pause background video' : 'Play background video'}
            onClick={toggleVideo}
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
