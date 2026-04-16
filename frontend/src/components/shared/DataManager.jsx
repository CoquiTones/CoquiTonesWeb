import React, { useEffect, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import FileUpload from "./FileUpload";
import { APIHandlerSpectralAnalysis } from "../../services/rest/APIHandler/APIHandlerSpectralAnalysis";
import InsertAudioRequest from "../../services/rest/RequestORM/SpectralAnalysis/insertAudioRequest";

const DataManager = ({ audioFile, setAudioFile, setDefaultX, setDefaultY, setStats, errors, setErrors }) => {
  const [open, setOpen] = useState(false);
  const [nid, setNid] = useState("");
  const [dateTime, setDateTime] = useState(new Date().getTime());
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
      const request = new InsertAudioRequest(audioFile, nid, dateTime);
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
          <Stack spacing={2}>

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
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker label="Date Recorded"
                onChange={(newDateTime) => setDateTime(new Date(newDateTime).getTime())}
              />
            </LocalizationProvider>
          </Stack>


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
