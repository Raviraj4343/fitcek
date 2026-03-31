import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import '../styles/global.css'
import Brand from '../components/Brand'
import VerificationModal from '../components/VerificationModal'

export default function SignIn(){
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showResend, setShowResend] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [showVerify, setShowVerify] = useState(false)
  const [verifyEmailAddr, setVerifyEmailAddr] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    setLoading(true)
    try{
      const res = await auth.login({ email, password })
      setLoading(false)
      navigate('/dashboard')
    }catch(err){
      setLoading(false)
      // If backend indicates email not verified, show helpful message and offer resend
      const status = err.status || err.payload?.statusCode
      if(status === 403 || (err.payload && /verify/i.test(err.payload.message || ''))){
        setError(null)
        // show verification modal prefilled with email
        setVerifyEmailAddr(email)
        setShowVerify(true)
      } else {
        setError(err.payload?.message || err.message || 'Sign in failed')
      }
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:420,padding:12}}>
        <h2>Sign in to <Brand textOnly inline /></h2>
        <p style={{color:'var(--color-muted)'}}>Enter your credentials to access your dashboard.</p>

        <form onSubmit={handleSubmit} style={{marginTop:16}}>
          <Input id="si-email" label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <Input id="si-password" label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

          {error && <div style={{color: 'var(--color-danger)', marginTop:8}}>{error}</div>}

          {showVerify && (
            <VerificationModal email={verifyEmailAddr} onClose={(ok)=>{ setShowVerify(false); if(ok) navigate('/signin') }} />
          )}

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
            <label style={{color:'var(--color-muted)',fontSize:13}}><input type="checkbox"/> Remember me</label>
            <Link to="/forgot" style={{color:'var(--color-primary)'}}>Forgot?</Link>
          </div>

          <Button type="submit" className="btn-primary" style={{width:'100%',marginTop:16}} disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>

          <p style={{fontSize:13,color:'var(--color-muted)',marginTop:12}}>Don't have an account? <Link to="/signup">Create account</Link></p>
        </form>
      </div>
    </div>
  )
}
