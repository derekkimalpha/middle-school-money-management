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
          // Only clear loading if this is NOT a mid-PKCE-exchange state.
          // The Supabase client with flowType:'pkce' handles code exchange
          // automatically — INITIAL_SESSION fires with the session after exchange.
          // If we get here with no session, it genuinely means no user is logged in.
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    // Check for OAuth errors in URL (Supabase redirects with error params on failure)
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
    const oauthError = params.get('error_description') || hashParams.get('error_description')
    if (oauthError) {
      console.error('[Auth] OAuth error from URL:', oauthError)
      setAuthError(`Sign-in failed: ${oauthError}`)
      setLoading(false)
      window.history.replaceState({}, '', window.location.pathname)
    }
    // Clean up OAuth code from URL if present (Supabase client exchanges it automatically)
    if (params.get('code')) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Safety timeout
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Loading timeout - forcing load complete')
        setLoading(false)
      }
    }, 8000)

    return () => {
      mounted = false
      subscription?.unsubscribe()
      clearTimeout(timeout)
    }
  }, [fetchProfile])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin
      }
    })
    if (error) throw error
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
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

  return { user, profile, loading, authError, signIn, signUp, resetPassword, updatePassword, signOut, refreshProfile }
}
