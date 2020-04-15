import React, { useState, useEffect } from 'react'
import './Loader.scss'

const Loader = ({ text: text }) => {
  return (
    <div className="loading-component text-center">
      <div className="spinner-grow" role="status">
        <span className="sr-only">{ text }</span>
      </div>
      <h5 className="text-primary">{ text }</h5>
    </div>
  )
}

export default Loader