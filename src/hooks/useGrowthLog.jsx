import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches actual earned interest/gains from the growth_log table.
 * Returns totals by account type and a timeline for charts.
 */
export const useGrowthLog = (studentId) => {
  const [earnings, setEarnings] = useState({
    total: 0,
    savings: 0,
    sp500: 0,
    nasdaq: 0,
    timeline: [],
    loading: true,
  })

  useEffect(() => {
    if (!studentId) return

    const fetchGrowthLog = async () => {
      try {
        const { data, error } = await supabase
          .from('growth_log')
          .select('*')
          .eq('student_id', studentId)
          .order('growth_date', { ascending: true })

        if (error) throw error

        const logs = data || []

        // Sum by account type
        let savingsTotal = 0
        let sp500Total = 0
        let nasdaqTotal = 0

        // Build timeline (aggregate by date)
        const byDate = {}

        logs.forEach(log => {
          const amount = Number(log.growth_amount) || 0
          const date = log.growth_date

          if (log.account_type === 'savings') savingsTotal += amount
          else if (log.account_type === 'sp500') sp500Total += amount
          else if (log.account_type === 'nasdaq') nasdaqTotal += amount

          if (!byDate[date]) {
            byDate[date] = { date, savings: 0, sp500: 0, nasdaq: 0, total: 0 }
          }
          byDate[date][log.account_type] = (byDate[date][log.account_type] || 0) + amount
          byDate[date].total += amount
        })

        const timeline = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))

        // Cumulative timeline for charts
        let cumulative = 0
        const cumulativeTimeline = timeline.map(day => {
          cumulative += day.total
          return { ...day, cumulative }
        })

        setEarnings({
          total: savingsTotal + sp500Total + nasdaqTotal,
          savings: savingsTotal,
          sp500: sp500Total,
          nasdaq: nasdaqTotal,
          timeline: cumulativeTimeline,
          loading: false,
        })
      } catch (err) {
        console.error('Growth log fetch error:', err)
        setEarnings(prev => ({ ...prev, loading: false }))
      }
    }

    fetchGrowthLog()
  }, [studentId])

  return earnings
}
