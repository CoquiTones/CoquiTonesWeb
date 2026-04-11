import React, { useState } from 'react';
import Footer from '../components/shared/Footer';
import HeroSection from '../components/shared/HeroSection';
import InfoSection from '../components/shared/InfoSection';
import { dashboardData, NetworkMonitorData, ClassifierData, SpectralAnalysisData } from '../components/shared/InfoData';
import ErrorAlerts from '../components/shared/ErrorAlerts';
const Home = () => {

  const [errors, setErrors] = useState([]);


  return (
    <>
      <ErrorAlerts errors={errors} setErrors={setErrors} />
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
