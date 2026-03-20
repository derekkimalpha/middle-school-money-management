import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

export const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase will automatically pick up the tokens from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/', { replace: true })
          return
        }

        if (session) {
          // Session established, redirect to home
          navigate('/', { replace: true })
        } else {
          // No session yet, wait a moment for Supabase to process the hash
          // Then try again
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            navigate('/', { replace: true })
          }, 1000)
        }
      } catch (err) {
        console.error('Callback error:', err)
        navigate('/', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sage-bg to-slate-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-sage-light border-t-sage rounded-full mx-auto mb-4"
        />
        <p className="text-gray-500 font-medium">signing you in...</p>
      </div>
    </div>
  )
}
