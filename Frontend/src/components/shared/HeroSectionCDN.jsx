import React from "react";
import CDNBg from "../assets/images/CDNBackground.png";
import { ThemeProvider } from "@mui/material";
import theme from "./Theme";
import "./HeroStyle.css";

const HeroSectionCDN = () => {
  return (
    <ThemeProvider theme={theme}>
      <div className="hero-container">
        <div className="hero-bg">
          <img src={CDNBg} alt="CDN Background" className="image-bg" />
        </div>
        <div className="hero-content">
          <h1 className="hero-h1">Cluster Duck Network</h1>
          <p className="hero-p">For node information, scroll below!</p>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default HeroSectionCDN;
