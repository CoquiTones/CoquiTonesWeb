import { styled } from '@mui/material/styles';
import { Link as LinkRouter } from 'react-router-dom';

export const Button = styled(LinkRouter)(({ primary, big, dark, fontBig }) => ({
    borderRadius: '50px',
    background: primary ? '#ffc857' : '#191716',
    whiteSpace: 'nowrap',
    padding: big ? '14px 48px' : '12px 30px',
    color: dark ? '#191716' : '#fff',
    fontSize: fontBig ? '20px' : '16px',
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease-in-out',

    '&:hover': {
        transition: 'all 0.2s ease-in-out',
        background: primary ? '#fff' : '#ffc857',
    },
}));
