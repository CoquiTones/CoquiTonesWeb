import { useCallback, useState } from 'react';
import { useErrors } from '../components/shared/ErrorContext';

const extensionFor = (mimeType = '') => {
  if (mimeType.includes('mpeg')) return '.mp3';
  if (mimeType.includes('wav')) return '.wav';
  if (mimeType.includes('mp4')) return '.m4a';
  if (mimeType.includes('ogg')) return '.ogg';
  if (mimeType.includes('flac')) return '.flac';
  return '.audio';
};

/**
 * Downloads an audio file by id and hands it to the browser.
 */
export const useAudioDownload = (apiHandler) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addError } = useErrors();

  const downloadAudio = useCallback(
    async (afid, audioFileRequest) => {
      setLoading(true);
      setError(null);

      try {
        const blob = await apiHandler.getAudioById(audioFileRequest);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audio_${afid}${extensionFor(blob.type)}`;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Give the browser a tick to start the download before revoking.
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (downloadError) {
        setError(downloadError);
        addError(downloadError?.message ?? 'Could not download that audio file.');
      } finally {
        setLoading(false);
      }
    },
    [apiHandler, addError],
  );

  return { downloadAudio, loading, error };
};

export default useAudioDownload;
