import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Auto-grant badges when conditions are met.
 * Returns newly earned badges for celebration display.
 */
export const useAutoGrant = (studentId, accounts, streak = 0) => {
  const [newBadges, setNewBadges] = useState([])
  const [checked, setChecked] = useState(false)

  const checkAndGrant = useCallback(async () => {
    if (!studentId || !accounts) return

    try {
      // Fetch all badge definitions
      const { data: allBadges } = await supabase
        .from('badge_definitions')
        .select('*')

      // Fetch already earned badges
      const { data: earnedBadges } = await supabase
        .from('student_badges')
        .select('badge_id')
        .eq('student_id', studentId)

      const earnedIds = new Set((earnedBadges || []).map(b => b.badge_id))
      const newlyEarned = []

      for (const badge of (allBadges || [])) {
        if (earnedIds.has(badge.id)) continue

        const shouldGrant = checkCondition(badge, accounts, streak)
        if (shouldGrant) {
          const { error } = await supabase
            .from('student_badges')
            .insert({ student_id: studentId, badge_id: badge.id })

          if (!error) {
            newlyEarned.push({
              id: badge.id,
              title: badge.title,
              icon: badge.icon,
              description: badge.description,
            })
          }
        }
      }

      if (newlyEarned.length > 0) {
        setNewBadges(newlyEarned)
      }
    } catch (err) {
      console.error('Badge auto-grant error:', err)
    } finally {
      setChecked(true)
    }
  }, [studentId, accounts, streak])

  useEffect(() => {
    if (!checked && studentId && accounts) {
      checkAndGrant()
    }
  }, [checked, studentId, accounts, checkAndGrant])

  const dismissBadge = (badgeId) => {
    setNewBadges(prev => prev.filter(b => b.id !== badgeId))
  }

  return { newBadges, dismissBadge }
}

function checkCondition(badge, accounts, streak) {
  const type = badge.condition_type
  const value = badge.condition_value

  switch (type) {
    case 'first_paycheck':
      // This would need paycheck count - handled by checking if any paycheck exists
      // We'll check this via a separate query or assume the badge was already granted
      return false // Skip for now - needs paycheck data

    case 'savings_threshold':
      return (accounts.savings || 0) >= (value || 100)

    case 'investment_opened':
      return (accounts.sp500 || 0) > 0 || (accounts.nasdaq || 0) > 0

    case 'streak':
      return streak >= (value || 5)

    case 'all_accounts': {
      const types = ['checking', 'savings', 'sp500', 'nasdaq', 'bonus']
      return types.every(t => (accounts[t] || 0) > 0)
    }

    case 'first_purchase':
      return false // Needs purchase data

    case 'epic_week':
      return false // Needs paycheck data

    case 'mastery_perfect':
      return false // Needs test data

    default:
      return false
  }
}
