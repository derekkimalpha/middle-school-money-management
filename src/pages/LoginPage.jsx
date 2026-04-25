import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const LoginPage = ({ onSignInWithEmail, loading }) => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    setSubmitting(true)
    try {
      await onSignInWithEmail(trimmed)
      setSent(true)
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#243024] px-4 relative overflow-hidden">
      {/* Chalkboard texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
      }} />

      {/* Decorative chalk doodles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.06 }}
        transition={{ delay: 0.8, duration: 1.5 }}
        className="absolute top-[15%] left-[8%] text-white text-7xl font-hand select-none pointer-events-none"
      >$</motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.04 }}
        transition={{ delay: 1.2, duration: 1.5 }}
        className="absolute bottom-[20%] right-[10%] text-white text-5xl font-hand select-none pointer-events-none rotate-12"
      >%</motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 1.0, duration: 1.5 }}
        className="absolute top-[25%] right-[15%] text-white text-4xl font-hand select-none pointer-events-none -rotate-6"
      >+</motion.div>

      {/* Notebook paper card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[400px]"
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
            className="flex justify-center mb-6 relative z-10"
          >
            <div className="w-16 h-16 rounded-xl bg-pencil flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.12)]">
              <span className="text-3xl font-black text-[#243024]">$</span>
            </div>
          </motion.div>

          {/* Title — handwritten style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8 relative z-10"
          >
            <h1 className="text-5xl font-hand font-bold text-ink tracking-tight">
              My Money
            </h1>
            <p className="text-base font-hand text-ink-muted mt-1.5 tracking-wide">
              Alpha School
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sage/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-bold text-ink mb-1.5">Check your email!</p>
                <p className="text-sm text-ink-muted leading-relaxed">
                  We sent a login link to <span className="font-semibold text-ink">{email}</span>
                </p>
                <p className="text-xs text-ink-faint mt-4">
                  Click the link in the email to sign in.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); setError('') }}
                  className="mt-5 text-xs font-semibold text-ink-muted hover:text-ink underline underline-offset-2"
                >
                  Use a different email
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="relative z-10 space-y-3"
              >
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-wide uppercase">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@alpha.school"
                    autoComplete="email"
                    autoFocus
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-[15px] text-ink placeholder-ink-faint focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20 transition-all disabled:opacity-60"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-600 font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting || loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-ink text-white rounded-lg font-bold text-[15px] transition-all duration-200 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <span>Send login link</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Tagline */}
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
