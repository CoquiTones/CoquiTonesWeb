import React from 'react';
import { HeroContainer, HeroBg, ImageBg, HeroContent, HeroH1, HeroP } from '../shared/HeroStyle';
import ClassifierBg from '../assets/images/ClassifierBackground.png'
const HeroSectionClassifier = () => {
  return (
    <HeroContainer  style={{height: '600px'}}>
      <HeroBg>
        <ImageBg src={ClassifierBg} alt='Machine Learning Analysis Background' />
      </HeroBg>
      <HeroContent>
        <HeroH1 style={{ color: '#ffc857' }}>Machine Learning Analysis</HeroH1>
        <HeroP style={{ color: '#ffc857' }}>
          For machine learning information, scroll below!
        </HeroP>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSectionClassifier;
