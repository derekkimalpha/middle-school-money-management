import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'

// ── Alpha bird brand mark (inline SVG, inherits currentColor) ──
const AlphaBird = ({ className = '' }) => (
  <svg viewBox="0 0 76 52" xmlns="http://www.w3.org/2000/svg" fill="none" aria-label="Alpha" className={className}>
    <path d="M61.273 23.8421L57.817 22.8301L52.31 25.2201L53.815 29.3511L61.273 23.8421Z" fill="currentColor"/>
    <path d="M56.724 22.5899L49.8 21.1499L52.02 24.6299L56.724 22.5899Z" fill="currentColor"/>
    <path d="M66.886 22.2151L67.948 19.8271L59.841 19.3701L58.29 22.2901L62.014 23.3821L66.886 22.2151Z" fill="currentColor"/>
    <path d="M59.219 18.7708L58.884 16.5098L53.84 17.4978L55.455 19.3318L59.219 18.7708Z" fill="currentColor"/>
    <path d="M55.96 19.9022L57.71 21.8922L59.003 19.4502L55.96 19.9022Z" fill="currentColor"/>
    <path d="M48.816 20.9022L40.54 15.1802L43.28 25.1882L51.274 24.7602L48.816 20.9022Z" fill="currentColor"/>
    <path d="M49.25 20.3901L56.837 21.9621L39.59 2.37012L40.305 14.2001L49.25 20.3901Z" fill="currentColor"/>
    <path d="M72.69 22.5088L74.287 22.3888L74.305 21.5498L72.928 21.9378L72.69 22.5088Z" fill="currentColor"/>
    <path d="M72.92 21.2702L74 20.9602L70.727 18.2002L69.11 19.4922L72.92 21.2702Z" fill="currentColor"/>
    <path d="M39.27 35.02L40.646 35.973L44.148 30.64L42.784 26L39.27 35.02Z" fill="currentColor"/>
    <path d="M72.263 21.7028L70.41 20.8398L72.013 22.2918L72.263 21.7028Z" fill="currentColor"/>
    <path d="M50.832 25.4302L43.47 25.8182L44.726 30.1042L50.832 25.4302Z" fill="currentColor"/>
    <path d="M68.345 19.2068L69.883 17.9728L59.6 16.5098L59.935 18.7378L68.345 19.2068Z" fill="currentColor"/>
    <path d="M68.594 20.1099L67.61 22.3219L70.865 23.6419L71.657 22.8819L68.594 20.1099Z" fill="currentColor"/>
    <path d="M71.48 23.9841L73.521 25.3741L72.105 23.3901L71.48 23.9841Z" fill="currentColor"/>
    <path d="M45.16 30.6121L52.79 34.2241L53.28 29.9221L51.705 25.6001L45.16 30.6121Z" fill="currentColor"/>
    <path d="M53.985 30.0598L53.54 33.9298L62.048 26.9058L61.726 24.3398L53.985 30.0598Z" fill="currentColor"/>
    <path d="M74.67 26.1878L74.842 27.2388L75.473 26.0098L74.67 26.1878Z" fill="currentColor"/>
    <path d="M74.399 23.02L72.77 23.146L74.489 25.546L75.382 25.347L74.399 23.02Z" fill="currentColor"/>
    <path d="M62.4 23.9518L62.729 26.5578L70.033 24.0028L67.123 22.8198L62.4 23.9518Z" fill="currentColor"/>
    <path d="M39.723 14.8701L23.7 23.7861L42.541 25.1631L39.723 14.8701Z" fill="currentColor"/>
    <path d="M41.32 36.2101L43.217 36.4841L52.066 34.6091L44.658 31.1001L41.32 36.2101Z" fill="currentColor"/>
    <path d="M38.933 35.6001L33.36 43.8311L36.487 47.3511L40.33 36.5711L38.933 35.6001Z" fill="currentColor"/>
    <path d="M43.72 48.0538L46.527 45.6018L43.38 37.0698L43.72 48.0538Z" fill="currentColor"/>
    <path d="M41.007 36.7998L37.03 47.9488L40.003 51.3048L43.02 48.6648L42.667 37.0508L41.007 36.7998Z" fill="currentColor"/>
    <path d="M39.562 13.9031L26.55 9.91012V8.47512H29.369V6.26312H26.937V3.83312H29.164V2.37012H38.874L39.562 13.9031ZM32.568 4.16012H31.114V5.45212H32.568V4.16012ZM36.312 6.37712H34.652V7.37712H32.792V9.45712H35.134V7.84512H36.312V6.37712Z" fill="currentColor"/>
    <path d="M18.24 8.3559H16.36V10.7329H19.036V9.1959H20.736V6.3439H18.696V5.1499H16.957V6.6999H18.239L18.24 8.3559Z" fill="currentColor"/>
    <path d="M16.425 13.2202H13.58V15.7522H16.425V13.2202Z" fill="currentColor"/>
    <path d="M8.268 8.47021H5.92V10.5552H8.268V8.47021Z" fill="currentColor"/>
    <path d="M19.782 16.9199H17.24V19.1779H19.782V16.9199Z" fill="currentColor"/>
    <path d="M5.278 2.97998H2.93V5.06498H5.278V2.97998Z" fill="currentColor"/>
    <path d="M6.367 0.299805H4.86V1.6378H6.367V0.299805Z" fill="currentColor"/>
    <path d="M1.562 1.68018H0.5V2.62318H1.562V1.68018Z" fill="currentColor"/>
    <path d="M21.05 3.55994V5.44694H23.174V4.29894H25.908V1.43994H22.691V3.55994H21.05Z" fill="currentColor"/>
    <path d="M20.264 1.418H21.237V0H19.647V0.954H18.09V2.88H20.264V1.418Z" fill="currentColor"/>
    <path d="M11.306 11.966H14.556V9.08002H11.95V7.77002H9.82V9.66302H11.306V11.966Z" fill="currentColor"/>
    <path d="M25.547 7.08008H22.4V9.87508H25.547V7.08008Z" fill="currentColor"/>
    <path d="M13.323 0.310059H11.74V1.71606H13.323V0.310059Z" fill="currentColor"/>
    <path d="M9.82 1.02002H7.78V2.83102H9.82V1.02002Z" fill="currentColor"/>
    <path d="M13.856 7.76706H15.6V5.85306H14.422V4.72806H16.436V2.31006H13.47V4.12706H11.74V6.37406H13.856V7.76706Z" fill="currentColor"/>
    <path d="M9.823 4.20996H7.1V6.62796H9.823V4.20996Z" fill="currentColor"/>
    <path d="M12.019 13.5801H10.41V15.0031H12.019V13.5801Z" fill="currentColor"/>
    <path d="M22.658 23.6278L20.413 21.3928H19.1V20.0858L19.048 20.0338H23.472V17.9358H24.273V16.5258H22.684V17.5638H21.422V15.8618H19.66V14.3518H17.71V11.9758H19.956V10.5698H22.077V12.4608H20.378V13.6318H22.368V14.8778H25.773V13.3678H24.421V11.4378H26.551V10.5908L39.12 14.4508L22.658 23.6278ZM31.02 15.2258H33.118V13.3628H31.02V15.2258ZM25.323 19.3878H27.048V18.3978H29.083V16.1528H26.555V17.8558H25.319L25.323 19.3878Z" fill="currentColor"/>
  </svg>
)

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
    <div className="min-h-screen flex items-center justify-center bg-ds-canvas font-ds-sans px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Wordmark + bird logo above the form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="w-16 h-11 text-ds-primary mb-3">
            <AlphaBird className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-semibold text-ds-primary tracking-tight">My Money</h1>
          <p className="text-sm text-ds-tertiary mt-1">Alpha School</p>
        </motion.div>

        <div className="bg-ds-surface rounded-ds-xl p-8 border border-ds-hairline">
          {/* CHECK EMAIL state after sign up */}
          {mode === 'check-email' && (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ds-accent-soft flex items-center justify-center">
                <svg className="w-6 h-6 text-ds-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-semibold text-ds-primary mb-1.5">Check your email!</p>
              <p className="text-sm text-ds-secondary leading-relaxed">
                We sent a confirmation link to <span className="font-semibold text-ds-primary">{email}</span>
              </p>
              <p className="text-xs text-ds-tertiary mt-4">
                Click the link in the email to confirm your account, then come back here to sign in.
              </p>
              <button onClick={() => setMode('signin')} className="mt-5 text-xs font-semibold text-ds-secondary hover:text-ds-primary underline underline-offset-2">
                Back to sign in
              </button>
            </div>
          )}

          {/* SENT state after forgot password */}
          {mode === 'sent' && (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ds-accent-soft flex items-center justify-center">
                <svg className="w-6 h-6 text-ds-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-semibold text-ds-primary mb-1.5">Check your email!</p>
              <p className="text-sm text-ds-secondary leading-relaxed">
                We sent a password reset link to <span className="font-semibold text-ds-primary">{email}</span>
              </p>
              <button onClick={() => setMode('signin')} className="mt-5 text-xs font-semibold text-ds-secondary hover:text-ds-primary underline underline-offset-2">
                Back to sign in
              </button>
            </div>
          )}

          {/* SIGN IN / SIGN UP / FORGOT / RESET forms */}
          {(mode === 'signin' || mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
            <form
              onSubmit={handleSubmit}
              className="space-y-3"
            >
                {/* Tab toggle (signin/signup only) */}
                {(mode === 'signin' || mode === 'signup') && (
                  <div className="flex bg-ds-inset rounded-ds-md p-1 mb-4">
                    <button type="button" onClick={() => setMode('signin')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-ds-sm transition-all ${mode === 'signin' ? 'bg-ds-surface text-ds-primary' : 'text-ds-secondary hover:text-ds-primary'}`}>
                      Sign In
                    </button>
                    <button type="button" onClick={() => setMode('signup')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-ds-sm transition-all ${mode === 'signup' ? 'bg-ds-surface text-ds-primary' : 'text-ds-secondary hover:text-ds-primary'}`}>
                      Sign Up
                    </button>
                  </div>
                )}

                {mode === 'forgot' && (
                  <p className="text-sm text-ds-secondary mb-3">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                )}

                {mode === 'reset' && (
                  <p className="text-sm text-ds-secondary mb-3">
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
                      className="text-xs font-semibold text-ds-secondary hover:text-ds-primary underline underline-offset-2">
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-ds-negative font-medium">
                    {error}
                  </motion.p>
                )}

                {successMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-ds-positive font-semibold">
                    {successMsg}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  full
                  disabled={submitting || loading}
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
                </Button>

                {mode === 'forgot' && (
                  <button type="button" onClick={() => setMode('signin')}
                    className="w-full text-xs font-semibold text-ds-secondary hover:text-ds-primary mt-2">
                    ← Back to sign in
                  </button>
                )}
            </form>
          )}

          <p className="text-center text-sm text-ds-tertiary mt-6">
             Learn money. Have fun.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// Reusable field component (uses shared Input under the hood)
const Field = ({ label, id, type, value, onChange, placeholder, autoComplete, autoFocus, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-[11px] font-semibold text-ds-tertiary mb-1.5 tracking-[0.05em] uppercase">
      {label}
    </label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      disabled={disabled}
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
