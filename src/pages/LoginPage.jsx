import React from 'react'
import { motion } from 'framer-motion'

export const LoginPage = ({ onSignInWithGoogle, loading }) => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900">
      {/* Animated background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-500/30 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-cyan-400/20 blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-yellow-400/15 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

      {/* Floating emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['💰', '📈', '🏦', '💎', '🎯', '🔥', '⭐', '💵'].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-20"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, i % 2 === 0 ? 10 : -10, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '30px 30px'
      }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-10 shadow-2xl shadow-purple-900/30">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-purple-900/20">
                <span className="text-4xl">💰</span>
              </div>
              {/* Glow ring */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-yellow-400/30 via-transparent to-pink-400/30 -z-10 blur-md animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-[36px] font-extrabold text-white tracking-tight leading-tight">
              My Money
            </h1>
            <p className="text-white/50 text-sm font-medium mt-2">
              Alpha School's Financial Literacy Game
            </p>
          </motion.div>

          {/* Sign in button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onSignInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-900 rounded-2xl font-bold text-[15px] transition-all duration-200 shadow-lg shadow-purple-900/20 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full"
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

          {/* Fun footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-white/30 text-xs font-medium">
              Level up your money skills 🚀
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
