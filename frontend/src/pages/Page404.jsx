import { ThemeProvider } from '@emotion/react'
import React, { useState } from 'react'
import ErrorPic from '../components/assets/images/404Error.jpg'
import theme from "../components/shared/Theme";
import { CssBaseline } from '@mui/material'

const Page404 = () => {


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <img src={ErrorPic} alt={ErrorPic} justify-content='center' style={{ display: 'block', margin: '200px auto 0' }} />

    </ThemeProvider>
  )
}

export default Page404;
