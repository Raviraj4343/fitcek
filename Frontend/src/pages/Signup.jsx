import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import '../styles/global.css'

export default function Signup(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if(password !== confirm){ setError('Passwords do not match'); return }
    setLoading(true)
    // TODO: call signup API; placeholder flow
    setTimeout(()=>{ setLoading(false); navigate('/dashboard') }, 700)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:480}}>
        <h2>Create your account</h2>
        <p style={{color:'var(--color-muted)'}}>Start your free trial and explore AQTEV.</p>

        <form onSubmit={handleSubmit} style={{marginTop:16}}>
          <Input id="su-name" label="Full name" value={name} onChange={e=>setName(e.target.value)} required />
          <Input id="su-email" label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <Input id="su-password" label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <Input id="su-confirm" label="Confirm password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />

          {error && <div style={{color:'var(--color-danger)',marginTop:8}}>{error}</div>}

          <Button type="submit" style={{width:'100%',marginTop:12}} disabled={loading}>{loading ? 'Creating...' : 'Create account'}</Button>

          <p style={{fontSize:13,color:'var(--color-muted)',marginTop:12}}>Already have an account? <Link to="/signin">Sign in</Link></p>
        </form>
      </div>
    </div>
  )
}
