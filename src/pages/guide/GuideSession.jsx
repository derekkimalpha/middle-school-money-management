import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { FinTip, Button, Field, Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'

export default function GuideSession() {
  const [activeSession, setActiveSession] = useState(null)
  const [sessionName, setSessionName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [savingsRate, setSavingsRate] = useState('3.5')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState(null)
  const [marketData, setMarketData] = useState(null)
  const [marketLoading, setMarketLoading] = useState(true)

  // Fetch active session on mount
  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const { data, error } = await supabase
          .from('guide_sessions')
          .select('*')
          .eq('is_active', true)
          .maybeSingle()

        if (error) throw error
        setActiveSession(data)
        if (data) {
          setSavingsRate(data.savings_interest_rate?.toString() || '3.5')
        }
      } catch (err) {
        console.error('Error fetching active session:', err)
        setToast({ type: 'error', message: 'Failed to load session' })
      } finally {
        setLoading(false)
      }
    }

    fetchActiveSession()
  }, [])

  // Fetch market data on mount and set up interval
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setMarketLoading(true)
        const spyData = await fetchYahooFinanceData('SPY')
        const qqqData = await fetchYahooFinanceData('QQQ')

        setMarketData({
          spy: spyData,
          qqq: qqqData,
        })
      } catch (err) {
        console.error('Error fetching market data:', err)
        setMarketData(null)
      } finally {
        setMarketLoading(false)
      }
    }

    fetchMarketData()

    // Refresh market data every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch data from Yahoo Finance API
  const fetchYahooFinanceData = async (symbol) => {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`
      )
      const data = await response.json()

      if (!data.chart.result || data.chart.result.length === 0) {
        throw new Error('No data returned')
      }

      const result = data.chart.result[0]
      const timestamps = result.timestamp
      const closes = result.indicators.quote[0].close
      const opens = result.indicators.quote[0].open

      // Get current price (last close)
      const currentPrice = closes[closes.length - 1]
      // Get previous close (first day in range)
      const previousPrice = opens[0]
      // Get first day close for 1-month calculation
      const monthAgoPrice = closes[0]

      // Calculate daily change
      const dailyChange = currentPrice - previousPrice
      const dailyChangePercent = ((dailyChange / previousPrice) * 100).toFixed(2)

      // Calculate 1-month change
      const monthChange = currentPrice - monthAgoPrice
      const monthChangePercent = ((monthChange / monthAgoPrice) * 100).toFixed(2)

      return {
        symbol,
        currentPrice: currentPrice.toFixed(2),
        dailyChange: dailyChange.toFixed(2),
        dailyChangePercent,
        monthChangePercent,
      }
    } catch (err) {
      console.error(`Error fetching ${symbol} data:`, err)
      return null
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    if (!sessionName.trim()) {
      setToast({ type: 'error', message: 'Please enter a session name' })
      return
    }

    setCreating(true)
    try {
      const { error } = await supabase.from('guide_sessions').insert([
        {
          name: sessionName,
          start_date: startDate || new Date().toISOString().split('T')[0],
          savings_interest_rate: parseFloat(savingsRate) || 3.5,
          is_active: true,
        },
      ])

      if (error) throw error

      setToast({
        type: 'success',
        message: `Session "${sessionName}" created successfully`,
      })
      setSessionName('')
      setStartDate('')
      setSavingsRate('3.5')

      // Refresh active session
      const { data } = await supabase
        .from('guide_sessions')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      setActiveSession(data)
    } catch (err) {
      console.error('Error creating session:', err)
      setToast({ type: 'error', message: 'Failed to create session' })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateRates = async () => {
    if (!activeSession) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('guide_sessions')
        .update({
          savings_interest_rate: parseFloat(savingsRate) || 3.5,
        })
        .eq('id', activeSession.id)

      if (error) throw error

      setToast({
        type: 'success',
        message: 'Savings interest rate updated successfully',
      })

      // Refresh session
      const { data } = await supabase
        .from('guide_sessions')
        .select('*')
        .eq('id', activeSession.id)
        .single()

      setActiveSession(data)
    } catch (err) {
      console.error('Error updating rates:', err)
      setToast({ type: 'error', message: 'Failed to update rates' })
    } finally {
      setProcessing(false)
    }
  }

  const handleEndSession = async () => {
    if (!activeSession || !marketData?.spy || !marketData?.qqq) {
      setToast({
        type: 'error',
        message: 'Market data not available. Please try again.',
      })
      return
    }

    setProcessing(true)
    try {
      // Convert percentage strings to decimals for storage
      const sp500Rate = parseFloat(marketData.spy.monthChangePercent) / 100
      const nasdaqRate = parseFloat(marketData.qqq.monthChangePercent) / 100

      const { error } = await supabase
        .from('guide_sessions')
        .update({
          is_active: false,
          sp500_return_rate: sp500Rate,
          nasdaq_return_rate: nasdaqRate,
        })
        .eq('id', activeSession.id)

      if (error) throw error

      setToast({
        type: 'success',
        message: `Session ended. Applied rates - S&P 500: ${(sp500Rate * 100).toFixed(2)}%, NASDAQ: ${(nasdaqRate * 100).toFixed(2)}%`,
      })

      setActiveSession(null)
      setSavingsRate('3.5')
    } catch (err) {
      console.error('Error ending session:', err)
      setToast({ type: 'error', message: 'Failed to end session' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper-warm dark:bg-ink-900">
        <div className="text-pencil dark:text-chalk">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-warm dark:bg-ink-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-hand text-ink dark:text-chalk mb-2">
            Guide Session Manager
          </h1>
          <p className="text-pencil dark:text-stone-300">
            Manage your financial literacy session settings
          </p>
        </div>

        {/* Market Performance Card */}
        {marketLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-6 bg-teal-50 dark:bg-teal-950 border-2 border-teal text-center rounded-lg"
          >
            <p className="text-pencil dark:text-stone-300">
              Loading market data...
            </p>
          </motion.div>
        ) : marketData?.spy && marketData?.qqq ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold font-hand text-ink dark:text-chalk mb-4">
              Market Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SPY Card */}
              <div className="p-6 bg-white dark:bg-ink-800 border-2 border-teal rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-ink dark:text-chalk">
                      SPY
                    </h3>
                    <p className="text-sm text-pencil dark:text-stone-400">
                      S&P 500 ETF
                    </p>
                  </div>
                  {parseFloat(marketData.spy.dailyChangePercent) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-teal" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-rose" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-pencil dark:text-stone-400">
                      Current Price
                    </p>
                    <p className="text-2xl font-bold text-ink dark:text-chalk">
                      ${marketData.spy.currentPrice}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-pencil dark:text-stone-400 mb-1">
                        Daily Change
                      </p>
                      <p
                        className={`font-bold text-sm ${
                          parseFloat(marketData.spy.dailyChangePercent) >= 0
                            ? 'text-teal'
                            : 'text-rose'
                        }`}
                      >
                        ${marketData.spy.dailyChange}
                        <span className="ml-1">
                          ({marketData.spy.dailyChangePercent}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-pencil dark:text-stone-400 mb-1">
                        1-Month Change
                      </p>
                      <p
                        className={`font-bold text-sm ${
                          parseFloat(marketData.spy.monthChangePercent) >= 0
                            ? 'text-teal'
                            : 'text-rose'
                        }`}
                      >
                        {marketData.spy.monthChangePercent}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 dark:border-ink-700">
                    <p className="text-xs text-pencil dark:text-stone-400 italic">
                      Tracks student S&P 500 investment accounts
                    </p>
                  </div>
                </div>
              </div>

              {/* QQQ Card */}
              <div className="p-6 bg-white dark:bg-ink-800 border-2 border-teal rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-ink dark:text-chalk">
                      QQQ
                    </h3>
                    <p className="text-sm text-pencil dark:text-stone-400">
                      NASDAQ-100 ETF
                    </p>
                  </div>
                  {parseFloat(marketData.qqq.dailyChangePercent) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-plum" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-rose" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-pencil dark:text-stone-400">
                      Current Price
                    </p>
                    <p className="text-2xl font-bold text-ink dark:text-chalk">
                      ${marketData.qqq.currentPrice}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-pencil dark:text-stone-400 mb-1">
                        Daily Change
                      </p>
                      <p
                        className={`font-bold text-sm ${
                          parseFloat(marketData.qqq.dailyChangePercent) >= 0
                            ? 'text-plum'
                            : 'text-rose'
                        }`}
                      >
                        ${marketData.qqq.dailyChange}
                        <span className="ml-1">
                          ({marketData.qqq.dailyChangePercent}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-pencil dark:text-stone-400 mb-1">
                        1-Month Change
                      </p>
                      <p
                        className={`font-bold text-sm ${
                          parseFloat(marketData.qqq.monthChangePercent) >= 0
                            ? 'text-plum'
                            : 'text-rose'
                        }`}
                      >
                        {marketData.qqq.monthChangePercent}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 dark:border-ink-700">
                    <p className="text-xs text-pencil dark:text-stone-400 italic">
                      Tracks student NASDAQ investment accounts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Active Session Card */}
        {activeSession ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-8 bg-white dark:bg-ink-800 border-3 border-sage rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-bold font-hand text-ink dark:text-chalk mb-6">
              Active Session: {activeSession.name}
            </h2>

            <div className="space-y-6 mb-8">
              {/* Read-only S&P 500 Rate from Market Data */}
              <div className="p-4 bg-teal-50 dark:bg-teal-950 rounded-lg border border-teal-200 dark:border-teal-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-pencil dark:text-stone-300 mb-1">
                      S&P 500 Return Rate
                    </p>
                    <p className="text-3xl font-bold text-teal dark:text-teal-300">
                      {marketData?.spy
                        ? `${marketData.spy.monthChangePercent}%`
                        : 'Loading...'}
                    </p>
                    <p className="text-xs text-pencil dark:text-stone-400 mt-1">
                      From real SPY market data
                    </p>
                  </div>
                </div>
              </div>

              {/* Read-only NASDAQ Rate from Market Data */}
              <div className="p-4 bg-plum-50 dark:bg-plum-950 rounded-lg border border-plum-200 dark:border-plum-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-pencil dark:text-stone-300 mb-1">
                      NASDAQ Return Rate
                    </p>
                    <p className="text-3xl font-bold text-plum dark:text-plum-300">
                      {marketData?.qqq
                        ? `${marketData.qqq.monthChangePercent}%`
                        : 'Loading...'}
                    </p>
                    <p className="text-xs text-pencil dark:text-stone-400 mt-1">
                      From real QQQ market data
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Savings Interest Rate */}
              <div>
                <Field
                  label="Savings Interest Rate (%)"
                  type="number"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(e.target.value)}
                  placeholder="3.5"
                  step="0.1"
                  min="0"
                  max="100"
                  disabled={processing}
                />
                <p className="text-xs text-pencil dark:text-stone-400 mt-2">
                  This is the only rate you can customize for your session
                </p>
              </div>

              {/* Info Tip */}
              <FinTip type="info">
                <p className="font-semibold mb-2">How Returns Work</p>
                <p className="text-sm">
                  The S&P 500 and NASDAQ returns are based on real market data
                  from SPY and QQQ ETFs respectively. These rates are
                  automatically applied when you end the session based on the
                  1-month performance shown above. Only the savings interest rate
                  is configurable.
                </p>
              </FinTip>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <Button
                onClick={handleUpdateRates}
                disabled={processing}
                variant="primary"
                className="flex-1"
              >
                {processing ? 'Updating...' : 'Update Savings Rate'}
              </Button>
              <Button
                onClick={handleEndSession}
                disabled={processing || !marketData?.spy || !marketData?.qqq}
                variant="danger"
                className="flex-1"
              >
                {processing ? 'Processing...' : 'End Session & Apply Rates'}
              </Button>
            </div>

            {/* Start Date Display */}
            <p className="text-xs text-pencil dark:text-stone-400 mt-4">
              Started:{' '}
              {new Date(activeSession.start_date).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }
              )}
            </p>
          </motion.div>
        ) : (
          /* Create Session Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white dark:bg-ink-800 border-3 border-amber rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-bold font-hand text-ink dark:text-chalk mb-6">
              Create New Session
            </h2>

            <form onSubmit={handleCreateSession} className="space-y-6">
              <Field
                label="Session Name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Spring 2026 Class A"
                disabled={creating}
              />

              <Field
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={creating}
              />

              <Field
                label="Savings Interest Rate (%)"
                type="number"
                value={savingsRate}
                onChange={(e) => setSavingsRate(e.target.value)}
                placeholder="3.5"
                step="0.1"
                min="0"
                max="100"
                disabled={creating}
              />

              <FinTip type="info">
                <p className="font-semibold mb-2">About Market Rates</p>
                <p className="text-sm">
                  When you create a session, the S&P 500 and NASDAQ return rates
                  will be automatically populated from real market data (SPY and
                  QQQ ETFs) when the session ends. You only need to set the
                  savings interest rate now.
                </p>
              </FinTip>

              <Button
                type="submit"
                disabled={creating}
                variant="primary"
                className="w-full"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </Button>
            </form>
          </motion.div>
        )}
      </motion.div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
