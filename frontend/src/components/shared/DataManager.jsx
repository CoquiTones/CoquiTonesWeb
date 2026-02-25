import React, { useEffect, useState } from "react";
import { Typography, Box, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import FileUpload from "./FileUpload";
import { APIHandlerSpectralAnalysis } from "../../services/rest/APIHandler/APIHandlerSpectralAnalysis";
import { insertAudioRequest } from "../../services/rest/RequestORM/SpectralAnalysis/insertAudioRequest";

const DataManager = ({ audioFile, setAudioFile, setDefaultX, setDefaultY }) => {
  const [stats, setStats] = useState({
    duration: 0,
    sampleRate: 22000,
    number_of_channels: 2,
    bitrate: 16,
    codec: "wav",
    size: 80000,
  });

  const handleSubmit = () => {
    const apiHandler = new APIHandlerSpectralAnalysis();
    const insertAudioRequest = new insertAudioRequest(
      audioFile,
      nid,
      timestamp
    );
    apiHandler.insertAudio(insertAudioRequest);
    setOpen(false);
  };
  useEffect(() => {
    if (audioFile) {
      const processAudio = async () => {
        try {
          const audioContext = new AudioContext();
          const arrayBuffer = await audioFile.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const duration = audioBuffer.duration;
          const sampleRate = audioBuffer.sampleRate;
          const numberOfChannels = audioBuffer.numberOfChannels;
          const size = audioFile.size;
          const bitrate = duration ? (size * 8) / duration : 0;
          const codec = audioFile.name.split(".").pop();

          setDefaultX([0, duration.toFixed(1)]);
          setStats({
            duration,
            sampleRate,
            number_of_channels: numberOfChannels,
            bitrate: Math.round(bitrate),
            codec,
            size,
          });
        } catch (error) {
          console.error("Error processing audio file:", error);
        }
      };

      processAudio();
    }
  }, [audioFile]);

  const [open, setOpen] = useState(false);
  const [nid, setNid] = useState("");
  const [timestamp, setTimestamp] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <Box>
      <FileUpload setAudioFile={setAudioFile} />
      {audioFile && (
        <Box mt={2}>
          <Typography variant="body1" gutterBottom>
            <strong>Duration:</strong> {stats.duration.toFixed(2)} sec
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Sample Rate:</strong> {stats.sampleRate} Hz
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Channels:</strong> {stats.number_of_channels}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Bitrate:</strong> {stats.bitrate} bps
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Codec:</strong> {stats.codec}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Size:</strong> {(stats.size / 1024).toFixed(2)} KB
          </Typography>
        </Box>
      )}
      <div style={{ display: "flex", height: "40px" }}>
        <IconButton
          aria-label="add"
          onClick={handleClickOpen}
          style={{ fontSize: "24px" }}
          disabled={audioFile === null}
        >
          <AddIcon color="primary" style={{ height: "40px", width: "36px" }} />
        </IconButton>
        <Dialog
          open={open}
          onClose={handleClose}
          PaperProps={{
            component: "form",
            onSubmit: handleSubmit,
            style: {
              backgroundColor: "#313338", // Set a solid background color
              color: "#fff", // Optional - to improve text visibility
              borderRadius: "12px", // Optional - for cleaner styling
            },
          }}
        >
          <DialogTitle>Upload Audio to Database</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To insert a new audio samplein the database, please provide the
              following information:
            </DialogContentText>
            <br />

            <TextField
              required
              margin="dense"
              id="nid"
              label="Node ID"
              type="text"
              fullWidth
              variant="standard"
              value={nid}
              onChange={(event) => setNid(event.target.value)}
            />
            <TextField
              required
              margin="dense"
              id="longitude"
              label="Timestamp (00:00:00)"
              type="text"
              fullWidth
              variant="standard"
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogActions>
        </Dialog>
      </div>
    </Box>
  );
};

export default DataManager;
