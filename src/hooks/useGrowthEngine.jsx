import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const GROWTH_KEY = 'my_money_last_growth'
const MARKET_CACHE_KEY = 'my_money_market_cache'

/**
 * Fetches real market data from Yahoo Finance via a CORS proxy,
 * then calls the apply_account_growth RPC to update balances.
 * Runs at most once per calendar day per browser session.
 */
export const useGrowthEngine = (enabled = true) => {
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState(null)

  const fetchMarketReturn = async (symbol) => {
    try {
      // Use Yahoo Finance chart API for 2-day data to calculate daily return
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`
      const res = await fetch(url)
      if (!res.ok) return 0

      const json = await res.json()
      const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close
      if (!closes || closes.length < 2) return 0

      // Filter out null values and get last two valid closes
      const validCloses = closes.filter(c => c !== null && c !== undefined)
      if (validCloses.length < 2) return 0

      const prev = validCloses[validCloses.length - 2]
      const curr = validCloses[validCloses.length - 1]
      if (!prev || prev === 0) return 0

      const dailyReturn = ((curr - prev) / prev) * 100
      return Math.round(dailyReturn * 10000) / 10000 // 4 decimal places
    } catch (err) {
      console.warn(`Failed to fetch ${symbol} data:`, err)
      return 0
    }
  }

  const runGrowthEngine = useCallback(async (force = false) => {
    const today = new Date().toISOString().split('T')[0]
    const lastGrowth = localStorage.getItem(GROWTH_KEY)

    // Skip if already ran today (unless forced)
    if (!force && lastGrowth === today) {
      // Load cached market data
      try {
        const cached = JSON.parse(localStorage.getItem(MARKET_CACHE_KEY) || '{}')
        if (cached.date === today) {
          setMarketData(cached)
          setLastRun(today)
        }
      } catch {}
      return
    }

    setLoading(true)
    try {
      // 1. Fetch savings interest rate from settings
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      let savingsApy = 4.5
      if (sessions?.length > 0) {
        const { data: settings } = await supabase
          .from('paycheck_settings')
          .select('savings_interest_rate')
          .eq('session_id', sessions[0].id)
          .single()

        if (settings?.savings_interest_rate != null) {
          savingsApy = parseFloat(settings.savings_interest_rate)
        }
      }

      // 2. Fetch real market data
      const [sp500Return, nasdaqReturn] = await Promise.all([
        fetchMarketReturn('SPY'),
        fetchMarketReturn('QQQ')
      ])

      const data = {
        date: today,
        sp500_daily: sp500Return,
        nasdaq_daily: nasdaqReturn,
        savings_apy: savingsApy
      }

      // 3. Call the RPC function to apply growth
      const { data: result, error } = await supabase.rpc('apply_account_growth', {
        p_savings_apy: savingsApy,
        p_sp500_daily_pct: sp500Return,
        p_nasdaq_daily_pct: nasdaqReturn
      })

      if (error) {
        console.error('Growth engine RPC error:', error)
      } else {
        console.log('Growth engine result:', result)
      }

      // 4. Cache results
      localStorage.setItem(GROWTH_KEY, today)
      localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(data))
      setMarketData(data)
      setLastRun(today)
    } catch (err) {
      console.error('Growth engine error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      runGrowthEngine()
    }
  }, [enabled, runGrowthEngine])

  return {
    marketData,
    loading,
    lastRun,
    refresh: () => runGrowthEngine(true)
  }
}
