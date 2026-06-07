import { createContext, useContext, useState, type ReactNode } from 'react'
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

// Always inject token from localStorage on every request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// On 401, clear session and redirect to login — but only when a session exists
// and the failing request is not the login call itself (wrong-password returns 401 too).
axios.interceptors.response.use(
  res => res,
  err => {
    const url: string = err?.config?.url ?? ''
    const hasSession = !!localStorage.getItem('token')
    if (err?.response?.status === 401 && hasSession && !url.includes('/auth/login')) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token')
    const role  = localStorage.getItem('role')
    const username = localStorage.getItem('username')
    return { token, role, username }
  })

  async function login(username: string, password: string) {
    const { data } = await axios.post('/api/v1/auth/login', { username, password })
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('role', data.role)
    localStorage.setItem('username', username)
    setAuth({ token: data.accessToken, role: data.role, username })
  }

  function logout() {
    localStorage.clear()
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
