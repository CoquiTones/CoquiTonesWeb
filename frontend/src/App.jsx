import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import AppRoutes from './routes';
import theme from './theme/theme';
import { ErrorProvider } from './components/shared/ErrorContext';
import { GlobalStateProvider } from './services/Authentication/GlobalStateManager';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorProvider>
        <GlobalStateProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </GlobalStateProvider>
      </ErrorProvider>
    </ThemeProvider>
  );
}
