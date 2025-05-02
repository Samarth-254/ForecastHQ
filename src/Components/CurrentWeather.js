import React from 'react'
import './CurrentWeather.css'
function CurrentWeather() {
  return (
    <div className='box'>
        <h2 style={{marginLeft:'10px',paddingTop:'30px'}}>Now</h2>
        <span className='temp'>20C</span>
    </div>
  )
}

export default CurrentWeather