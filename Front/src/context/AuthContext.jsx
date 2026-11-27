import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mz_ecom_user') || sessionStorage.getItem('mz_ecom_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mz_ecom_token') || sessionStorage.getItem('mz_ecom_token')
    if (!token) {
      setLoading(false)
      return
    }
    const storage = localStorage.getItem('mz_ecom_token') ? localStorage : sessionStorage
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user)
        storage.setItem('mz_ecom_user', JSON.stringify(res.data.user))
      })
      .catch(() => {
        localStorage.removeItem('mz_ecom_token')
        localStorage.removeItem('mz_ecom_user')
        sessionStorage.removeItem('mz_ecom_token')
        sessionStorage.removeItem('mz_ecom_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password, remember = true) {
    const res = await api.post('/auth/login', { email, password })
    const storage = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage
    other.removeItem('mz_ecom_token')
    other.removeItem('mz_ecom_user')
    storage.setItem('mz_ecom_token', res.data.token)
    storage.setItem('mz_ecom_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  async function register(payload) {
    const res = await api.post('/auth/register', payload)
    return res.data
  }

  async function verifyEmail(email, code) {
    const res = await api.post('/auth/verify-email', { email, code })
    return res.data
  }

  function logout() {
    localStorage.removeItem('mz_ecom_token')
    localStorage.removeItem('mz_ecom_user')
    sessionStorage.removeItem('mz_ecom_token')
    sessionStorage.removeItem('mz_ecom_user')
    setUser(null)
  }

  const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'DIRECTORA'))

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
