import React, { useState } from 'react'
import ErrorPic from '../components/assets/images/404Error.jpg'

const Page404 = () => {


  return (
    <img src={ErrorPic} alt={ErrorPic} justify-content='center' style={{ display: 'block', margin: '200px auto 0' }} />
  )
}

export default Page404;
