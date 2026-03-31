import React from 'react'
import Brand from './Brand'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const baseItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Overview and recent activity',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13.5h6V20H4v-6.5Zm10-9.5h6V20h-6V4Zm-10 0h6v6.5H4V4Z" />
      </svg>
    )
  },
  {
    to: '/profile',
    label: 'Profile',
    description: 'Personal details and goals',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      </svg>
    )
  }
]

const authItems = [
  {
    to: '/daily',
    label: 'Daily Log',
    description: 'Meals, vitals, and progress',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2Zm2 4v2h6V7H9Zm0 4v2h6v-2H9Z" />
      </svg>
    )
  },
  {
    to: '/weight',
    label: 'Weight',
    description: 'Logs and trends over time',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5a7 7 0 0 0-7 7v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a7 7 0 0 0-7-7Zm0 2a5 5 0 0 1 4.9 4H7.1A5 5 0 0 1 12 7Zm0 6a1.75 1.75 0 1 1-1.75 1.75A1.75 1.75 0 0 1 12 13Z" />
      </svg>
    )
  },
  {
    to: '/foods',
    label: 'Foods',
    description: 'Search and browse nutrition data',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3c1.1 0 2 .9 2 2v4a2 2 0 1 1-4 0V5c0-1.1.9-2 2-2Zm7 0h2v7a4 4 0 0 1-3 3.87V21h-2v-7.13A4 4 0 0 1 9 10V3h2v7a2 2 0 1 0 4 0V3Z" />
      </svg>
    )
  },
  {
    to: '/insights',
    label: 'Insights',
    description: 'Summaries and recommendations',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19h14v2H5v-2Zm1-3.5 3.5-3.5 2.5 2.5L17 9l1.5 1.5-6.5 6.5-2.5-2.5L7.5 17 6 15.5Z" />
      </svg>
    )
  }
]

export default function Sidebar({ isOpen = false, onClose }){
  const { user, logout } = useAuth() || {}
  const navigate = useNavigate()

  const cls = ['sidebar']
  if (!isOpen) cls.push('closed')

  const visibleItems = user ? [...baseItems, ...authItems] : baseItems

  return (
    <aside
      id="mobile-navigation"
      className={cls.join(' ')}
      aria-hidden={!isOpen}
      aria-label="Primary navigation"
      role="dialog"
      aria-modal="true"
    >
      <div className="sidebar-header">
        <div className="brand"><Brand to="/" /></div>
        <button
          type="button"
          className="sidebar-close"
          aria-label="Close menu"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6-5.6 5.6L5 17.6l5.6-5.6L5 6.4 6.4 5Z" />
          </svg>
        </button>
      </div>

      <div className="sidebar-body">
        <div className="sidebar-section-label">Navigation</div>
        <nav className="nav" role="navigation" aria-label="Main menu">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              onClick={onClose}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-copy">
                <span className="nav-item-label">{item.label}</span>
                <span className="nav-item-description">{item.description}</span>
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        {user ? (
          <div className="user-info" aria-label="Signed in account">
            <div className="user-meta">
              <div className="user-avatar" aria-hidden="true">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="user-avatar-image"
                  />
                ) : (
                  (user.name || user.email || 'U').trim().charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="user-name">{user.name}</div>
                {user.email ? <div className="user-email">{user.email}</div> : null}
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={async () => {
                await logout()
                onClose && onClose()
                navigate('/')
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="sidebar-guest-note">Sign in to access logging, tracking, and insights.</div>
        )}
      </div>
    </aside>
  )
}
