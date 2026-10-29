import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import PageHero from '../components/layout/PageHero';
import FileUpload from '../components/shared/FileUpload';
import ClassificationResults from '../components/classifier/ClassificationResults';
import { useErrors } from '../components/shared/ErrorContext';
import { APIHandlerClassifier } from '../services/rest/APIHandler/APIHandlerClassifier';
import { ClassifyAudioRequest } from '../services/rest/RequestORM/Classifier/ClassifyAudioRequest';
import classifierBackground from '../components/assets/images/ClassifierBackground.webp';

export default function Classifier() {
  const { addError } = useErrors();
  const apiHandler = useMemo(() => new APIHandlerClassifier(), []);
  const [audioFile, setAudioFile] = useState(null);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!audioFile) {
      setReport(null);
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;

    const runClassification = async () => {
      setStatus('loading');
      setReport(null);

      try {
        const result = await apiHandler.fetchClassification(new ClassifyAudioRequest(audioFile));
        if (cancelled) return;
        setReport(result);
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        addError(error);
        setStatus('error');
      }
    };

    runClassification();

    return () => {
      cancelled = true;
    };
  }, [audioFile, apiHandler, addError]);

  return (
    <>
      <PageHero
        compact
        eyebrow="Random Forest model"
        title="Machine learning analysis"
        description="Upload a field recording and see which coquí species the model detects in each time slice."
        image={classifierBackground}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          <Typography component="h2" variant="h6" color="text.primary" sx={{ mb: 0.5 }}>
            Audio file
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            WAV files give the best results. Classification runs on the server and can take a moment
            for long recordings.
          </Typography>
          <FileUpload setAudioFile={setAudioFile} buttonLabel="Choose recording" />
        </Paper>

        {status === 'loading' && (
          <Paper sx={{ p: { xs: 3, md: 5 } }} aria-live="polite">
            <Typography component="h2" variant="h6" color="text.primary">
              Analysing {audioFile?.name}…
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              The model is scanning each time slice. This may take a moment for large files.
            </Typography>
            <LinearProgress />
          </Paper>
        )}

        {status === 'error' && (
          <Alert severity="error">
            The file could not be classified. Choose another recording or try again later.
          </Alert>
        )}

        {status === 'ready' && report && report.length === 0 && (
          <Alert severity="warning">
            No species were detected in that recording. Try a longer or clearer sample.
          </Alert>
        )}

        {status === 'ready' && report && report.length > 0 && (
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <ClassificationResults
              report={report}
              fileName={audioFile?.name}
              audioFile={audioFile}
            />
          </Paper>
        )}

        {status === 'idle' && (
          <Box
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Results will appear here once a recording is uploaded.
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}
