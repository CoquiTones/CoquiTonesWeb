import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import FileUpload from './FileUpload';
import AudioLoader from './AudioLoader';
import { useErrors } from './ErrorContext';
import { APIHandlerSpectralAnalysis } from '../../services/rest/APIHandler/APIHandlerSpectralAnalysis';
import InsertAudioRequest from '../../services/rest/RequestORM/SpectralAnalysis/insertAudioRequest';

/**
 * Audio source toolbar: local upload, load from the database, and persist the
 * current file with node/timestamp metadata.
 */
export default function DataManager({
  audioFile,
  setAudioFile,
  setDefaultX,
  setDefaultY,
  setStats,
  canExport = false,
  onExportScreenshot,
  onRecordingSaved,
}) {
  const { addError } = useErrors();
  const [saveOpen, setSaveOpen] = useState(false);
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => dayjs());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const processAudio = useCallback(async () => {
    if (!audioFile) return;

    let audioContext;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const duration = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      const numberOfChannels = audioBuffer.numberOfChannels;
      const size = audioFile.size;
      const bitrate = duration ? (size * 8) / duration : 0;
      const codec = audioFile.name.split('.').pop()?.toUpperCase();

      setDefaultX([0, Number(duration.toFixed(1))]);
      setDefaultY([0, Math.round(sampleRate / 2)]);
      setStats({
        duration,
        sampleRate,
        numberOfChannels,
        bitrate: Math.round(bitrate),
        codec,
        size,
      });
    } catch (error) {
      addError('That audio file could not be decoded. Try a different WAV or MP3 file.');
      console.error(error);
    } finally {
      audioContext?.close?.();
    }
  }, [audioFile, setDefaultX, setDefaultY, setStats, addError]);

  useEffect(() => {
    processAudio();
  }, [processAudio]);

  const openSaveDialog = () => {
    setSaveError('');
    setSavedMessage('');
    setSaveOpen(true);
  };

  const handleSave = async (event) => {
    event?.preventDefault();

    if (!audioFile) {
      setSaveError('Choose an audio file first.');
      return;
    }
    if (!nodeId.trim()) {
      setSaveError('Enter the node ID that recorded this file.');
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const apiHandler = new APIHandlerSpectralAnalysis();
      const request = new InsertAudioRequest(audioFile, nodeId.trim(), recordedAt.valueOf());
      const receipt = await apiHandler.insertAudio(request);
      setSaveOpen(false);
      setNodeId('');
      setSavedMessage('Recording saved to the database.');
      if (receipt?.afid) {
        onRecordingSaved?.({ afid: receipt.afid, nid: Number(request.nodeID) });
      }
    } catch (error) {
      setSaveError(error?.message ?? 'The recording could not be saved.');
      addError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <FileUpload setAudioFile={setAudioFile} buttonLabel="Upload audio" />

      <Tooltip title="Load a recording from the database">
        <IconButton aria-label="Load a recording from the database" onClick={() => setLoaderOpen(true)}>
          <CloudDownloadRoundedIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title={audioFile ? 'Save this recording to the database' : 'Upload a file to save it'}>
        <span>
          <IconButton
            aria-label="Save this recording to the database"
            onClick={openSaveDialog}
            disabled={!audioFile}
          >
            <SaveRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip
        title={canExport
          ? 'Export the visible spectrogram frame as a PNG'
          : 'Load a recording to export its spectrogram'}
      >
        <span>
          <IconButton
            aria-label="Export the visible spectrogram as a PNG"
            onClick={() => onExportScreenshot?.()}
            disabled={!canExport}
          >
            <DownloadRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>

      {savedMessage && (
        <Alert severity="success" onClose={() => setSavedMessage('')} sx={{ py: 0 }}>
          {savedMessage}
        </Alert>
      )}

      <AudioLoader
        open={loaderOpen}
        onClose={() => setLoaderOpen(false)}
        onSelect={(file, recording) => {
          setAudioFile(file, recording);
          setLoaderOpen(false);
        }}
      />

      <Dialog open={saveOpen} onClose={() => !saving && setSaveOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSave} noValidate>
          <DialogTitle>Save recording to database</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Attach this file to the node and timestamp it was recorded.
            </DialogContentText>

            {saveError && (
              <Alert severity="error" sx={{ mb: 2 }} role="alert">
                {saveError}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                required
                fullWidth
                label="Node ID"
                value={nodeId}
                onChange={(event) => setNodeId(event.target.value)}
                autoComplete="off"
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Recorded at"
                  value={recordedAt}
                  onChange={(value) => value && setRecordedAt(value)}
                  maxDateTime={dayjs()}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setSaveOpen(false)} color="inherit" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
