import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Modes: 'signin' | 'signup' | 'forgot' | 'sent' | 'reset' | 'check-email'
export const LoginPage = ({ onSignIn, onSignUp, onResetPassword, onUpdatePassword, loading, forceMode }) => {
  // Detect if URL has password recovery token (Supabase appends ?type=recovery in hash)
  const isRecovery = typeof window !== 'undefined' &&
    (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery'))

  const [mode, setMode] = useState(forceMode || (isRecovery ? 'reset' : 'signin'))

  // If parent forces a mode (e.g. PASSWORD_RECOVERY event), honor it
  useEffect(() => {
    if (forceMode) setMode(forceMode)
  }, [forceMode])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    setError('')
    setSuccessMsg('')
  }, [mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    const trimmedEmail = email.trim().toLowerCase()

    if (mode === 'signin') {
      if (!trimmedEmail || !password) {
        setError('Please enter your email and password')
        return
      }
      setSubmitting(true)
      try {
        await onSignIn(trimmedEmail, password)
        // Success: app will redirect on auth state change
      } catch (err) {
        setError(prettifyError(err))
      } finally {
        setSubmitting(false)
      }
    }

    else if (mode === 'signup') {
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setError('Please enter a valid email address')
        return
      }
      if (!fullName.trim()) {
        setError('Please enter your name')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      setSubmitting(true)
      try {
        await onSignUp(trimmedEmail, password, fullName.trim())
        setMode('check-email')
      } catch (err) {
        setError(prettifyError(err))
      } finally {
        setSubmitting(false)
      }
    }

    else if (mode === 'forgot') {
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setError('Please enter a valid email address')
        return
      }
      setSubmitting(true)
      try {
        await onResetPassword(trimmedEmail)
        setMode('sent')
      } catch (err) {
        setError(prettifyError(err))
      } finally {
        setSubmitting(false)
      }
    }

    else if (mode === 'reset') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      setSubmitting(true)
      try {
        await onUpdatePassword(password)
        setSuccessMsg('Password updated! You are now signed in.')
        // Clear hash so we don't keep showing reset mode
        window.history.replaceState({}, '', window.location.pathname)
      } catch (err) {
        setError(prettifyError(err))
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#243024] px-4 relative overflow-hidden">
      {/* Chalkboard texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
      }} />

      {/* Decorative chalk doodles */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.06 }} transition={{ delay: 0.8, duration: 1.5 }}
        className="absolute top-[15%] left-[8%] text-white text-7xl font-hand select-none pointer-events-none">$</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.04 }} transition={{ delay: 1.2, duration: 1.5 }}
        className="absolute bottom-[20%] right-[10%] text-white text-5xl font-hand select-none pointer-events-none rotate-12">%</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.05 }} transition={{ delay: 1.0, duration: 1.5 }}
        className="absolute top-[25%] right-[15%] text-white text-4xl font-hand select-none pointer-events-none -rotate-6">+</motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="bg-[#faf8f4] rounded-sm p-10 shadow-[6px_6px_0px_rgba(0,0,0,0.15)] border border-black/[0.08] relative overflow-hidden">
          {/* Red margin line */}
          <div className="absolute top-0 bottom-0 left-[60px] w-[2px] bg-margin/30" />

          {/* Ruled lines */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 31px, rgba(191,212,232,0.25) 31px, rgba(191,212,232,0.25) 32px)',
            backgroundPosition: '0 12px',
          }} />

          {/* Pencil logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-5 relative z-10"
          >
            <div className="w-14 h-14 rounded-xl bg-pencil flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.12)]">
              <span className="text-2xl font-black text-[#243024]">$</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-6 relative z-10"
          >
            <h1 className="text-4xl font-hand font-bold text-ink tracking-tight">My Money</h1>
            <p className="text-sm font-hand text-ink-muted mt-1 tracking-wide">Alpha School</p>
          </motion.div>

          {/* CHECK EMAIL state after sign up */}
          {mode === 'check-email' && (
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sage/15 flex items-center justify-center">
                <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-bold text-ink mb-1.5">Check your email!</p>
              <p className="text-sm text-ink-muted leading-relaxed">
                We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>
              </p>
              <p className="text-xs text-ink-faint mt-4">
                Click the link in the email to confirm your account, then come back here to sign in.
              </p>
              <button onClick={() => setMode('signin')} className="mt-5 text-xs font-semibold text-ink-muted hover:text-ink underline underline-offset-2">
                Back to sign in
              </button>
            </div>
          )}

          {/* SENT state after forgot password */}
          {mode === 'sent' && (
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sage/15 flex items-center justify-center">
                <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-bold text-ink mb-1.5">Check your email!</p>
              <p className="text-sm text-ink-muted leading-relaxed">
                We sent a password reset link to <span className="font-semibold text-ink">{email}</span>
              </p>
              <button onClick={() => setMode('signin')} className="mt-5 text-xs font-semibold text-ink-muted hover:text-ink underline underline-offset-2">
                Back to sign in
              </button>
            </div>
          )}

          {/* SIGN IN / SIGN UP / FORGOT / RESET forms */}
          {(mode === 'signin' || mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
            <form
              onSubmit={handleSubmit}
              className="relative z-10 space-y-3"
            >
                {/* Tab toggle (signin/signup only) */}
                {(mode === 'signin' || mode === 'signup') && (
                  <div className="flex bg-black/5 rounded-lg p-1 mb-4">
                    <button type="button" onClick={() => setMode('signin')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'signin' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted hover:text-ink'}`}>
                      Sign In
                    </button>
                    <button type="button" onClick={() => setMode('signup')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'signup' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted hover:text-ink'}`}>
                      Sign Up
                    </button>
                  </div>
                )}

                {mode === 'forgot' && (
                  <p className="text-sm text-ink-muted mb-3">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                )}

                {mode === 'reset' && (
                  <p className="text-sm text-ink-muted mb-3">
                    Choose a new password for your account.
                  </p>
                )}

                {/* Full name (signup only) */}
                {mode === 'signup' && (
                  <Field label="Full Name" id="name" type="text" value={fullName}
                    onChange={(v) => setFullName(v)} placeholder="June Rockefeller" autoComplete="name" autoFocus disabled={submitting} />
                )}

                {/* Email (not in reset mode) */}
                {mode !== 'reset' && (
                  <Field label="Email" id="email" type="email" value={email}
                    onChange={(v) => setEmail(v)} placeholder="you@alpha.school" autoComplete="email"
                    autoFocus={mode === 'signin' || mode === 'forgot'} disabled={submitting} />
                )}

                {/* Password (not in forgot mode) */}
                {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
                  <Field label={mode === 'reset' ? 'New Password' : 'Password'} id="password" type="password" value={password}
                    onChange={(v) => setPassword(v)} placeholder={mode === 'signup' || mode === 'reset' ? 'At least 6 characters' : ''}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    autoFocus={mode === 'reset'} disabled={submitting} />
                )}

                {/* Confirm password (signup + reset) */}
                {(mode === 'signup' || mode === 'reset') && (
                  <Field label="Confirm Password" id="confirmPassword" type="password" value={confirmPassword}
                    onChange={(v) => setConfirmPassword(v)} autoComplete="new-password" disabled={submitting} />
                )}

                {/* Forgot password link */}
                {mode === 'signin' && (
                  <div className="text-right">
                    <button type="button" onClick={() => setMode('forgot')}
                      className="text-xs font-semibold text-ink-muted hover:text-ink underline underline-offset-2">
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-600 font-medium">
                    {error}
                  </motion.p>
                )}

                {successMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-sage font-semibold">
                    {successMsg}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting || loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-ink text-white rounded-lg font-bold text-[15px] transition-all duration-200 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <span>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot' && 'Send Reset Link'}
                      {mode === 'reset' && 'Update Password'}
                    </span>
                  )}
                </motion.button>

                {mode === 'forgot' && (
                  <button type="button" onClick={() => setMode('signin')}
                    className="w-full text-xs font-semibold text-ink-muted hover:text-ink mt-2">
                    ← Back to sign in
                  </button>
                )}
            </form>
          )}

          <p className="relative z-10 text-center text-sm font-hand text-ink-faint mt-6">
             Learn money. Have fun.
          </p>
        </div>

        {/* Notebook spine detail */}
        <div className="absolute -left-2 top-4 bottom-4 w-1 rounded-full bg-white/10" />
      </motion.div>
    </div>
  )
}

// Reusable field component
const Field = ({ label, id, type, value, onChange, placeholder, autoComplete, autoFocus, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-wide uppercase">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-lg text-[15px] text-ink placeholder-ink-faint focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20 transition-all disabled:opacity-60"
    />
  </div>
)

// Format Supabase errors into friendly messages
function prettifyError(err) {
  const msg = err?.message || 'Something went wrong. Please try again.'
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password. Try again or use "Forgot password?"'
  if (msg.includes('User already registered')) return 'An account with this email already exists. Try signing in instead.'
  if (msg.includes('Email not confirmed')) return 'Please check your email and click the confirmation link before signing in.'
  if (msg.includes('rate limit') || msg.includes('Too many')) return 'Too many tries. Please wait a minute and try again.'
  return msg
}
