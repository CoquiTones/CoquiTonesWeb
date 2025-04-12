import { ThemeProvider } from '@emotion/react'
import React, { useState } from 'react'
import Navbar from '../components/shared/Navbar'
import Sidebar from '../components/shared/Sidebar'
import ErrorPic from '../components/assets/images/404Error.jpg'
import theme from "../components/shared/Theme";
import { CssBaseline } from '@mui/material'

const Page404 = () => {

  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Sidebar isOpen={isOpen} toggle={toggle} />
      <Navbar toggle={toggle} />
      <img src={ErrorPic} alt={ErrorPic} justify-content='center' style={{ display: 'block', margin: '200px auto 0' }} />

    </ThemeProvider>
  )
}

export default Page404;
