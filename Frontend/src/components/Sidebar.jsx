import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' }
]

export default function Sidebar(){
  return (
    <aside className="sidebar">
      <div className="brand">AQTEV</div>
      <nav className="nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">v0.1</div>
    </aside>
  )
}
