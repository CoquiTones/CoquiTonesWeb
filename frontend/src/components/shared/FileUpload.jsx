import { useId, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IconButton from '@mui/material/IconButton';
import { alpha } from '@mui/material/styles';

import { useErrors } from './ErrorContext';

const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.mp4', '.m4a', '.ogg', '.flac'];
const MAX_SIZE_MB = 100;

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const validateFile = (file) => {
  if (!file) return 'Choose an audio file to continue.';
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `Unsupported file type "${extension}". Use ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `That file is too large. The limit is ${MAX_SIZE_MB} MB.`;
  }
  return null;
};

/**
 * Accessible audio picker: click, keyboard, or drag & drop. Resets the native
 * input value so choosing the same file twice still triggers a change.
 */
export default function FileUpload({ setAudioFile, buttonLabel = 'Upload audio file' }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const { addError } = useErrors();
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      addError(validationError);
      return;
    }
    setSelectedFile(file);
    setAudioFile(file);
  };

  const onInputChange = (event) => {
    handleFile(event.target.files?.[0]);
    // Allow re-selecting the same path later.
    event.target.value = '';
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setAudioFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Box>
      <Box
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          border: '1.5px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          backgroundColor: dragActive ? alpha('#FFC857', 0.08) : alpha('#F5F1E8', 0.03),
          transition: 'border-color 150ms ease, background-color 150ms ease',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 44,
              height: 44,
              borderRadius: 2,
              backgroundColor: alpha('#FFC857', 0.14),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <CloudUploadRoundedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="p" variant="subtitle2" color="text.primary">
              {selectedFile ? selectedFile.name : 'Drag a recording here, or browse'}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p">
              {selectedFile
                ? `${formatSize(selectedFile.size)} · ready to analyse`
                : `WAV, MP3, MP4, M4A, OGG or FLAC · up to ${MAX_SIZE_MB} MB`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {selectedFile && (
            <IconButton aria-label={`Remove ${selectedFile.name}`} onClick={clearFile} size="small">
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
          <Button
            variant="contained"
            startIcon={<InsertDriveFileRoundedIcon />}
            onClick={() => inputRef.current?.click()}
          >
            {buttonLabel}
          </Button>
          <Box
            component="input"
            id={inputId}
            ref={inputRef}
            type="file"
            aria-label="Choose an audio file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            onChange={onInputChange}
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
