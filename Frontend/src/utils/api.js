const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const API_BASE = import.meta.env.VITE_API_BASE || (isLocalHost ? 'http://localhost:8000/api/v1' : '')
const REQUEST_TIMEOUT_MS = 15000
const MEMO_TTL_MS = 2 * 60 * 1000
const memoCache = new Map()

const memoGet = (key) => {
  const entry = memoCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > MEMO_TTL_MS) {
    memoCache.delete(key)
    return null
  }
  return entry.value
}

const memoSet = (key, value) => {
  memoCache.set(key, { ts: Date.now(), value })
}

const getApiOrigin = () => {
  try {
    return new URL(getApiBase()).origin
  } catch {
    return ''
  }
}

function getApiBase(){
  if (API_BASE) return API_BASE

  throw new Error('Frontend API is not configured. Set VITE_API_BASE in your Vercel project environment variables.')
}

export function resolveMediaUrl(value){
  if (!value) return value

  const raw = String(value).trim()
  if (!raw) return raw

  if (/^https:\/\/res\.cloudinary\.com\//i.test(raw)) return raw

  const apiOrigin = getApiOrigin()

  if (raw.startsWith('/')) {
    return apiOrigin ? `${apiOrigin}${raw}` : raw
  }

  try {
    const parsed = new URL(raw)
    const isLocalAssetHost = ['localhost', '127.0.0.1'].includes(parsed.hostname)

    if (isLocalAssetHost && apiOrigin) {
      return `${apiOrigin}${parsed.pathname}${parsed.search || ''}`
    }

    return raw
  } catch {
    return apiOrigin ? `${apiOrigin}/${raw.replace(/^\/+/, '')}` : raw
  }
}

export function normalizeUser(user){
  if (!user || typeof user !== 'object') return user
  return {
    ...user,
    avatarUrl: resolveMediaUrl(user.avatarUrl)
  }
}

async function request(path, { method = 'GET', body, token, headers = {} } = {}){
  const apiBase = getApiBase()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    credentials: 'include',
    signal: controller.signal
  }
  // If no explicit token provided, try reading a saved access token from localStorage
  if (!token) {
    try{
      const stored = localStorage.getItem('aqtev_access')
      if (stored) token = stored
    }catch{}
  }
  if (body) init.body = JSON.stringify(body)
  if (token) init.headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${apiBase}${path}`, init)
    const data = await res.json().catch(()=>null)
    if (!res.ok) {
      const err = new Error(data?.message || 'Request failed')
      err.status = res.status
      err.payload = data
      throw err
    }
    return data
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please try again.')
      timeoutError.status = 408
      throw timeoutError
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// Auth
export function signup(payload){
  return request('/auth/signup', { method: 'POST', body: payload })
}

export function verifyEmail(token){
  return request(`/auth/verify-email?token=${encodeURIComponent(token)}`)
}

export function verifyCode(email, code){
  return request('/auth/verify-code', { method: 'POST', body: { email, code } })
}

export function resendVerification(email){
  return request('/auth/resend-verification', { method: 'POST', body: { email } })
}

// Password reset
export function forgotPassword(email){
  return request('/auth/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(token, password){
  // backend expects `token` and `newPassword` fields
  return request('/auth/reset-password', { method: 'POST', body: { token, newPassword: password } })
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
  return request('/auth/me', { method: 'GET', token }).then((res) => ({
    ...res,
    data: normalizeUser(res?.data)
  }))
}

// User / Profile
export function getProfile(){
  return request('/user/profile').then((res) => ({
    ...res,
    data: normalizeUser(res?.data)
  }))
}

export function uploadAvatar(file){
  const apiBase = getApiBase()
  const form = new FormData()
  form.append('avatar', file)
  const token = readToken()
  const headers = {}

  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(`${apiBase}/user/profile/avatar`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers
  }).then(async res => {
    const data = await res.json().catch(()=>null)
    if(!res.ok){
      const err = new Error(data?.message || 'Upload failed')
      err.status = res.status
      err.payload = data
      throw err
    }
    return {
      ...data,
      data: normalizeUser(data?.data)
    }
  })
}

export function setupProfile(payload){
  return request('/user/profile', { method: 'POST', body: payload }).then((res) => ({
    ...res,
    data: normalizeUser(res?.data)
  }))
}

export function updateProfile(payload){
  return request('/user/profile', { method: 'PUT', body: payload }).then((res) => ({
    ...res,
    data: normalizeUser(res?.data)
  }))
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
  const key = 'food:categories'
  const cached = memoGet(key)
  if (cached) return Promise.resolve(cached)
  return request('/food/categories').then((res) => {
    memoSet(key, res)
    return res
  })
}

export function getAllFoods(query = {}){
  const cacheKey = `food:all:${JSON.stringify(query || {})}`
  const cached = memoGet(cacheKey)
  if (cached) return Promise.resolve(cached)
  const qs = new URLSearchParams(query).toString()
  return request(`/food${qs ? `?${qs}` : ''}`).then((res) => {
    memoSet(cacheKey, res)
    return res
  })
}

export function getFoodById(id){
  return request(`/food/${encodeURIComponent(id)}`)
}

export function getBoostFoods({ nutrient, diet, limit = 6 }){
  const query = new URLSearchParams({ nutrient, limit: String(limit) })
  if (diet) query.set('diet', diet)
  return request(`/food/boost?${query.toString()}`)
}

// Insights
export function getTodayInsight(){
  return request('/insight/today')
}

export function getWeeklySummary(){
  return request('/insight/summary')
}

export function getGuideActionPlan(payload = {}){
  return request('/insight/action-plan', { method: 'POST', body: payload })
}

export function getGuideLiveSuggestion(payload = {}){
  const body = payload || {}
  const toReplyText = (plan = {}) => {
    const actionPlan = Array.isArray(plan?.actionPlan) ? plan.actionPlan : []
    const riskFlags = Array.isArray(plan?.riskFlags) ? plan.riskFlags : []
    const nutritionFocus = Array.isArray(plan?.nutritionFocus) ? plan.nutritionFocus : []
    const trainingFocus = Array.isArray(plan?.trainingFocus) ? plan.trainingFocus : []
    const recoveryFocus = Array.isArray(plan?.recoveryFocus) ? plan.recoveryFocus : []

    const lines = []
    if (actionPlan.length) {
      lines.push('Action plan:')
      actionPlan.slice(0, 3).forEach((item) => lines.push(`- ${String(item)}`))
    }
    if (nutritionFocus[0]) lines.push(`Nutrition focus: ${String(nutritionFocus[0])}`)
    if (trainingFocus[0]) lines.push(`Training focus: ${String(trainingFocus[0])}`)
    if (recoveryFocus[0]) lines.push(`Recovery focus: ${String(recoveryFocus[0])}`)
    if (riskFlags[0]) lines.push(`Risk flag: ${String(riskFlags[0])}`)
    return lines.join('\n').trim()
  }

  return request('/insight/live-suggestion', { method: 'POST', body })
    .catch(async (err) => {
      const routeMissing = err?.status === 404
      if (!routeMissing) throw err

      // Backward compatibility: some deployed backends may still use camelCase route.
      try {
        return await request('/insight/liveSuggestion', { method: 'POST', body })
      } catch (legacyErr) {
        if (legacyErr?.status !== 404) throw legacyErr

        // Last-resort compatibility: convert action-plan payload into chat-like reply text.
        const fallbackRes = await request('/insight/action-plan', {
          method: 'POST',
          body: {
            goal: body?.goal
          }
        })

        return {
          success: true,
          data: {
            reply: toReplyText(fallbackRes?.data?.plan || {}),
            source: 'action-plan-fallback'
          }
        }
      }
    })
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
  verifyCode,
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
  getBoostFoods,
  // insight
  getTodayInsight,
  getWeeklySummary,
  getGuideActionPlan,
  getGuideLiveSuggestion,
  // tokens
  saveToken,
  readToken,
  clearToken,
}
