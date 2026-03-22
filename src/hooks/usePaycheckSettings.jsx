import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_SETTINGS = {
  xp_threshold: 600,
  base_pay: 10,
  epic_week_bonus: 5,
  epic_days_required: 5,
  bonus_xp_rate: 1,
  bonus_xp_per: 50,
  mastery_pass_pay: 20,
  mastery_perfect_pay: 100,
  mastery_min_score: 90,
  transfer_fee_pct: 10,
  transfer_fee_invest_pct: 10,
  transfer_fee_savings_pct: 0,
  smart_goal_pay: 6,
  custom_bonuses: [
    { id: 'smart_goal', name: 'SMART Goal', amount: 6, type: 'checkbox' }
  ]
}

export const usePaycheckSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // First find the active session
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('id')
          .eq('is_active', true)
          .limit(1)

        if (sessionError) throw sessionError
        if (!sessions || sessions.length === 0) {
          setSettings(DEFAULT_SETTINGS)
          setLoading(false)
          return
        }

        const sessionId = sessions[0].id
        setActiveSession(sessions[0])

        // Then fetch settings for that session
        const { data, error } = await supabase
          .from('paycheck_settings')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data })
        } else {
          setSettings(DEFAULT_SETTINGS)
        }
      } catch (error) {
        console.error('Error fetching paycheck settings:', error)
        setSettings(DEFAULT_SETTINGS)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return {
    settings,
    activeSession,
    loading
  }
}
