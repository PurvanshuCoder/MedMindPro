import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, Pill, Smartphone } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../services/auth/AuthProvider'
import { useToast } from '../components/toast/ToastProvider'

type Phase =
  | 'form'
  | 'otp-register'
  | 'otp-login'
  | 'complete-signup' /** login blocked until verify */

export function AuthPage() {
  const navigate = useNavigate()
  const {
    login,
    register,
    verifyLoginOtp,
    verifyRegisterOtp,
    resendOtp,
  } = useAuth()
  const toast = useToast()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [phase, setPhase] = useState<Phase>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      if (mode === 'login') {
        const result = await login(email, password)
        if (result.step === 'otp') {
          setPhase('otp-login')
          setOtp('')
          toast({
            type: 'info',
            title: 'Check your phone',
            message: 'Enter the code we sent by SMS.',
          })
        } else if (result.step === 'complete_signup') {
          setPhase('complete-signup')
          setOtp('')
          toast({
            type: 'info',
            title: 'Finish signup',
            message: 'Enter the SMS code from registration to verify your phone.',
          })
        } else {
          navigate('/dashboard')
        }
      } else {
        const r = await register(name, email, password, phone)
        if (r === 'needs_verify') {
          setPhase('otp-register')
          setOtp('')
          toast({
            type: 'success',
            title: 'Code sent',
            message: 'Enter the SMS code to verify your number.',
          })
        } else {
          navigate('/dashboard')
        }
      }
    } catch (e) {
      toast({
        type: 'error',
        title: mode === 'login' ? 'Login failed' : 'Registration failed',
        message: e instanceof Error ? e.message : 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function onVerifyRegister() {
    if (loading || !otp.trim()) return
    setLoading(true)
    try {
      await verifyRegisterOtp(email, otp.trim())
      navigate('/dashboard')
    } catch (e) {
      toast({
        type: 'error',
        title: 'Verification failed',
        message: e instanceof Error ? e.message : 'Try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function onVerifyLogin() {
    if (loading || !otp.trim()) return
    setLoading(true)
    try {
      await verifyLoginOtp(email, otp.trim())
      navigate('/dashboard')
    } catch (e) {
      toast({
        type: 'error',
        title: 'Invalid code',
        message: e instanceof Error ? e.message : 'Try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function onResend(purpose: 'register' | 'login') {
    if (loading || !email.trim()) return
    setLoading(true)
    try {
      await resendOtp(email.trim(), purpose)
    } catch (e) {
      toast({
        type: 'error',
        title: 'Resend failed',
        message: e instanceof Error ? e.message : 'Wait and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const showOtp =
    phase === 'otp-register' || phase === 'otp-login' || phase === 'complete-signup'

  return (
    <div
      className="min-h-dvh p-4 sm:p-6"
      style={{ background: 'var(--mm-bg)' }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 pt-8 sm:pt-12">
        <div className="text-center sm:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
            <Pill className="h-7 w-7 text-[var(--mm-primary)]" />
          </div>
          <h1 className="mm-gradient-title text-2xl font-bold sm:text-3xl">
            MedMind Pro
          </h1>
          <p className="mt-1 text-sm text-[var(--mm-muted)]">
            {showOtp
              ? 'Verify your mobile number (SMS)'
              : mode === 'login'
                ? 'Sign in to continue'
                : 'Create your account'}
          </p>
        </div>

        <Card className="mm-panel p-5 sm:p-6">
          {!showOtp ? (
            <form className="space-y-4" onSubmit={onSubmitForm}>
              {mode === 'register' ? (
                <TextField
                  label="Full name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sarah Johnson"
                  autoComplete="name"
                />
              ) : null}

              <TextField
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              {mode === 'register' ? (
                <TextField
                  label="Mobile (WhatsApp / SMS)"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  autoComplete="tel"
                  hint="Include country code, e.g. +91… or +1… Used for login codes and WhatsApp reminders."
                />
              ) : null}

              <TextField
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />

              <Button
                className="w-full"
                disabled={
                  loading ||
                  !email ||
                  !password ||
                  (mode === 'register' && (!name.trim() || !phone.trim()))
                }
                type="submit"
                leftIcon={
                  loading ? <LoadingSpinner className="mr-1" /> : undefined
                }
              >
                {loading
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Continue'
                    : 'Create account'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === 'login' ? 'register' : 'login'))
                  setPhase('form')
                }}
                className="w-full rounded-full bg-[#f6fafd] p-3 text-center text-xs font-semibold text-[var(--mm-primary)] ring-1 ring-[#ccddee] transition-all duration-200 hover:bg-[#e8f2fa] active:scale-[0.99]"
              >
                {mode === 'login'
                  ? 'New here? Create an account'
                  : 'Already have an account? Sign in'}
              </button>

              <div className="flex flex-col gap-2 text-xs text-[var(--mm-muted)] sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 shrink-0" />
                  SMS verification
                </span>
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                  2-step sign-in
                </span>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <TextField
                label="Email"
                name="email-otp"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={phase === 'otp-login'}
              />
              <TextField
                label="6-digit SMS code"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="••••••"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="w-full"
                  disabled={loading || otp.trim().length < 6}
                  onClick={() => {
                    if (phase === 'otp-login') void onVerifyLogin()
                    else void onVerifyRegister()
                  }}
                  leftIcon={
                    loading ? <LoadingSpinner className="mr-1" /> : undefined
                  }
                >
                  Verify & continue
                </Button>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                type="button"
                disabled={loading || !email.trim()}
                onClick={() =>
                  onResend(
                    phase === 'otp-login' ? 'login' : 'register',
                  )
                }
              >
                Resend SMS code
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-[var(--mm-muted)] hover:text-[var(--mm-primary)]"
                onClick={() => {
                  setPhase('form')
                  setOtp('')
                }}
              >
                Back
              </button>
            </div>
          )}
        </Card>

        {!showOtp ? (
          <div className="flex justify-center text-xs text-[var(--mm-muted)]">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Reminder updates can be sent to WhatsApp after you save schedules.
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
