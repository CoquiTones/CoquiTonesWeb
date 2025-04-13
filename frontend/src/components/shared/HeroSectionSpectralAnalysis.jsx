import React from "react";
import "./HeroStyle.css";
import CDNBg from "../assets/images/CDNBackground.png";

const HeroSectionSpectralAnalysis = () => {
  return (
    <div className="hero-container">
      <div className="hero-bg">
        <img src={CDNBg} alt="CDN Background" className="image-bg" />
      </div>
      <div className="hero-content">
        <h1 className="hero-h1">Spectral Analysis</h1>
        <p className="hero-p">Scroll below to start Visualizing Audio!</p>
      </div>
    </div>
  );
};

export default HeroSectionSpectralAnalysis;
