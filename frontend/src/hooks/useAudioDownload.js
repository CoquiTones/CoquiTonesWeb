// hooks/useAudioDownload.js
import { useState, useCallback } from 'react';

export const useAudioDownload = (apiHandler) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const downloadAudio = useCallback(async (afid, audioFileRequest) => {
        setLoading(true);
        setError(null);
        try {
            const audioFile = await apiHandler.getAudioById(audioFileRequest);

            const blob = new Blob([audioFile], { type: 'audio/mpeg' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `audio_${afid}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
            console.error('Error downloading audio file:', err);
        } finally {
            setLoading(false);
        }
    }, [apiHandler]);

    return { downloadAudio, loading, error };
};
