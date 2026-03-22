import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [debugMsg, setDebugMsg] = useState('Initializing...')

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data && !error) {
        setProfile(data)
      } else {
        setDebugMsg(`Profile error: ${error?.message || 'not found'}`)
      }
    } catch (err) {
      setDebugMsg(`Profile fetch failed: ${err.message}`)
    }
  }

  const handleSession = async (session) => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
      })
      await fetchProfile(session.user.id)
    } else {
      setUser(null)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        // Check if we have a code in the URL (PKCE flow callback)
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const code = params.get('code')
        const accessToken = hashParams.get('access_token')

        setDebugMsg(`Init: code=${!!code}, token=${!!accessToken}`)

        if (code) {
          // Exchange the code for a session (PKCE flow)
          setDebugMsg('Exchanging code for session...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setDebugMsg(`Code exchange error: ${error.message}`)
          } else if (data?.session) {
            setDebugMsg(`Code exchange success: ${data.session.user.email}`)
            if (mounted) {
              await handleSession(data.session)
              // Clean up the URL
              window.history.replaceState({}, '', window.location.pathname)
            }
          }
        } else {
          // No code, just check for existing session
          setDebugMsg('Checking existing session...')
          const { data: { session }, error } = await supabase.auth.getSession()
          setDebugMsg(`Session check: ${session ? session.user.email : 'none'}, error: ${error?.message || 'none'}`)
          if (mounted && session) {
            await handleSession(session)
          }
        }
      } catch (err) {
        setDebugMsg(`Init error: ${err.message}`)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setDebugMsg(`Auth event: ${event}`)
        if (mounted) {
          await handleSession(session)
          if (loading) setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return {
    user,
    profile,
    loading,
    debugMsg,
    signInWithGoogle,
    signOut
  }
}
