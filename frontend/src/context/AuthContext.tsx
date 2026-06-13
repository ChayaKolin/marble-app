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

// The customer portal (/portal/*) authenticates with its own JWT (`portal_token`),
// completely separate from the internal user's `token`. A Consultant who opens a
// portal magic link in the same browser still has `token` in localStorage, so the
// active route decides which credential to attach — otherwise the internal JWT
// would override the customer's and every portal API call would come back 403.
function isPortalContext() {
  return window.location.pathname.startsWith('/portal')
}

// Always inject the appropriate token from localStorage on every request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem(isPortalContext() ? 'portal_token' : 'token')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  } else {
    config.headers.delete('Authorization')
  }
  return config
})

// On 401, clear the relevant session and redirect — but only when that session
// exists and the failing request is not an auth call itself (wrong-credentials
// also return 401).
axios.interceptors.response.use(
  res => res,
  err => {
    const url: string = err?.config?.url ?? ''
    if (err?.response?.status !== 401) return Promise.reject(err)

    if (isPortalContext()) {
      if (localStorage.getItem('portal_token') && !url.includes('/portal/auth/verify')) {
        localStorage.removeItem('portal_token')
        window.location.href = '/portal/auth'
      }
    } else if (localStorage.getItem('token') && !url.includes('/auth/login')) {
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
