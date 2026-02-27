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
        // background: '#0000',
        error: { main: '#e70505' },
        warning: { main: '#fffb00' },
        info: { main: '#2196f3' },
        success: { main: '#4caf50' },
    },
});


// // ✅ CORRECT - all colors defined
// const theme = createTheme({
//   palette: {
//     primary: { main: '#1976d2' },
//     secondary: { main: '#e70505' },
//     error: { main: '#f44336' },
//     warning: { main: '#fffb00' },
//     info: { main: '#2196f3' },
//     success: { main: '#4caf50' },
//   }
// });
export default theme;