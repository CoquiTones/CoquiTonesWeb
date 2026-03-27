import { createTheme } from '@mui/material/styles';
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: "#ffc857"
        },
        secondary: {
            main: "#a44200"
        },
        // background: '#0000',
        error: { main: '#e70505' },
        warning: { main: '#fffb00' },
        info: { main: '#2196f3' },
        success: { main: '#4caf50' },
    },
});

export default theme;