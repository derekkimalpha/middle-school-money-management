import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_SETTINGS = {
  xp_threshold: 100,
  base_pay: 10,
  bonus_multiplier: 1.5,
  challenge_reward: 50,
  max_level: 10,
  daily_limit: 100
}

export const usePaycheckSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('paycheck_settings')
          .select('*')
          .eq('sessions.is_active', true)
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          setSettings({
            xp_threshold: data.xp_threshold || DEFAULT_SETTINGS.xp_threshold,
            base_pay: data.base_pay || DEFAULT_SETTINGS.base_pay,
            bonus_multiplier: data.bonus_multiplier || DEFAULT_SETTINGS.bonus_multiplier,
            challenge_reward: data.challenge_reward || DEFAULT_SETTINGS.challenge_reward,
            max_level: data.max_level || DEFAULT_SETTINGS.max_level,
            daily_limit: data.daily_limit || DEFAULT_SETTINGS.daily_limit,
            ...data
          })
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
    loading
  }
}
