// hooks/useAudioDownload.js
import { useState, useCallback, useContext } from 'react';
import { ErrorContext } from '../components/shared/ErrorContext';
export const useAudioDownload = (apiHandler) => {
    const [loading, setLoading] = useState(false);
    const { errors, setErrors } = useContext(ErrorContext);
    const [error, setError] = useState([])
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
        } catch (error) {
            setErrors([...errors, err.message]);
            setError(error)
        } finally {
            setLoading(false);
        }
    }, [apiHandler]);

    return { downloadAudio, loading, error };
};
