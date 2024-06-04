import React from 'react';
import { styled } from '@mui/system';

export const HeroContainer = styled('div')({
    background: '#191716',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 30px',
    height: '100vh',
    position: 'relative',
    zIndex: '1',
    '&:before': {
        content: '""',
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%), linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
        zIndex: '2',
    },
});

export const HeroBg = styled('div')({
    position: 'absolute',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
});

export const VideoBg = styled('video')({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: '#232a34',
});

export const ImageBg = styled('img')({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: 'transparent'
})

export const HeroContent = styled('div')({
    zIndex: '3',
    maxWidth: '1200px',
    position: 'absolute',
    padding: '8px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
});

export const HeroH1 = styled('h1')(({ theme }) => ({
    borderRadius: '30px',
    //background: 'rgba(204,204,204,0.5)',
    color: '#a44200',
    fontSize: '48px',
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
        fontSize: '40px',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '32px',
    },
}));

export const HeroP = styled('p')(({ theme }) => ({
    borderRadius: '12px',
    //background: 'rgba(204,204,204,0.5)',
    color: '#a44200',
    fontWeight: 'bold',
    fontSize: '32px',
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
        fontSize: '24px',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '18px',
    },
}));
