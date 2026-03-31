import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Brand from './Brand'
export default function Navbar(){
  const { user, loading, logout } = useAuth() || {}
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async ()=>{
    try{ await logout() }catch(e){}
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="topbar">
      <div className="container topbar-container">
        <div className="topbar-left">
          <div className="topbrand"><Brand to="/" /></div>
        </div>

        <div className="topbar-right">
          {!loading && !user && (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Link to="/signin" className="nav-auth-link">Sign in</Link>
              <Link to="/signup" className="btn-primary" style={{marginLeft:6,padding:'10px 14px'}}>Sign up</Link>
            </div>
          )}

          {!loading && user && (
            <div>
              <button aria-label="Open menu" className="btn-ghost" onClick={()=>setOpen(s=>!s)} style={{fontSize:18}}>
                ☰
              </button>

              {open && (
                <div className="right-drawer" role="dialog" aria-modal="true">
                  <div style={{padding:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <strong>{user.name?.split(' ')[0] || 'Me'}</strong>
                      <button className="btn-ghost" onClick={()=>setOpen(false)}>✕</button>
                    </div>

                    <nav style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
                      <Link to="/dashboard" onClick={()=>setOpen(false)}>Dashboard</Link>
                      <Link to="/profile" onClick={()=>setOpen(false)}>Profile</Link>
                      <button className="btn-ghost" onClick={handleLogout} style={{textAlign:'left'}}>Logout</button>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
