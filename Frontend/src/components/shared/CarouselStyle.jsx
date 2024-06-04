import React from "react";
import { styled } from "@mui/system";

export const CarouselContainer = styled('div')({
    background: '#191716',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0',
    marginTop: '-40px',
    height: '800px',
    position: 'relative',
    zIndex: '1',
})

export const CarouselContent = styled('div')({
    zIndex: '3',
    maxWidth: '1600px',
    position: 'absolute',
    padding: '8px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',

})

export const CarouselH1 = styled('h1')(({ theme }) => ({
    borderRadius: '30px',
    color: '#ffc857',
    fontSize: '42px',
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
        fontSize: '36px',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '28px',
    },
}));

export const CarouselP = styled('p')(({ theme }) => ({
    borderRadius: '12px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '28px',
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
        fontSize: '20px',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '16px',
    },
}))