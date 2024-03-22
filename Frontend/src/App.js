import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css';
import About from './pages/About';
import CDN from './pages/CDN'
import Dashboard from './pages/Dashboard';
import Classifier from './pages/Classifier';
import SpectralAnalysis from './pages/SpectralAnalysis';
import theme from './components/shared/Theme';
import { ThemeProvider } from '@mui/material/styles';
function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<ThemeProvider theme={theme} > <Dashboard /> </ThemeProvider>} />
          <Route path='/About' element={<ThemeProvider theme={theme} > <About /> </ThemeProvider>} />
          <Route path='/CDN' element={<ThemeProvider theme={theme} > <CDN /> </ThemeProvider>} />
          <Route path='/Classifier' element={<ThemeProvider theme={theme} > <Classifier /> </ThemeProvider>} />
          <Route path='/SpectralAnalysis' element={<ThemeProvider theme={theme} > <SpectralAnalysis /> </ThemeProvider>} />
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
