import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Forgot(){
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try{
      await api.forgotPassword(email)
      setMessage('If an account with that email exists, a password reset link has been sent.')
    }catch(err){
      setError(err.payload?.message || err.message || 'Failed to send reset email')
    }finally{ setLoading(false) }
  }

  return (
    <div style={{minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:420,padding:12}}>
        <h2>Forgot password</h2>
        <p style={{color:'var(--color-muted)'}}>Enter your account email and we'll send a reset link.</p>

        <form onSubmit={handleSubmit} style={{marginTop:16}}>
          <Input id="fp-email" label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />

          {error && <div style={{color:'var(--color-danger)', marginTop:8}}>{error}</div>}
          {message && <div style={{color:'var(--color-success)', marginTop:8}}>{message}</div>}

          <Button type="submit" className="btn-primary" style={{width:'100%',marginTop:16}} disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</Button>

          <p style={{fontSize:13,color:'var(--color-muted)',marginTop:12}}>Remembered? <Link to="/signin">Sign in</Link></p>
        </form>
      </div>
    </div>
  )
}
