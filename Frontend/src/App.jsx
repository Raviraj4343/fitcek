import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Auth from './pages/Auth'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import Signup from './pages/Signup'
import DesignSystem from './pages/DesignSystem'
import Forgot from './pages/Forgot'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import DailyLog from './pages/DailyLog'
import Weight from './pages/Weight'
import Foods from './pages/Foods'
import Insights from './pages/Insights'
import Guide from './pages/Guide'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App(){
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    try{
      const seen = localStorage.getItem('aqtev_seen')
      if(!seen && location.pathname === '/'){
        localStorage.setItem('aqtev_seen', '1')
        navigate('/signin', { replace: true })
      }
    }catch(e){/* ignore */}
  }, [location.pathname, navigate])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/daily" element={<RequireAuth><DailyLog /></RequireAuth>} />
        <Route path="/weight" element={<RequireAuth><Weight /></RequireAuth>} />
        <Route path="/foods" element={<RequireAuth><Foods /></RequireAuth>} />
        <Route path="/insights" element={<RequireAuth><Insights /></RequireAuth>} />
        <Route path="/guide" element={<RequireAuth><Guide /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/design" element={<DesignSystem />} />
      </Routes>
    </Layout>
  )
}
