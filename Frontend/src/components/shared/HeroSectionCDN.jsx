import React from 'react';
import { HeroContainer, HeroBg, ImageBg, HeroContent, HeroH1, HeroP } from './HeroStyle';
import logo from '../assets/images/logo512.png';
import CDNBg from '../assets/images/CDNBackground.png'
const HeroSectionCDN = () => {
  return (
    <HeroContainer>
      <HeroBg>
        <ImageBg src={CDNBg} alt='CDN Background' />
      </HeroBg>
      <HeroContent>
        <HeroH1 style={{ color: '#ffc857' }}>Cluster Duck Network</HeroH1>
        <HeroP style={{ color: '#ffc857' }}>
          For node information, scroll below!
        </HeroP>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSectionCDN;
