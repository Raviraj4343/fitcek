import React from 'react'
import Brand from './Brand'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const baseItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' }
]

const authItems = [
  { to: '/daily', label: 'Daily Log' },
  { to: '/weight', label: 'Weight' },
  { to: '/foods', label: 'Foods' },
  { to: '/insights', label: 'Insights' },
]

export default function Sidebar({ isOpen = false, onClose }){
  const { user, logout } = useAuth() || {}

  const cls = ['sidebar']
  if (!isOpen) cls.push('closed')

  return (
    <aside className={cls.join(' ')} aria-hidden={!isOpen && window.innerWidth < 900}>
      <div className="brand"><Brand to="/" /></div>
      <nav className="nav">
        {baseItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={onClose}>
            {item.label}
          </NavLink>
        ))}

        {user && authItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={onClose}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <button className="btn-ghost" onClick={async()=>{ await logout() }}>Sign out</button>
          </div>
        ) : (
          <div className="muted">v0.1</div>
        )}
      </div>
    </aside>
  )
}
