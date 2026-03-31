const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1'

async function request(path, { method = 'GET', body, token, headers = {} } = {}){
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    credentials: 'include'
  }
  if (body) init.body = JSON.stringify(body)
  if (token) init.headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, init)
  const data = await res.json().catch(()=>null)
  if (!res.ok) {
    const err = new Error(data?.message || 'Request failed')
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

// Auth
export function signup(payload){
  return request('/auth/signup', { method: 'POST', body: payload })
}

export function verifyEmail(token){
  return request(`/auth/verify-email?token=${encodeURIComponent(token)}`)
}

export function resendVerification(email){
  return request('/auth/resend-verification', { method: 'POST', body: { email } })
}

// Password reset
export function forgotPassword(email){
  return request('/auth/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(token, password){
  return request('/auth/reset-password', { method: 'POST', body: { token, password } })
}

export function login({ email, password }){
  return request('/auth/login', { method: 'POST', body: { email, password } })
}

export function logout(){
  return request('/auth/logout', { method: 'POST' })
}

export function refreshToken(){
  return request('/auth/refresh-token', { method: 'POST' })
}

export function getMe(token){
  return request('/auth/me', { method: 'GET', token })
}

// User / Profile
export function getProfile(){
  return request('/user/profile')
}

export function setupProfile(payload){
  return request('/user/profile', { method: 'POST', body: payload })
}

export function updateProfile(payload){
  return request('/user/profile', { method: 'PUT', body: payload })
}

export function getHealthStats(){
  return request('/user/stats')
}

// Daily Logs
export function getTodayLog(){
  return request('/dailyLog/today')
}

export function getHistoryLogs(){
  return request('/dailyLog/history')
}

export function createOrUpdateDailyLog(payload){
  return request('/dailyLog', { method: 'POST', body: payload })
}

export function getLogByDate(date){
  return request(`/dailyLog/${encodeURIComponent(date)}`)
}

export function updateMealSection(date, payload){
  return request(`/dailyLog/${encodeURIComponent(date)}/meal`, { method: 'PATCH', body: payload })
}

export function updateVitals(date, payload){
  return request(`/dailyLog/${encodeURIComponent(date)}/vitals`, { method: 'PATCH', body: payload })
}

// Weight logs
export function logWeight(payload){
  return request('/weightLog', { method: 'POST', body: payload })
}

export function getWeightHistory(query = {}){
  const qs = new URLSearchParams(query).toString()
  return request(`/weightLog/history${qs ? `?${qs}` : ''}`)
}

export function getWeeklyWeightSummary(){
  return request('/weightLog/weekly-summary')
}

export function deleteWeightLog(date){
  return request(`/weightLog/${encodeURIComponent(date)}`, { method: 'DELETE' })
}

// Food
export function searchFoods(q){
  return request(`/food/search?q=${encodeURIComponent(q)}`)
}

export function getFoodCategories(){
  return request('/food/categories')
}

export function getAllFoods(query = {}){
  const qs = new URLSearchParams(query).toString()
  return request(`/food${qs ? `?${qs}` : ''}`)
}

export function getFoodById(id){
  return request(`/food/${encodeURIComponent(id)}`)
}

// Insights
export function getTodayInsight(){
  return request('/insight/today')
}

export function getWeeklySummary(){
  return request('/insight/summary')
}

// Simple local token helpers (optional — backend uses cookies)
export function saveToken(token){
  try{ localStorage.setItem('aqtev_access', token) }catch{}
}

export function readToken(){
  try{ return localStorage.getItem('aqtev_access') }catch{ return null }
}

export function clearToken(){
  try{ localStorage.removeItem('aqtev_access') }catch{}
}

export default {
  request,
  // auth
  signup,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  login,
  logout,
  refreshToken,
  getMe,
  // user
  getProfile,
  setupProfile,
  updateProfile,
  getHealthStats,
  // daily
  getTodayLog,
  getHistoryLogs,
  createOrUpdateDailyLog,
  getLogByDate,
  updateMealSection,
  updateVitals,
  // weight
  logWeight,
  getWeightHistory,
  getWeeklyWeightSummary,
  deleteWeightLog,
  // food
  searchFoods,
  getFoodCategories,
  getAllFoods,
  getFoodById,
  // insight
  getTodayInsight,
  getWeeklySummary,
  // tokens
  saveToken,
  readToken,
  clearToken,
}
