import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css';
import ProtectedRoute from './pages/ProtectedRoute';
import About from './pages/About';
import NetworkMonitor from './pages/NetworkMonitor'
import Dashboard from './pages/Dashboard';
import Classifier from './pages/Classifier';
import SpectralAnalysis from './pages/SpectralAnalysis';
import theme from './components/shared/Theme';
import { ThemeProvider } from '@mui/material/styles';
import Home from './pages/Home';
import PageNotFound from './pages/Page404';
import SignUpPage from './pages/SignUp';
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';
function App() {
  const [open, setOpen] = useState(false);
  const toggle = () => {
    setOpen(!open);
  }
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<ThemeProvider theme={theme} > <Navbar toggle={toggle} isHome={true} /> <Home /> </ThemeProvider>} />
          <Route element={<ProtectedRoute />} >
            <Route path='/Dashboard' element={<ThemeProvider theme={theme} > <Navbar toggle={toggle} isHome={false} />  <Sidebar isOpen={open} toggle={toggle} /> <Dashboard /> </ThemeProvider>} />
            <Route path='/NetworkMonitor' element={<ThemeProvider theme={theme} > <Navbar toggle={toggle} isHome={false} />   <Sidebar isOpen={open} toggle={toggle} /> <NetworkMonitor /> </ThemeProvider>} />
          </Route>
          <Route path='/About' element={<ThemeProvider theme={theme} > <Navbar toggle={toggle} isHome={false} />   <Sidebar isOpen={open} toggle={toggle} /> <About /> </ThemeProvider>} />
          <Route path='/Classifier' element={<ThemeProvider theme={theme} > <Navbar toggle={toggle} isHome={false} />   <Sidebar isOpen={open} toggle={toggle} /> <Classifier /> </ThemeProvider>} />
          <Route path='/SpectralAnalysis' element={<ThemeProvider theme={theme} > <Navbar toggle={toggle} isHome={false} />   <Sidebar isOpen={open} toggle={toggle} /> <SpectralAnalysis /> </ThemeProvider>} />
          <Route path='/SignUp' element={<ThemeProvider theme={theme} > <SignUpPage /> </ThemeProvider>} />
          <Route path='*' element={<ThemeProvider theme={theme} > <Navbar toggle={toggle} isHome={false} />  <PageNotFound /> </ThemeProvider>} />
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
