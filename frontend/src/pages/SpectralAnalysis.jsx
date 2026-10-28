import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import PageHeader from '../components/shared/PageHeader';
import DataManager from '../components/shared/DataManager';
import SoundPlayer from '../components/SoundAnalysisTools/render/SoundPlayer';
import Spectrogram from '../components/SoundAnalysisTools/render/Spectrogram';
import SpectrogramControls from '../components/SoundAnalysisTools/render/SpectrogramControls';

const PANEL_WIDTH = 340;

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function SpectralAnalysis() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [audioFile, setAudioFile] = useState(null);
  const [colorscale, setColorscale] = useState('jet');
  const [xrange, setXrange] = useState([0, 15]);
  const [yrange, setYrange] = useState([0, 10000]);
  const [defaultX, setDefaultX] = useState([0, 120]);
  const [defaultY, setDefaultY] = useState([0, 10000]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [fileInfoOpen, setFileInfoOpen] = useState(false);
  const [processing, setProcessing] = useState({ status: 'idle', progress: null, error: null });

  useEffect(() => {
    const [min, max] = defaultX;
    setXrange([min, Math.min(max, min + 15)]);
  }, [defaultX]);

  useEffect(() => {
    const [min, max] = defaultY;
    setYrange([min, Math.min(max, 20000)]);
  }, [defaultY]);

  const controls = (
    <SpectrogramControls
      colorscale={colorscale}
      setColorscale={setColorscale}
      xrange={xrange}
      setXrange={setXrange}
      yrange={yrange}
      setYrange={setYrange}
      defaultX={defaultX}
      defaultY={defaultY}
      disabled={processing.status !== 'ready'}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { md: 'calc(100dvh - 64px)' } }}>
      <PageHeader
        eyebrow="Analysis workspace"
        title="Spectral analysis"
        description="Upload or load a recording, then narrow the spectrogram to the time and frequency band you care about."
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: { xs: 2, md: 3 },
        }}
      >
        <Paper sx={{ p: 2 }}>
          <DataManager
            audioFile={audioFile}
            setAudioFile={setAudioFile}
            setDefaultX={setDefaultX}
            setDefaultY={setDefaultY}
            setStats={setStats}
          />
        </Paper>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: { xs: 0, md: 2 } }}>
          <Paper
            sx={{
              flex: 1,
              minWidth: 0,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minHeight: { xs: 520, md: 560 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ minWidth: 0, mr: 'auto' }}>
                <Typography component="h2" variant="h6" color="text.primary" noWrap>
                  {audioFile ? audioFile.name : 'No recording loaded'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {audioFile
                    ? formatBytes(audioFile.size)
                    : 'Upload a file or load one from the database'}
                </Typography>
              </Box>

              {audioFile && (
                <>
                  <SoundPlayer
                    file={audioFile}
                    yrange={yrange}
                    xrange={xrange}
                  />
                  <IconButton aria-label="Show file details" onClick={() => setFileInfoOpen(true)}>
                    <InfoOutlinedIcon />
                  </IconButton>
                </>
              )}

              {!isDesktop && (
                <IconButton
                  aria-label="Open spectrogram settings"
                  aria-expanded={panelOpen}
                  onClick={() => setPanelOpen(true)}
                >
                  <TuneRoundedIcon />
                </IconButton>
              )}
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
              <Spectrogram
                audioFile={audioFile}
                colorscale={colorscale}
                timeRange={xrange}
                frequencyRange={yrange}
                onProcessingChange={setProcessing}
              />
            </Box>
          </Paper>

          {isDesktop && (
            <Paper sx={{ width: PANEL_WIDTH, flexShrink: 0, p: 2.5, overflowY: 'auto' }}>
              <Typography component="h2" variant="h6" color="text.primary" sx={{ mb: 2 }}>
                Display settings
              </Typography>
              {controls}
            </Paper>
          )}
        </Box>
      </Box>

      <Drawer anchor="right" open={panelOpen} onClose={() => setPanelOpen(false)}>
        <Box sx={{ width: { xs: '88vw', sm: 380 }, p: 2.5 }} role="presentation">
          <Typography component="h2" variant="h6" color="text.primary" sx={{ mb: 2 }}>
            Display settings
          </Typography>
          {controls}
        </Box>
      </Drawer>

      <Dialog open={fileInfoOpen} onClose={() => setFileInfoOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>File information</DialogTitle>
        <DialogContent>
          {stats ? (
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, columnGap: 3 }}>
              {[
                ['Duration', `${stats.duration.toFixed(2)} s`],
                ['Sample rate', `${stats.sampleRate.toLocaleString()} Hz`],
                ['Channels', stats.numberOfChannels],
                ['Bitrate', `${Math.round(stats.bitrate / 1000).toLocaleString()} kbps`],
                ['Codec', stats.codec],
                ['Size', formatBytes(stats.size)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'contents' }}>
                  <Typography component="dt" variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              File details are read after the audio finishes decoding.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileInfoOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
