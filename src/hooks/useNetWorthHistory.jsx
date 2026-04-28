import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Builds a daily net-worth time series for a student from the transactions table.
 *
 * Approach: each transaction has a `balance_after` for its account. For every day,
 * keep the latest balance per account. Forward-fill across days. Sum per day → net worth.
 *
 * Returns { history: [{ date, total }, ...], loading }
 */
export const useNetWorthHistory = (studentId, days = 60) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      return
    }
    let cancelled = false

    const fetchHistory = async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data, error } = await supabase
        .from('transactions')
        .select('account_id, balance_after, created_at, accounts!inner(account_type)')
        .eq('student_id', studentId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true })

      if (cancelled) return
      if (error || !data) {
        console.error('useNetWorthHistory error:', error)
        setLoading(false)
        return
      }

      // For each day, track the latest balance per account type (last one wins).
      const perDay = {} // { 'YYYY-MM-DD': { checking, savings, sp500, nasdaq } }
      data.forEach((tx) => {
        const type = tx.accounts?.account_type
        if (!type || type === 'bonus' || type === 'roth') return
        const day = tx.created_at.slice(0, 10)
        if (!perDay[day]) perDay[day] = {}
        perDay[day][type] = Number(tx.balance_after)
      })

      // Walk forward in date order, carrying balances across days that didn't
      // touch a given account, summing per day.
      const dates = Object.keys(perDay).sort()
      const carry = {}
      const series = dates.map((date) => {
        Object.assign(carry, perDay[date])
        const total = Object.values(carry).reduce((s, v) => s + (v || 0), 0)
        return { date, total: Math.round(total * 100) / 100 }
      })

      // Prepend a $0 starting point one day before the earliest transaction so
      // the chart always tells the "started at zero, climbed to today" story.
      if (series.length > 0) {
        const earliest = new Date(series[0].date)
        earliest.setDate(earliest.getDate() - 1)
        series.unshift({ date: earliest.toISOString().slice(0, 10), total: 0 })
      }

      setHistory(series)
      setLoading(false)
    }

    fetchHistory()
    return () => {
      cancelled = true
    }
  }, [studentId, days])

  return { history, loading }
}
