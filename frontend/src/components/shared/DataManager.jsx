import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
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

const DataManager = ({ audioFile, setAudioFile, setDefaultX, setDefaultY, setStats, errors, setErrors }) => {
  const [open, setOpen] = useState(false);
  const [nid, setNid] = useState("");
  const [timestamp, setTimestamp] = useState("");
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
      if (setStats) {
        setStats({
          duration,
          sampleRate,
          number_of_channels: numberOfChannels,
          bitrate: Math.round(bitrate),
          codec,
          size,
        });
      }
    } catch (error) {
      setErrors([...errors, error])
    }
  };

  useEffect(() => {
    if (audioFile) {
      processAudio();
    }
  }, [audioFile]);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {

      const apiHandler = new APIHandlerSpectralAnalysis();
      const request = new insertAudioRequest(audioFile, nid, timestamp);
      await apiHandler.insertAudio(request);
      setOpen(false);
    } catch (error) {
      setErrors([...errors, error])
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FileUpload setAudioFile={setAudioFile} />
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
            backgroundColor: "#313338",
            color: "#fff",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle>Upload Audio to Database</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To insert a new audio sample in the database, please provide the
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
    </Box>
  );
};

export default DataManager;
