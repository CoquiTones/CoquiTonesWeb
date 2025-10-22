import React, { useEffect, useState } from "react";
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function FileUpload({ setAudioFile }) {

    const [currentFile, setCurrentFile] = useState(null)
    useEffect(() => {
        handleUpload(currentFile)
    }, [currentFile])

    const handleUpload = () => {
        setAudioFile(currentFile);

    }
    const VisuallyHiddenInput = styled('input')({
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: 1,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 0,
        left: 0,
        whiteSpace: 'nowrap',
        width: 1,
    });

    return (

        <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            onChange={(evt) => setCurrentFile(evt.target.files[0])}
        >
            Upload file
            <VisuallyHiddenInput type="file" accept=".wav, .mp3, .mp4" />
        </Button>
    );

}  