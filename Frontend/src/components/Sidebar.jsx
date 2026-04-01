import React from 'react'
import Brand from './Brand'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ConfirmationModal from './ConfirmationModal'
import * as api from '../utils/api'

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
    to: '/guide',
    label: 'Guide',
    description: 'Personalized health report',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Zm2 4v2h8V8H8Zm0 4v2h5v-2H8Z" />
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

export default function Sidebar({ isOpen = false, onClose }){
  const { user, logout } = useAuth() || {}
  const navigate = useNavigate()
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false)
  const [showLiveModal, setShowLiveModal] = React.useState(false)
  const [liveInput, setLiveInput] = React.useState('')
  const [chatMessages, setChatMessages] = React.useState([])
  const [liveLoading, setLiveLoading] = React.useState(false)
  const [liveError, setLiveError] = React.useState('')
  const chatEndRef = React.useRef(null)

  const cls = ['sidebar']
  if (!isOpen) cls.push('closed')

  const visibleItems = user ? [...baseItems, ...authItems] : baseItems

  React.useEffect(() => {
    if (!isOpen) {
      setShowLiveModal(false)
      setLiveInput('')
      setChatMessages([])
      setLiveError('')
    }
  }, [isOpen])

  React.useEffect(() => {
    if (showLiveModal) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [chatMessages, showLiveModal, liveLoading])

  const handleGetLiveSuggestion = async () => {
    const prompt = liveInput.trim()
    if (!prompt) {
      setLiveError('Please type your question first.')
      return
    }
    if (liveLoading) return

    const history = chatMessages
      .slice(-12)
      .map((message) => ({ role: message.role, content: message.content }))

    setChatMessages((prev) => ([...prev, { id: Date.now(), role: 'user', content: prompt }]))
    setLiveInput('')

    setLiveLoading(true)
    setLiveError('')

    try {
      const res = await api.getGuideLiveSuggestion({ prompt, goal: user?.goal, history })
      const reply = String(res?.data?.reply || '').trim()
      if (!reply) throw new Error('Empty reply from assistant.')
      setChatMessages((prev) => ([...prev, { id: Date.now() + 1, role: 'assistant', content: reply }]))
    } catch (err) {
      const message = String(err?.payload?.message || err?.message || 'Unable to get suggestion right now.')
      setLiveError(message.length > 220 ? `${message.slice(0, 220)}...` : message)
    } finally {
      setLiveLoading(false)
    }
  }

  const handleNewChat = () => {
    setLiveInput('')
    setChatMessages([])
    setLiveError('')
  }

  return (
    <>
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

          {user ? (
            <button
              type="button"
              className="nav-item sidebar-live-trigger"
              onClick={() => setShowLiveModal(true)}
            >
              <span className="nav-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V5Zm4 3v2h8V8H8Zm0 4v2h6v-2H8Z" />
                </svg>
              </span>
              <span className="nav-item-copy">
                <span className="nav-item-label">Live Suggestion</span>
                <span className="nav-item-description">Open chatbot prompt popup</span>
              </span>
            </button>
          ) : null}
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
                onClick={() => setShowSignOutConfirm(true)}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="sidebar-guest-note">Sign in to access logging, tracking, and insights.</div>
          )}
        </div>
      </aside>

      <ConfirmationModal
        open={showSignOutConfirm}
        tone="danger"
        eyebrow="Secure Exit"
        title="Sign out of your account?"
        description="You'll be returned to the home page and can sign back in anytime."
        confirmLabel="Sign out"
        cancelLabel="Stay here"
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          setShowSignOutConfirm(false)
          await logout()
          onClose && onClose()
          navigate('/')
        }}
      />

      {showLiveModal ? (
        <div className="sidebar-live-modal-backdrop" onClick={() => setShowLiveModal(false)}>
          <div
            className="sidebar-live-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-live-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="sidebar-live-modal-close"
              aria-label="Close live suggestion"
              onClick={() => setShowLiveModal(false)}
            >
              x
            </button>
            <h3 id="sidebar-live-modal-title">Live Suggestion</h3>
            <p className="muted">Mini chat with temporary session context only.</p>

            <div className="sidebar-live-head-row">
              <button type="button" className="btn-ghost sidebar-live-new" onClick={handleNewChat}>New chat</button>
            </div>

            {liveError ? <div className="sidebar-live-error">{liveError}</div> : null}

            <div className="sidebar-chat-thread" role="log" aria-live="polite">
              {!chatMessages.length ? (
                <div className="sidebar-chat-empty">Ask about budget meals, macros, workouts, or sleep.</div>
              ) : null}

              {chatMessages.map((message) => (
                <div key={message.id} className={`sidebar-chat-bubble ${message.role === 'assistant' ? 'bot' : 'user'}`}>
                  <strong>{message.role === 'assistant' ? 'AQTEV Coach' : 'You'}</strong>
                  {message.role === 'assistant' ? <pre>{message.content}</pre> : <p>{message.content}</p>}
                </div>
              ))}

              {liveLoading ? (
                <div className="sidebar-chat-bubble bot sidebar-chat-typing">
                  <strong>AQTEV Coach</strong>
                  <p>Thinking...</p>
                </div>
              ) : null}

              <div ref={chatEndRef} />
            </div>

            <div className="sidebar-chat-compose">
              <textarea
                className="sidebar-live-input"
                placeholder="Send a message..."
                value={liveInput}
                onChange={(event) => {
                  setLiveInput(event.target.value)
                  if (liveError) setLiveError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleGetLiveSuggestion()
                  }
                }}
                rows={2}
              />

              <button
                type="button"
                className="btn-primary sidebar-live-btn"
                onClick={handleGetLiveSuggestion}
                disabled={liveLoading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
