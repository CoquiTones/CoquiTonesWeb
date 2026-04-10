import React, { useState } from 'react';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import HeroSection from '../components/shared/HeroSection';
import InfoSection from '../components/shared/InfoSection';
import { dashboardData, NetworkMonitorData, ClassifierData, SpectralAnalysisData } from '../components/shared/InfoData';
import ErrorAlerts from '../components/shared/ErrorAlerts';
const Home = () => {

  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState([]);
  const toggle = () => {
    setIsOpen(!isOpen)
  }


  return (
    <>
      <ErrorAlerts errors={errors} setErrors={setErrors} />
      <Sidebar isOpen={isOpen} toggle={toggle} isHome={true} />
      <Navbar toggle={toggle} isHome={true} />
      <HeroSection />
      <InfoSection {...dashboardData} />
      <InfoSection {...NetworkMonitorData} />
      <InfoSection {...ClassifierData} />
      <InfoSection {...SpectralAnalysisData} />
      <Footer />
    </>
  )
}

export default Home;
