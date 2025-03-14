import React from "react";
import { styled } from "@mui/material/styles";

export const NodeContainer = styled("div")(({ theme }) => ({
  height: "800px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "rgb(0, 0, 0)",
  [theme.breakpoints.down("md")]: {
    height: "1400px",
  },
  [theme.breakpoints.down("sm")]: {
    height: "1400px",
  },
}));

export const NodeWrapper = styled("div")(({ theme }) => ({
  maxWidth: "2000px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  height: "100%",
  width: "80%",
  alignItems: "center",
  gridGap: "24px",
  padding: "0 50px",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    padding: "0 20px",
    height: "90%",
    gridGap: "8px",
  },
  [theme.breakpoints.down("sm")]: {
    gridGap: "8px",
  },
}));

export const NodeCard = styled("div")({
  background: "#313338",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  borderRadius: "10px",
  maxHeight: "380px",
  maxWidth: "720px",
  padding: "40px",
  boxShadow: "0 1px 3px rgba(255,255,255,0.2)",
  transition: "all 0.2s ease-in-out",
  "&hover": {
    transform: "scale(1.02)",
    transition: "all 0.2s ease-in-out",
    cursor: "pointer",
  },
});

export const NodeTitle = styled("p")({
  fontSize: "28px",
  color: "#ffc857",
  textAlign: "left",
  marginTop: "-20px",
  marginBottom: "-4px",
});

export const NodeInfo = styled("p")({
  fontSize: "16px",
  color: "#fff",
  textAlign: "left",
  marginBottom: "8px",
});

const NodeStyle = () => {
  return <></>;
};

export default NodeStyle;
