import React from 'react';
import { HeroContainer, HeroBg, VideoBg, HeroContent, HeroH1, HeroP } from './HeroStyle';
import logo from '../assets/images/logo512.png';
const HeroSection = () => {
  return (
    <HeroContainer id="home">
      <HeroBg>
        <VideoBg autoPlay loop muted src={"https://videos.pexels.com/video-files/9777616/9777616-hd_1920_1080_30fps.mp4"} type='video/mp4' />
      </HeroBg>
      <HeroContent>
        <img src={logo} width={250} height={250} alt='Logo' />
        <HeroH1>All the tools you need for monitoring Amphibian Species with Acoustics. All in one place. All completely Open Source.</HeroH1>
        <HeroP>
          Scroll below to obtain additional information on what CoquiTones is about!
        </HeroP>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSection;
