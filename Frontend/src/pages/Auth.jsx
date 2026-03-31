import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Auth(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  return (
    <div className="auth-root">
      <div className="auth-split">
        <div className="auth-panel auth-form">
          <div className="auth-brand">AQTEV</div>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to continue to your account.</p>

          <form className="auth-box" onSubmit={async e => {
            e.preventDefault()
            setError(null)
            setLoading(true)
            try{
              const res = await api.login({ email, password })
              // save access token (server also sets cookies)
              if(res?.data?.accessToken) api.saveToken(res.data.accessToken)
              setLoading(false)
              navigate('/dashboard')
            }catch(err){
              setLoading(false)
              setError(err.payload?.message || err.message || 'Login failed')
            }
          }}>
            <Input id="email" type="email" label="Email address" value={email} onChange={e=>setEmail(e.target.value)} required />
            <Input id="password" type="password" label="Password" value={password} onChange={e=>setPassword(e.target.value)} required />

            <div className="actions">
              <label className="checkbox"><input type="checkbox" /> Remember me</label>
              <Link to="/forgot" className="muted-link">Forgot?</Link>
            </div>

            {error && <div style={{color:'#b91c1c',marginBottom:8}}>{error}</div>}

            <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>

            <p className="muted small">Don't have an account? <Link to="/signup">Sign up</Link></p>
          </form>
        </div>

        <div className="auth-panel auth-visual">
          <div className="visual-gradient" aria-hidden></div>
          <div className="visual-copy">
            <h3>Built for teams</h3>
            <p>Insights and workflows to help your team move faster.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
