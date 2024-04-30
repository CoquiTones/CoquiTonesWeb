import React, { useEffect, useRef, useState } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { Button } from "@mui/material";
import theme from "../shared/Theme";

export default function SoundPlayer({ file, setCurrentTime, yrange, xrange, currentTime }) {
    const [playing, setPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    useEffect(() => {

        if (file) {
            const url = URL.createObjectURL(file)
            setAudioUrl(url)
        }
    }, [file])


    const [source, setSource] = useState(null)
    const [bandpassFilter, setBandPassFilter] = useState(null)
    const [audioContext, setAudioContext] = useState(null)
    const audioElementRef = useRef(null);


    function filterAudio() {


        const centerFrequency = (yrange[0] + yrange[1]) / 2; // Set center frequency
        const qualityFactor = centerFrequency / (yrange[1] - yrange[0])
        bandpassFilter.type = 'bandpass'; // Set filter type to bandpass
        bandpassFilter.frequency.value = centerFrequency;
        bandpassFilter.Q.value = qualityFactor; // Set quality factor


    }


    useEffect(() => {


        if (audioUrl && audioElementRef.current && source) {
            filterAudio()
        }
    }, [yrange, audioUrl])



    const handleTimeUpdate = (event) => {
        setCurrentTime(event.target.currentTime);
    };

    useEffect(() => {

        if ((currentTime > xrange[1])) {

            audioElementRef.current.currentTime = xrange[0]
        }


    }, [currentTime, xrange])

    const handleClick = () => {
        // async react bullshit 
        setPlaying(!playing);
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(audioCtx)



    };
    useEffect(() => {
        if (audioContext) {
            const audioSrc = audioContext.createMediaElementSource(audioElementRef.current);
            setSource(audioSrc);
            const biquadFilter = audioContext.createBiquadFilter();
            setBandPassFilter(biquadFilter);
        }
    }, [audioContext])

    useEffect(() => {
        if (source) {
            source.connect(bandpassFilter);
            bandpassFilter.connect(audioContext.destination);
        }
    }, [source, bandpassFilter])

    return (
        <ThemeProvider theme={theme}>
            {audioUrl && !playing && <Button
                variant="condensed"
                onClick={() => handleClick()}
            >
                Play Sample
            </Button>}

            <div>

                {playing && <audio
                    src={audioUrl}
                    ref={audioElementRef}
                    onTimeUpdate={handleTimeUpdate}
                    controls
                />}

            </div>

        </ThemeProvider>
    );
}
