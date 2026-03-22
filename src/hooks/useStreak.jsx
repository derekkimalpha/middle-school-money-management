import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook to fetch and compute a student's paycheck streak.
 * A streak counts consecutive weeks where the student submitted at least one paycheck.
 */
export const useStreak = (studentId) => {
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return

    const fetchStreak = async () => {
      try {
        // First try student_streaks table
        const { data: streakData } = await supabase
          .from('student_streaks')
          .select('current_streak, longest_streak')
          .eq('student_id', studentId)
          .single()

        if (streakData) {
          setStreak(streakData.current_streak || 0)
          setLongestStreak(streakData.longest_streak || 0)
          setLoading(false)
          return
        }

        // Fallback: compute from weekly_paychecks
        const { data: paychecks } = await supabase
          .from('weekly_paychecks')
          .select('week_start')
          .eq('student_id', studentId)
          .in('status', ['submitted', 'verified', 'allocated'])
          .order('week_start', { ascending: false })

        if (!paychecks || paychecks.length === 0) {
          setStreak(0)
          setLoading(false)
          return
        }

        // Get unique weeks
        const weeks = [...new Set(paychecks.map(p => p.week_start))].sort().reverse()

        // Count consecutive weeks from most recent
        let currentStreak = 0
        const now = new Date()
        const currentWeekStart = getWeekStart(now)

        for (let i = 0; i < weeks.length; i++) {
          const expectedWeek = new Date(currentWeekStart)
          expectedWeek.setDate(expectedWeek.getDate() - (i * 7))
          const expectedStr = expectedWeek.toISOString().split('T')[0]

          if (weeks[i] === expectedStr || (i === 0 && isWithinLastWeek(weeks[i], currentWeekStart))) {
            currentStreak++
          } else {
            break
          }
        }

        setStreak(currentStreak)
        setLongestStreak(Math.max(currentStreak, longestStreak))
      } catch (err) {
        console.error('Failed to fetch streak:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStreak()
  }, [studentId])

  return { streak, longestStreak, loading }
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function isWithinLastWeek(weekStr, currentWeekStart) {
  const week = new Date(weekStr)
  const current = new Date(currentWeekStart)
  const diff = (current - week) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}
