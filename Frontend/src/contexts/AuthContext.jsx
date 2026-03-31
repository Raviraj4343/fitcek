import React, { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try{
      const res = await api.getMe()
      setUser(res?.data || null)
    }catch(err){
      setUser(null)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const login = async (payload)=>{
    const res = await api.login(payload)
    await load()
    return res
  }

  const logout = async ()=>{
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh: load }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}

export default AuthContext
