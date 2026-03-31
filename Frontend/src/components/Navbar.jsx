import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar(){
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" aria-label="Toggle sidebar">☰</button>
        <div className="search">
          <input placeholder="Search..." />
        </div>
      </div>
      <div className="topbar-right">
        <Link to="/profile" className="avatar">RR</Link>
      </div>
    </header>
  )
}
