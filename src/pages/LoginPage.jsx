import React from 'react'
import { motion } from 'framer-motion'

export const LoginPage = ({ onSignInWithGoogle, loading }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#243024] px-4 relative overflow-hidden">
      {/* Chalkboard texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
      }} />

      {/* Notebook paper card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="bg-[#faf8f4] rounded-sm p-10 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] border border-black/[0.1] relative">
          {/* Red margin line */}
          <div className="absolute top-0 bottom-0 left-[60px] w-[2px] bg-margin/40" />

          {/* Pencil logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 rounded-md bg-pencil flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
              <span className="text-3xl font-black text-[#243024]">$</span>
            </div>
          </motion.div>

          {/* Title — handwritten style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-hand font-bold text-ink tracking-tight">
              My Money
            </h1>
            <p className="text-sm font-hand text-ink-muted mt-2">
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
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-ink rounded font-bold text-[15px] border border-black/[0.1] transition-all duration-200 shadow-[2px_2px_0px_rgba(0,0,0,0.08)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.1)] hover:bg-paper-warm disabled:opacity-40 disabled:cursor-not-allowed"
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

          {/* Pencil doodle */}
          <p className="text-center text-sm font-hand text-ink-faint mt-6">
            ✏️ Learn money. Have fun.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
