import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/toast/ToastProvider'
import { apiFetch, apiRequestJson, getToken, setToken } from '../api'

export type AuthUser = {
  id?: string
  name: string
  email: string
  timezone?: string
  phoneVerified?: boolean
  phoneMasked?: string
}

type LoginResult =
  | { step: 'done' }
  | { step: 'otp'; email: string }
  | { step: 'complete_signup'; email: string }

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<LoginResult>
  verifyLoginOtp: (email: string, code: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<'needs_verify' | 'done'>
  verifyRegisterOtp: (email: string, code: string) => Promise<void>
  resendOtp: (email: string, purpose: 'register' | 'login') => Promise<void>
  logout: () => void
  ready: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('smm_user')
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const [user, setUser] = useState<AuthUser | null>(() => loadUser())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const token = getToken()
      if (!token) {
        setReady(true)
        return
      }

      try {
        const res = await apiFetch<{ user: AuthUser }>('/api/auth/me', { method: 'GET' })
        setUser(res.user)
        localStorage.setItem('smm_user', JSON.stringify(res.user))
      } catch {
        localStorage.removeItem('smm_token')
        localStorage.removeItem('smm_user')
        setUser(null)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password) => {
        const { ok, status, data } = await apiRequestJson<{
          message?: string
          needsOtp?: boolean
          email?: string
          token?: string
          user?: AuthUser
          needsPhoneVerification?: boolean
        }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
          withAuth: false,
        })

        if (status === 403 && data.needsPhoneVerification) {
          return { step: 'complete_signup', email: data.email ?? email }
        }

        if (ok && data.needsOtp && data.email) {
          return { step: 'otp', email: data.email }
        }

        if (ok && data.token && data.user) {
          setToken(data.token)
          setUser(data.user)
          localStorage.setItem('smm_user', JSON.stringify(data.user))
          toast({ type: 'success', title: 'Signed in', message: 'Welcome back.' })
          return { step: 'done' }
        }

        throw new Error(data.message ?? 'Login failed')
      },

      verifyLoginOtp: async (email, code) => {
        const { ok, data } = await apiRequestJson<{
          message?: string
          token?: string
          user?: AuthUser
        }>('/api/auth/login/verify-otp', {
          method: 'POST',
          body: { email, code },
          withAuth: false,
        })
        if (!ok || !data.token || !data.user) {
          throw new Error(data.message ?? 'Invalid code')
        }
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('smm_user', JSON.stringify(data.user))
        toast({ type: 'success', title: 'Verified', message: 'Signed in securely.' })
      },

      register: async (name, email, password, phone) => {
        const { ok, status, data } = await apiRequestJson<{
          message?: string
          needsPhoneVerification?: boolean
          email?: string
        }>('/api/auth/register', {
          method: 'POST',
          body: { name, email, password, phone },
          withAuth: false,
        })

        if (status === 201 && data.needsPhoneVerification) {
          return 'needs_verify'
        }

        if (!ok) throw new Error(data.message ?? 'Registration failed')

        return 'done'
      },

      verifyRegisterOtp: async (email, code) => {
        const { ok, data } = await apiRequestJson<{
          message?: string
          token?: string
          user?: AuthUser
        }>('/api/auth/verify-phone', {
          method: 'POST',
          body: { email, code },
          withAuth: false,
        })
        if (!ok || !data.token || !data.user) {
          throw new Error(data.message ?? 'Verification failed')
        }
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('smm_user', JSON.stringify(data.user))
        toast({
          type: 'success',
          title: 'Phone verified',
          message: 'Your account is ready.',
        })
      },

      resendOtp: async (email, purpose) => {
        const { ok, data } = await apiRequestJson<{ message?: string }>(
          '/api/auth/resend-otp',
          {
            method: 'POST',
            body: { email, purpose },
            withAuth: false,
          },
        )
        if (!ok) throw new Error(data.message ?? 'Could not resend code')
        toast({ type: 'info', title: 'Code sent', message: 'Check your phone.' })
      },

      logout: () => {
        setUser(null)
        localStorage.removeItem('smm_user')
        setToken(null)
        toast({ type: 'info', title: 'Signed out', message: 'See you soon.' })
      },
      ready,
    }),
    [user, ready, toast],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
