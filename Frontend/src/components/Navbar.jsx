import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Brand from './Brand'
import { useAuth } from '../contexts/AuthContext'

const PUBLIC_PATHS = ['/', '/signin', '/signup', '/auth', '/forgot', '/reset-password']

export default function Navbar({ isSidebarOpen = false, onToggleSidebar }){
  const { pathname } = useLocation()
  const { user } = useAuth() || {}
  const showAuthLinks = !user && PUBLIC_PATHS.includes(pathname)

  return (
    <header className="topbar">
      <div className="container topbar-container">
        <div className="topbar-left">
          <div className="topbrand"><Brand to="/" /></div>
        </div>

        <div className="topbar-right">
          {showAuthLinks ? (
            <>
              <Link to="/signin" className="nav-auth-link">Sign in</Link>
              <Link to="/signup" className="btn-primary" style={{ marginTop: 0, padding: '10px 14px' }}>Sign up</Link>
            </>
          ) : (
            <button
              type="button"
              aria-label="Open menu"
              aria-controls="mobile-navigation"
              aria-haspopup="dialog"
              aria-expanded={isSidebarOpen}
              className="menu-btn"
              onClick={onToggleSidebar}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16v2H4V7Zm0 6h16v2H4v-2Zm0 6h16v2H4v-2Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
