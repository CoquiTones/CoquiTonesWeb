import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
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
import AnnotationPanel from '../components/SoundAnalysisTools/annotation/AnnotationPanel';
import { useAnnotationReport } from '../components/SoundAnalysisTools/annotation/useAnnotationReport';
import { useUnsavedChangesGuard } from '../components/SoundAnalysisTools/annotation/useUnsavedChangesGuard';
import {
  buildAnnotationExport,
  downloadAnnotationExport,
  exportFileName,
} from '../components/SoundAnalysisTools/annotation/annotationExport';
import { hasSessionToken } from '../services/Authentication/sessionToken';
import {
  DEFAULT_DETAIL_PROFILE,
  getDetailProfile,
} from '../components/SoundAnalysisTools/processing/spectrogramModel';

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

  const audioRef = useRef(null);
  const spectrogramRef = useRef(null);
  const [audioFile, setAudioFile] = useState(null);
  const [recording, setRecording] = useState(null);
  const [colorscale, setColorscale] = useState('jet');
  const [xrange, setXrange] = useState([0, 15]);
  const [yrange, setYrange] = useState([0, 10000]);
  const [detailProfile, setDetailProfile] = useState(DEFAULT_DETAIL_PROFILE);
  const [defaultX, setDefaultX] = useState([0, 120]);
  const [defaultY, setDefaultY] = useState([0, 10000]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [fileInfoOpen, setFileInfoOpen] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [processing, setProcessing] = useState({
    status: 'idle',
    progress: null,
    error: null,
    refining: false,
  });

  const annotation = useAnnotationReport({
    audioFile,
    durationSeconds: stats?.duration ?? 0,
    recording,
  });
  const unsavedChanges = useUnsavedChangesGuard({ when: annotation.dirty });

  useEffect(() => {
    const [min, max] = defaultX;
    setXrange([min, Math.min(max, min + 15)]);
  }, [defaultX]);

  useEffect(() => {
    const [min, max] = defaultY;
    setYrange([min, Math.min(max, 20000)]);
  }, [defaultY]);

  const detail = getDetailProfile(detailProfile);

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
      detailProfile={detailProfile}
      setDetailProfile={setDetailProfile}
      sampleRate={stats?.sampleRate}
      disabled={processing.status !== 'ready'}
      rerendering={Boolean(processing.refining)}
      onRerenderVisible={() => spectrogramRef.current?.rerenderVisibleSegment()}
    />
  );

  const requestAnnotationMode = (nextMode) => {
    if (nextMode === 'editor') {
      annotation.enterEditor();
      return;
    }
    if (annotation.dirty) {
      unsavedChanges.requestLeave(() => annotation.discardDraft());
      return;
    }
    annotation.showReadOnly();
  };

  const handleSelectAudioFile = (nextFile, nextRecording = null) => {
    const select = () => {
      setRecording(nextRecording);
      setAudioFile(nextFile);
    };

    if (annotation.dirty) {
      unsavedChanges.requestLeave(select);
      return;
    }
    select();
  };

  const canExportAnnotations = Boolean(
    audioFile
    && annotation.windowCount > 0
    && (stats?.duration ?? 0) > 0,
  );
  const exportDisabledReason = !audioFile
    ? 'Load a recording to export annotations.'
    : !canExportAnnotations
      ? 'Wait for the recording duration before exporting annotations.'
      : null;

  const handleExportAnnotations = () => {
    setExportError(null);
    setExporting(true);
    try {
      const payload = buildAnnotationExport({
        audioFile,
        durationSeconds: stats?.duration ?? 0,
        afid: recording?.afid ?? null,
        source: annotation.source,
        isDraft: annotation.dirty || !recording?.afid,
        windows: annotation.windows,
      });
      downloadAnnotationExport(payload, exportFileName(audioFile.name));
    } catch (error) {
      setExportError(error);
    } finally {
      setExporting(false);
    }
  };

  const saveDisabledReason = !audioFile
    ? 'Load a recording to save annotations.'
    : !recording?.afid
      ? 'Save the recording to the database before saving annotations.'
      : !hasSessionToken()
        ? 'Sign in to save annotations.'
        : !annotation.dirty
          ? 'No unsaved changes.'
          : null;

  const annotationPanel = (
    <AnnotationPanel
      mode={annotation.isEditor ? 'editor' : 'readOnly'}
      onModeChange={requestAnnotationMode}
      source={annotation.source}
      pinnedWindow={annotation.pinnedWindow}
      pinnedWindowIndex={annotation.pinnedWindowIndex}
      windowCount={annotation.windowCount}
      onPinWindow={annotation.pinWindow}
      onToggleSpecies={annotation.toggleSpecies}
      dirty={annotation.dirty}
      warnings={annotation.warnings}
      status={annotation.status}
      error={annotation.error}
      canSave={annotation.canSave}
      onSave={annotation.save}
      saving={annotation.saving}
      saveError={annotation.saveError}
      saveMessage={annotation.saveMessage}
      saveDisabledReason={saveDisabledReason}
      conflict={annotation.conflict}
      onReloadConflict={annotation.reloadConflict}
      onOverwriteConflict={annotation.overwriteConflict}
      onCancelConflict={annotation.cancelConflict}
      onDismissSaveFeedback={annotation.dismissSaveFeedback}
      canExport={canExportAnnotations}
      onExport={handleExportAnnotations}
      exportDisabledReason={exportDisabledReason}
      exporting={exporting}
      exportError={exportError}
      savedAt={annotation.savedAt}
    />
  );

  const sidePanel = (
    <>
      {annotationPanel}
      <Divider sx={{ my: 3 }} />
      <Typography component="h2" variant="h6" color="text.primary" sx={{ mb: 2 }}>
        Spectrogram settings
      </Typography>
      {controls}
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { md: 'calc(100dvh - 64px)' } }}>
      <PageHeader
        eyebrow="Analysis workspace"
        title="Spectral analysis"
        description="Upload or load a recording, annotate ten-second windows, tune the analysis detail, then narrow the spectrogram to the time and frequency band you care about."
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
            setAudioFile={handleSelectAudioFile}
            setDefaultX={setDefaultX}
            setDefaultY={setDefaultY}
            setStats={setStats}
            canExport={Boolean(audioFile) && processing.status === 'ready'}
            onExportScreenshot={() => spectrogramRef.current?.exportScreenshot()}
            onRecordingSaved={(saved) => setRecording(saved)}
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
                    audioRef={audioRef}
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
                ref={spectrogramRef}
                audioFile={audioFile}
                colorscale={colorscale}
                timeRange={xrange}
                frequencyRange={yrange}
                maxFrames={detail.maxFrames}
                maxBins={detail.maxBins}
                onProcessingChange={setProcessing}
                audioRef={audioRef}
                annotationWindows={annotation.windows}
                pinnedWindowIndex={annotation.pinnedWindowIndex}
                onPinWindow={annotation.pinWindow}
              />
            </Box>
          </Paper>

          {isDesktop && (
            <Paper sx={{ width: PANEL_WIDTH, flexShrink: 0, p: 2.5, overflowY: 'auto' }}>
              {sidePanel}
            </Paper>
          )}
        </Box>
      </Box>

      <Drawer anchor="right" open={panelOpen} onClose={() => setPanelOpen(false)}>
        <Box sx={{ width: { xs: '88vw', sm: 380 }, p: 2.5 }} role="presentation">
          {sidePanel}
        </Box>
      </Drawer>

      <Dialog
        open={unsavedChanges.isPromptOpen}
        onClose={unsavedChanges.cancelLeave}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Discard annotation changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {unsavedChanges.message} If you continue, your annotation draft will be discarded.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={unsavedChanges.cancelLeave}>Keep editing</Button>
          <Button color="warning" variant="contained" onClick={unsavedChanges.confirmLeave}>
            Discard changes
          </Button>
        </DialogActions>
      </Dialog>

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
