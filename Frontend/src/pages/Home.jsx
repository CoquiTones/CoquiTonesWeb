import React, { useState } from 'react';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import HeroSection from '../components/shared/HeroSection';
import InfoSection from '../components/HomePage/InfoSection';
import { homeObjOne, homeObjTwo, homeObjThree, homeObjFour } from '../components/HomePage/InfoData';
const Home = () => {

  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <Sidebar isOpen={isOpen} toggle={toggle} isHome={true} />
      <Navbar toggle={toggle} isHome={true} />
      <HeroSection />
      <InfoSection {...homeObjOne} />
      <InfoSection {...homeObjTwo} />
      <InfoSection {...homeObjThree} />
      <InfoSection {...homeObjFour} />
      <Footer />
    </>
  )
}

export default Home;
