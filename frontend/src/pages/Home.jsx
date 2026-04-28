import React, { useState, useContext } from 'react';
import Footer from '../components/shared/Footer';
import HeroSection from '../components/shared/HeroSection';
import InfoSection from '../components/shared/InfoSection';
import { dashboardData, NetworkMonitorData, ClassifierData, SpectralAnalysisData } from '../components/shared/InfoData';
import ErrorAlerts from '../components/shared/ErrorAlerts';
import { ErrorContext } from '../components/shared/ErrorContext';
const Home = () => {

  const { errors, setErrors } = useContext(ErrorContext);



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
