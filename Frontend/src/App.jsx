import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Auth from './pages/Auth'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import Signup from './pages/Signup'
import DesignSystem from './pages/DesignSystem'
import Forgot from './pages/Forgot'
import ResetPassword from './pages/ResetPassword'
import DailyLog from './pages/DailyLog'
import Weight from './pages/Weight'
import Foods from './pages/Foods'
import Insights from './pages/Insights'

export default function App(){
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/daily" element={<DailyLog />} />
        <Route path="/weight" element={<Weight />} />
        <Route path="/foods" element={<Foods />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/design" element={<DesignSystem />} />
      </Routes>
    </Layout>
  )
}
