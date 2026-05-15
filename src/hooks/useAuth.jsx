import React, { useState, useEffect, useCallback, useContext, createContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const IMPERSONATE_KEY = 'mymoney-impersonate-student-id'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [realProfile, setRealProfile] = useState(null)
  const [impersonatedProfile, setImpersonatedProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

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
          setRealProfile(data)
          return data
        } else {
          console.warn(`[Auth] Profile not found (attempt ${attempt}):`, error?.message)
          if (attempt < retries) {
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

    // Fallback: profile wasn't created by trigger. Create one from auth user data.
    console.warn('[Auth] Profile not found after retries — attempting fallback creation')
    try {
      const { data: userResult, error: getUserErr } = await supabase.auth.getUser()
      if (getUserErr) {
        console.error('[Auth] Fallback: getUser failed:', getUserErr.message)
      }
      const authUser = userResult?.user
      if (!authUser) {
        console.error('[Auth] Fallback: no auth user available')
      } else if (authUser.id !== userId) {
        console.error('[Auth] Fallback: auth user id mismatch', { authId: authUser.id, expected: userId })
      } else {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (byEmail && byEmail.id !== userId) {
          console.log('[Auth] Found existing profile by email — leaving it for trigger migration')
        }

        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
            role: 'student',
            setup_complete: false,
          })
          .select()
          .single()

        if (created && !createErr) {
          console.log('[Auth] Fallback profile created:', created.email)
          setRealProfile(created)
          return created
        }
        console.error('[Auth] Fallback insert failed:', {
          message: createErr?.message,
          code: createErr?.code,
          details: createErr?.details,
          hint: createErr?.hint,
        })
      }
    } catch (err) {
      console.error('[Auth] Fallback profile creation threw:', err?.message, err)
    }

    console.error('[Auth] Profile not found and fallback failed — apply migration 015_fix_login.sql.')
    return null
  }, [])

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event, session?.user?.email)

        if (!mounted) return

        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name ||
                  session.user.user_metadata?.full_name ||
                  session.user.email?.split('@')[0] || 'User'
          })

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
          setRealProfile(null)
          setImpersonatedProfile(null)
          try { sessionStorage.removeItem(IMPERSONATE_KEY) } catch {}
          setLoading(false)
        }
      }
    )

    // Check for OAuth errors in URL
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
    const oauthError = params.get('error_description') || hashParams.get('error_description')
    if (oauthError) {
      console.error('[Auth] OAuth error from URL:', oauthError)
      setAuthError(`Sign-in failed: ${oauthError}`)
      setLoading(false)
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('code')) {
      window.history.replaceState({}, '', window.location.pathname)
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile])

  // Restore impersonation from sessionStorage after the guide profile loads.
  useEffect(() => {
    if (realProfile?.role !== 'guide') return
    let stored = null
    try { stored = sessionStorage.getItem(IMPERSONATE_KEY) } catch {}
    if (!stored) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('*')
      .eq('id', stored)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (data && !error) {
          setImpersonatedProfile(data)
        } else {
          try { sessionStorage.removeItem(IMPERSONATE_KEY) } catch {}
        }
      })
    return () => { cancelled = true }
  }, [realProfile?.id, realProfile?.role])

  const impersonate = useCallback(async (studentId) => {
    if (!studentId) return
    if (realProfile?.role !== 'guide') {
      console.warn('[Auth] Only guides can impersonate')
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single()
    if (error || !data) {
      console.error('[Auth] Impersonate failed:', error)
      return
    }
    setImpersonatedProfile(data)
    try { sessionStorage.setItem(IMPERSONATE_KEY, studentId) } catch {}
  }, [realProfile?.role])

  const exitImpersonation = useCallback(() => {
    setImpersonatedProfile(null)
    try { sessionStorage.removeItem(IMPERSONATE_KEY) } catch {}
  }, [])

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
    setPasswordRecovery(false)
  }

  const signOut = async () => {
    try {
      setImpersonatedProfile(null)
      try { sessionStorage.removeItem(IMPERSONATE_KEY) } catch {}
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setRealProfile(null)
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

  const value = {
    user,
    // Components consuming `profile` see the impersonated student when active,
    // otherwise the real (logged-in) profile. `realProfile` always exposes the
    // guide's actual profile so role checks for guide-only UI still work.
    profile: impersonatedProfile || realProfile,
    realProfile,
    impersonatedProfile,
    isImpersonating: !!impersonatedProfile,
    impersonate,
    exitImpersonation,
    loading,
    authError,
    passwordRecovery,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
