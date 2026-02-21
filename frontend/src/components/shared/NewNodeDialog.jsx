import React from "react";
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

export default function NewNodeDialog({ setDucks }) {
  const [open, setOpen] = React.useState(false);
  const [nodeType, setNodeType] = React.useState("primary");
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const insert_node_request = new InsertNewNodeRequest(nodeType, longitude, latitude, description);
    const apiHandler = new APIHandlerNetworkMonitor();
    apiHandler.insert_new_node(insert_node_request);
    handleClose();
  };

  return (
    <div style={{ display: "flex", height: "40px" }}>
      <IconButton
        aria-label="add"
        onClick={handleClickOpen}
        style={{ fontSize: "24px" }}
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
        <DialogTitle>New Node</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To include a new node in the database, please provide the following
            information:
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Submit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
