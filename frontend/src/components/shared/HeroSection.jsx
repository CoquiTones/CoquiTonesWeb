import React from "react";
import "./HeroStyle.css";
import logo from "../assets/images/logo512.png";

const HeroSection = () => {
  return (
    <div className="hero-container" id="home">
      <div className="hero-bg">
        <video
          className="video-bg"
          autoPlay
          loop
          muted
          src="https://videos.pexels.com/video-files/9777616/9777616-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </div>
      <div className="hero-content">
        <img src={logo} width={250} height={250} alt="Logo" />
        <h1 className="hero-h1">
          All the tools you need for monitoring Amphibian Species with
          Acoustics.
        </h1>
        <h1 className="hero-h1">
          All in one place.
        </h1>
        <h1 className="hero-h1">
          All completely Open Source.
        </h1>
        <p className="hero-p">
          Scroll below to obtain additional information on what CoquiTones is
          about!
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
