import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function ResetPassword(){
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()
  const { search } = useLocation()
  const [token, setToken] = useState('')

  useEffect(()=>{
    const q = new URLSearchParams(search)
    const t = q.get('token') || ''
    setToken(t)
  }, [search])

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!token) return setError('Missing token')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try{
      await api.resetPassword(token, password)
      setMessage('Password reset successful — you can now sign in.')
      setTimeout(()=>navigate('/signin'), 1500)
    }catch(err){
      setError(err.payload?.message || err.message || 'Failed to reset password')
    }finally{ setLoading(false) }
  }

  return (
    <div style={{minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:420,padding:12}}>
        <h2>Reset password</h2>
        <p style={{color:'var(--color-muted)'}}>Set a new password for your account.</p>

        <form onSubmit={handleSubmit} style={{marginTop:16}}>
          <Input id="rp-password" label="New password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <Input id="rp-confirm" label="Confirm password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />

          {error && <div style={{color:'var(--color-danger)', marginTop:8}}>{error}</div>}
          {message && <div style={{color:'var(--color-success)', marginTop:8}}>{message}</div>}

          <Button type="submit" className="btn-primary" style={{width:'100%',marginTop:16}} disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</Button>

          <p style={{fontSize:13,color:'var(--color-muted)',marginTop:12}}>Back to <Link to="/signin">Sign in</Link></p>
        </form>
      </div>
    </div>
  )
}
