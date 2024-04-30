import React from 'react';
import Video from '../../components/assets/videos/nightvideo.mp4'
import { HeroContainer, HeroBg, VideoBg, HeroContent, HeroH1, HeroP } from './HeroStyle';
import logo from '../assets/images/logo512.png';
const HeroSection = () => {
  return (
    <HeroContainer id="home">
      <HeroBg>
        <VideoBg autoPlay loop muted src={Video} type='video/mp4' />
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
