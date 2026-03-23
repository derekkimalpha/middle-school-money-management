import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const roles = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    description: 'I\'m here to learn about money, earn paychecks, and grow my savings.',
    color: '#7c8c78',
    lightBg: 'rgba(124,140,120,0.08)',
  },
  {
    id: 'guide',
    label: 'Guide',
    icon: Users,
    description: 'I\'m a teacher or guide managing a classroom of students.',
    color: '#6b8a87',
    lightBg: 'rgba(107,138,135,0.08)',
  },
]

export const RoleSelector = ({ profile, onComplete }) => {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleContinue = async () => {
    if (!selected || !profile?.id) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('complete_onboarding', {
        p_user_id: profile.id,
        p_role: selected,
      })

      if (rpcError) throw rpcError
      if (data?.error) throw new Error(data.error)

      // Notify parent to refresh profile
      onComplete()
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#243024] px-4 relative overflow-hidden">
      {/* Chalkboard texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="bg-[#faf8f4] rounded-sm p-10 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] border border-black/[0.1] relative">
          {/* Red margin line */}
          <div className="absolute top-0 bottom-0 left-[60px] w-[2px] bg-margin/40" />

          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-2"
          >
            <div className="w-14 h-14 rounded-md bg-pencil flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.15)] mx-auto mb-5">
              <span className="text-2xl font-black text-[#243024]">$</span>
            </div>
            <h1 className="text-3xl font-hand font-bold text-ink tracking-tight">
              Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-sm text-ink-muted mt-2">
              How will you be using My Money?
            </p>
          </motion.div>

          {/* Role cards */}
          <div className="space-y-3 mt-6 mb-6">
            {roles.map((role, i) => {
              const Icon = role.icon
              const isSelected = selected === role.id
              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  onClick={() => setSelected(role.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-ink bg-ink/[0.04] shadow-[2px_2px_0px_rgba(0,0,0,0.1)]'
                      : 'border-black/[0.08] bg-white hover:border-black/[0.15] hover:bg-paper-warm/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: role.lightBg }}
                    >
                      <Icon className="w-6 h-6" style={{ color: role.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-ink">{role.label}</p>
                      <p className="text-[12px] text-ink-light leading-relaxed mt-0.5">
                        {role.description}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-ink bg-ink' : 'border-black/20'
                    }`}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-white"
                        />
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-600 text-center mb-4"
            >
              {error}
            </motion.p>
          )}

          {/* Continue button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={selected ? { y: -2 } : {}}
            whileTap={selected ? { scale: 0.98 } : {}}
            onClick={handleContinue}
            disabled={!selected || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-ink text-white rounded font-bold text-[15px] transition-all duration-200 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
