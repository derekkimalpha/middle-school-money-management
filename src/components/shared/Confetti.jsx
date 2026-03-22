import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SYMBOLS = ['$', '¢', '★', '✦', '♦', '+']
const CONFETTI_COLORS = [
  '#e8c840', // pencil yellow
  '#7c8c78', // sage
  '#6b8a87', // teal
  '#a68b5b', // gold
  '#f472b6', // pink
  '#60a5fa', // blue
  '#34d399', // emerald
  '#fbbf24', // amber
]

export const Confetti = ({ active = false }) => {
  const pieces = useMemo(() => {
    // Mix of confetti shapes + money emojis
    const confetti = Array.from({ length: 60 }).map((_, i) => ({
      id: `c-${i}`,
      type: 'shape',
      shape: ['square', 'circle', 'strip'][Math.floor(Math.random() * 3)],
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.5,
      rotation: Math.random() * 720 - 360,
      wobble: (Math.random() - 0.5) * 200,
      size: 4 + Math.random() * 8,
    }))

    const emojis = Array.from({ length: 12 }).map((_, i) => ({
      id: `e-${i}`,
      type: 'symbol',
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      left: 10 + Math.random() * 80,
      delay: Math.random() * 0.6,
      duration: 2.5 + Math.random() * 1,
      rotation: Math.random() * 360 - 180,
      wobble: (Math.random() - 0.5) * 150,
      size: 18 + Math.random() * 14,
    }))

    return [...confetti, ...emojis]
  }, [])

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Burst flash */}
          <motion.div
            className="fixed inset-0 pointer-events-none z-[100]"
            initial={{ backgroundColor: 'rgba(232, 200, 64, 0.3)' }}
            animate={{ backgroundColor: 'rgba(232, 200, 64, 0)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />

          {/* Center burst text */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101]"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.2, 1, 0.8] }}
            transition={{ duration: 1.8, times: [0, 0.2, 0.6, 1] }}
          >
            <div className="text-center">
              <motion.div
                className="text-5xl mb-2 font-hand font-black text-pencil"
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                $
              </motion.div>
              <motion.p
                className="text-2xl font-hand font-bold text-ink dark:text-chalk-white drop-shadow-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -20] }}
                transition={{ duration: 1.6, times: [0, 0.2, 0.7, 1] }}
              >
                Locked In!
              </motion.p>
            </div>
          </motion.div>

          {/* Confetti rain */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-[99]">
            {pieces.map((piece) =>
              piece.type === 'symbol' ? (
                <motion.div
                  key={piece.id}
                  className="absolute"
                  style={{
                    left: `${piece.left}%`,
                    top: '-40px',
                    fontSize: piece.size,
                  }}
                  initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    y: typeof window !== 'undefined' ? window.innerHeight + 50 : 900,
                    x: piece.wobble,
                    rotate: piece.rotation,
                    opacity: [1, 1, 1, 0],
                  }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <span className="font-hand font-black text-pencil-dark" style={{ fontSize: piece.size }}>{piece.symbol}</span>
                </motion.div>
              ) : (
                <motion.div
                  key={piece.id}
                  className="absolute"
                  style={{
                    left: `${piece.left}%`,
                    top: '-10px',
                    width: piece.shape === 'strip' ? piece.size * 0.4 : piece.size,
                    height: piece.shape === 'strip' ? piece.size * 2 : piece.size,
                    backgroundColor: piece.color,
                    borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'strip' ? '1px' : '2px',
                  }}
                  initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    y: typeof window !== 'undefined' ? window.innerHeight + 20 : 900,
                    x: piece.wobble,
                    rotate: piece.rotation,
                    opacity: [1, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                />
              )
            )}
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
