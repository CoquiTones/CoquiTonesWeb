import React, { useState } from "react";
import { Popover, Typography } from "@mui/material";

const SpectrogramTooltip = ({ anchorEl, open, x, y, value }) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      PaperProps={{
        style: { padding: "8px 12px", pointerEvents: "none" },
      }}
    >
      <Typography variant="body2">
        Time: {x.toFixed(2)}s<br />
        Freq: {y.toFixed(1)}Hz
        <br />
        dB: {value.toFixed(1)}
      </Typography>
    </Popover>
  );
};

export default SpectrogramTooltip;
