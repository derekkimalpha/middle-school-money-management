import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Full-screen achievement celebration overlay.
 * Shows when a badge is newly earned or level-up occurs.
 */
export const AchievementToast = ({ achievements = [], onDismiss }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [particles, setParticles] = useState([])

  const current = achievements[currentIndex]

  useEffect(() => {
    if (!current) return
    // Generate confetti particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      color: ['#e8c840', '#7c8c78', '#6b8a87', '#a68b5b', '#a67272', '#8B7BA8'][Math.floor(Math.random() * 6)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    }))
    setParticles(newParticles)
  }, [currentIndex, current])

  if (!current) return null

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onDismiss?.()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        onClick={handleNext}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Confetti */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
              opacity: 0,
              rotate: p.rotation,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Badge Card */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.1,
          }}
          className="relative z-10 text-center px-8"
        >
          {/* Type label */}
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-bold text-pencil uppercase tracking-[0.2em] mb-4"
          >
            {current.type === 'level' ? 'Level Up!' : 'Badge Earned!'}
          </motion.p>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="text-7xl mb-4"
          >
            {current.icon || '🏆'}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-hand font-bold text-white mb-2"
          >
            {current.title}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/60 max-w-xs mx-auto mb-6"
          >
            {current.description}
          </motion.p>

          {/* Tap to continue */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-white/40"
          >
            Tap to continue
            {achievements.length > 1 && ` (${currentIndex + 1}/${achievements.length})`}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
