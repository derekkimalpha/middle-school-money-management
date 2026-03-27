import React from 'react'
import { motion } from 'framer-motion'

export const LoginPage = ({ onSignInWithGoogle, loading }) => {
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

          {/* Sign in button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSignInWithGoogle}
            disabled={loading}
            className="relative z-10 w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-ink rounded-lg font-bold text-[15px] border border-black/[0.08] transition-all duration-200 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.08)] hover:bg-paper-warm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-gray-300 border-t-pencil rounded-full"
              />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </motion.button>

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
