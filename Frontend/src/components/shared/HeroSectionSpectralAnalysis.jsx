import React from "react";
import {
  HeroContainer,
  HeroBg,
  ImageBg,
  HeroContent,
  HeroH1,
  HeroP,
} from "./HeroStyle";
import CDNBg from "../assets/images/CDNBackground.png";
const HeroSectionSpectralAnalysis = () => {
  return (
    <HeroContainer>
      <HeroBg>
        <ImageBg src={CDNBg} alt="CDN Background" />
      </HeroBg>
      <HeroContent>
        <HeroH1 style={{ color: "#ffc857" }}>Spectral Analysis</HeroH1>
        <HeroP style={{ color: "#ffc857" }}>
          Scroll below to start Visualizing Audio!
        </HeroP>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSectionSpectralAnalysis;
