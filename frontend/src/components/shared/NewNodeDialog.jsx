import React, { useState, useMemo } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { InsertNewNodeRequest } from "../../services/rest/RequestORM/NetworkMonitor/NewNodeRequest";
import { APIHandlerNetworkMonitor } from "../../services/rest/APIHandler/APIHandlerNetworkMonitor";

export default function NewNodeDialog({ errors, setErrors }) {
  const [open, setOpen] = useState(false);
  const [nodeType, setNodeType] = useState("primary");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");
  const apiHandler = useMemo(() => new APIHandlerNetworkMonitor());
  const [nodeName, setNodeName] = useState("")
  const [mqttNodeClientPassword, setMqttNodeClientPassword] = useState("")

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = (event) => {
    try {

      event.preventDefault();
      const insert_node_request = new InsertNewNodeRequest(nodeType, longitude, latitude, description, nodeName, mqttNodeClientPassword);
      const apiHandler = new APIHandlerNetworkMonitor();
      apiHandler.insert_new_node(insert_node_request);
      handleClose();
    } catch (error) {
      setErrors([...errors, setErrors])
    }
  };

  return (
    <div style={{ display: "flex", height: "40px" }}>
      <IconButton
        aria-label="add"
        onClick={handleClickOpen}
        style={{ fontSize: "24px" }}
        variant="con"
      >
        <AddIcon color="primary" style={{ height: "40px", width: "36px" }} />
        Add New Node
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
        <DialogTitle>New Node</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To include a new node in the database, please provide the following
            information:
            mqtt client password MUST match the one flashed to node
          </DialogContentText>
          <br />
          <DialogContentText>Node Type:</DialogContentText>
          <Select
            value={nodeType}
            onChange={(event) => setNodeType(event.target.value)}
            fullWidth
            label="Node Type"
          >
            <MenuItem value="primary">Primary</MenuItem>
            <MenuItem value="secondary">Secondary</MenuItem>
          </Select>
          <TextField
            required
            margin="dense"
            id="latitude"
            label="Latitude"
            type="text"
            fullWidth
            variant="standard"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
          />
          <TextField
            required
            margin="dense"
            id="longitude"
            label="Longitude"
            type="text"
            fullWidth
            variant="standard"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
          />
          <TextField
            required
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            variant="standard"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <TextField
            required
            margin="dense"
            id="node_name"
            label="Node Name"
            type="text"
            fullWidth
            variant="standard"
            value={nodeName}
            onChange={(event) => setNodeName(event.target.value)}
          />

          {nodeType == "primary" &&

            <TextField
              required
              margin="dense"
              id="mqtt"
              label="Mqtt Client Password"
              type="password"
              fullWidth
              variant="standard"
              value={mqttNodeClientPassword}
              onChange={(event) => setMqttNodeClientPassword(event.target.value)}
            />
          }

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Submit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
