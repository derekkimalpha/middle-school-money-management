import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const fetchProfile = useCallback(async (userId, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Auth] Fetching profile for: ${userId} (attempt ${attempt}/${retries})`)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (data && !error) {
          console.log('[Auth] Profile loaded:', data.email, data.role)
          setProfile(data)
          return data
        } else {
          console.warn(`[Auth] Profile not found (attempt ${attempt}):`, error?.message)
          if (attempt < retries) {
            // Wait before retrying — the handle_new_user trigger may still be running
            await new Promise(r => setTimeout(r, 800 * attempt))
          }
        }
      } catch (err) {
        console.error(`[Auth] Profile fetch failed (attempt ${attempt}):`, err.message)
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 800 * attempt))
        }
      }
    }
    console.error('[Auth] Profile not found after all retries')
    return null
  }, [])

  useEffect(() => {
    let mounted = true

    // Single source of truth: onAuthStateChange handles everything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event, session?.user?.email)

        if (!mounted) return

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name ||
                  session.user.user_metadata?.full_name ||
                  session.user.email?.split('@')[0] || 'User'
          })

          // Use setTimeout to avoid Supabase client deadlock
          // The auth state change callback can block the client
          setTimeout(async () => {
            if (!mounted) return
            setAuthError(null)
            const result = await fetchProfile(session.user.id)
            if (mounted) {
              if (!result) {
                setAuthError('Profile could not be loaded. Please try signing in again.')
              }
              setLoading(false)
            }
          }, 0)
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    // Also handle PKCE code exchange if we have a code in URL
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      console.log('[Auth] Exchanging PKCE code...')
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) console.error('[Auth] Code exchange error:', error.message)
        // Clean up URL regardless
        window.history.replaceState({}, '', window.location.pathname)
      })
    }

    // Safety timeout: if loading hasn't resolved after 5 seconds, force it
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Loading timeout - forcing load complete')
        setLoading(false)
      }
    }, 5000)

    return () => {
      mounted = false
      subscription?.unsubscribe()
      clearTimeout(timeout)
    }
  }, [fetchProfile])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://middle-school-money-management.vercel.app'
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

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return fetchProfile(user.id)
    }
    return null
  }, [user?.id, fetchProfile])

  return { user, profile, loading, authError, signInWithGoogle, signOut, refreshProfile }
}
