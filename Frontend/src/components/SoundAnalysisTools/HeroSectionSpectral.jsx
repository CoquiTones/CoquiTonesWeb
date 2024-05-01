import React from 'react';
import { HeroContainer, HeroBg, ImageBg, HeroContent, HeroH1, HeroP } from '../shared/HeroStyle';
import SpectralBg from '../assets/images/SpectralBackground.png'
const HeroSectionSpectral = () => {
    return (
        <HeroContainer style={{height: '600px'}}>
            <HeroBg>
                <ImageBg src={SpectralBg} alt='Spectral Analysis Background Image' />
            </HeroBg>
            <HeroContent>
                <HeroH1 style={{ color: '#ffc857' }}>Spectral Analysis</HeroH1>
                <HeroP style={{ color: '#ffc857' }}>
                For spectrogram use, scroll below!
            </HeroP>
            </HeroContent>
        </HeroContainer>
        );
    };

export default HeroSectionSpectral;