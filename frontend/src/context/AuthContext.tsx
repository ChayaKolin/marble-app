import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import axios from 'axios'

interface AuthState {
  token: string | null
  role: string | null
  username: string | null
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token')
    const role  = localStorage.getItem('role')
    const username = localStorage.getItem('username')
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    return { token, role, username }
  })

  async function login(username: string, password: string) {
    const { data } = await axios.post('/api/v1/auth/login', { username, password })
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('role', data.role)
    localStorage.setItem('username', username)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
    setAuth({ token: data.accessToken, role: data.role, username })
  }

  function logout() {
    localStorage.clear()
    delete axios.defaults.headers.common['Authorization']
    setAuth({ token: null, role: null, username: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
