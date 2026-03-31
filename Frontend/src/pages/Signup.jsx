import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import api from '../utils/api'
import '../styles/global.css'
import Brand from '../components/Brand'
import VerificationModal from '../components/VerificationModal'

export default function Signup(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [showVerify, setShowVerify] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if(password !== confirm){ setError('Passwords do not match'); return }
    setLoading(true)
    try{
      const res = await api.signup({ name, email, password })
      setLoading(false)
      setError(null)
      // Show verification modal so user can paste token or resend
      setRegisteredEmail(res?.data?.email || email)
      setShowVerify(true)
    }catch(err){
      console.error('Signup error', err)
      setError(err.payload?.message || err.message || 'Signup failed')
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:480,padding:12}}>
        <h2>Create your account</h2>
        <p style={{color:'var(--color-muted)'}}>Start your free trial and explore <Brand textOnly inline />.</p>

        <form onSubmit={handleSubmit} style={{marginTop:16}}>
          <Input id="su-name" label="Full name" value={name} onChange={e=>setName(e.target.value)} required />
          <Input id="su-email" label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <Input id="su-password" label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <Input id="su-confirm" label="Confirm password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />

          {error && <div style={{color:'var(--color-danger)',marginTop:8}}>{error}</div>}

          <Button type="submit" className="btn-primary" style={{width:'100%',marginTop:12}} disabled={loading}>{loading ? 'Creating...' : 'Create account'}</Button>

          <p style={{fontSize:13,color:'var(--color-muted)',marginTop:12}}>Already have an account? <Link to="/signin">Sign in</Link></p>
        </form>
      </div>
      {showVerify && <VerificationModal email={registeredEmail} onClose={(ok)=>{ setShowVerify(false); if(ok) navigate('/signin') }} />}
    </div>
  )
}
