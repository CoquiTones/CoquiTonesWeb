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
    const formData = new FormData();
    formData.append("ntype", nodeType);
    formData.append("nlongitude", longitude);
    formData.append("nlatitude", latitude);
    formData.append("ndescription", description);
    // .meta.env imports
    // TODO: move to datahandler
    const web_url = import.meta.env.VITE_BACKEND_API_URL;
    const endpoint = "/api/node/insert";

    fetch(web_url + endpoint, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        return response.json();
      })
      .then((data) => {
        console.log(data);
        setDucks((prev) => [...prev, data]);
      })
      .catch((error) => {
        console.error("Error:", error);
        throw error; // Re-throw the error for further handling
      });

    console.log("Node Type:", nodeType);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Description:", description);
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
