// TODO: When we obtain the logo from Graphic Designer, get the palettes of the logo and use as primary and secondary for the website
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
        background: '#0000'
    },
});

export default theme;