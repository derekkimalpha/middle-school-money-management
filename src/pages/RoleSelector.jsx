import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/shared/Button'

const roles = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    description: 'I\'m here to learn about money, earn paychecks, and grow my savings.',
  },
  {
    id: 'guide',
    label: 'Guide',
    icon: Users,
    description: 'I\'m a teacher or guide managing a classroom of students.',
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
    <div className="min-h-screen flex items-center justify-center bg-ds-canvas font-ds-sans px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="bg-ds-surface rounded-ds-xl p-8 border border-ds-hairline">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-semibold text-ds-primary tracking-tight">
              Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-sm text-ds-secondary mt-2">
              How will you be using My Money?
            </p>
          </motion.div>

          {/* Role cards */}
          <div className="space-y-3 mb-6">
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
                  className={`w-full text-left p-4 rounded-ds-lg border transition-all duration-200 ${
                    isSelected
                      ? 'border-ds-accent bg-ds-accent-soft'
                      : 'border-ds-hairline bg-ds-surface hover:bg-ds-overlay'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-ds-md flex items-center justify-center flex-shrink-0 bg-ds-inset">
                      <Icon className="w-6 h-6 text-ds-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-ds-primary">{role.label}</p>
                      <p className="text-[12px] text-ds-secondary leading-relaxed mt-0.5">
                        {role.description}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-ds-accent bg-ds-accent' : 'border-ds-border'
                    }`}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-ds-on-accent"
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
              className="text-sm text-ds-negative text-center mb-4"
            >
              {error}
            </motion.p>
          )}

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="primary"
              size="lg"
              full
              onClick={handleContinue}
              disabled={!selected || loading}
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
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
