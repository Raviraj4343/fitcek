import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Brand from './Brand'

export default function Navbar({ onToggleSidebar }){
  const { user, loading, logout } = useAuth() || {}

  return (
    <header className="topbar">
      <div className="container topbar-container">
        <div className="topbar-left">
          <div className="topbrand"><Brand to="/" /></div>
        </div>
        <div className="topbar-right">
          {!loading && user ? (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Link to="/profile" className="avatar">{user.name?.split(' ')[0] || user.name || 'ME'}</Link>
              <button className="btn-ghost" onClick={async()=>{ await logout() }}>Sign out</button>
            </div>
          ) : (
            <div style={{display:'flex',gap:8}}>
              <Link to="/signin" className="btn-ghost">Sign in</Link>
              <Link to="/signup" className="btn-primary">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
