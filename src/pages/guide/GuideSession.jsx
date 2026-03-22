import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FinTip, Button, Field, Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'

export const GuideSession = () => {
  const [activeSession, setActiveSession] = useState(null)
  const [sessionName, setSessionName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [savingsRate, setSavingsRate] = useState('')
  const [spRate, setSpRate] = useState('')
  const [nasdaqRate, setNasdaqRate] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchActiveSession()
  }, [])

  const fetchActiveSession = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      if (data && data.length > 0) {
        setActiveSession(data[0])
        setSavingsRate(data[0].savings_interest_rate || '')
        setSpRate(data[0].sp500_return_rate || '')
        setNasdaqRate(data[0].nasdaq_return_rate || '')
      }
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to load session' })
    } finally {
      setLoading(false)
    }
  }

  const createNewSession = async () => {
    if (!sessionName.trim() || !startDate) {
      setToast({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    try {
      setCreating(true)

      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          name: sessionName,
          start_date: startDate,
          is_active: true
        })
        .select()

      if (sessionError) throw sessionError

      const { error: settingsError } = await supabase
        .from('paycheck_settings')
        .insert({
          session_id: newSession[0].id,
          xp_threshold: 600,
          base_pay: 10,
          epic_week_bonus: 5,
          epic_days_required: 5,
          bonus_xp_rate: 1.00,
          bonus_xp_per: 50,
          mastery_pass_pay: 20,
          mastery_perfect_pay: 100,
          mastery_min_score: 90,
          transfer_fee_pct: 10,
          transfer_fee_invest_pct: 10,
          transfer_fee_savings_pct: 0,
          smart_goal_pay: 6,
          custom_bonuses: [{ id: 'smart_goal', name: 'SMART Goal', amount: 6, type: 'checkbox' }]
        })

      if (settingsError) throw settingsError

      setToast({ type: 'success', text: 'Session created successfully' })
      setSessionName('')
      setStartDate('')
      await fetchActiveSession()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to create session' })
    } finally {
      setCreating(false)
    }
  }

  const updateRates = async () => {
    try {
      setProcessing(true)

      const { error } = await supabase
        .from('sessions')
        .update({
          savings_interest_rate: parseFloat(savingsRate) || 0,
          sp500_return_rate: parseFloat(spRate) || 0,
          nasdaq_return_rate: parseFloat(nasdaqRate) || 0
        })
        .eq('id', activeSession.id)

      if (error) throw error
      setToast({ type: 'success', text: 'Rates updated' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to update rates' })
    } finally {
      setProcessing(false)
    }
  }

  const endSessionAndApply = async () => {
    if (!window.confirm('End this session and apply investment rates to all accounts? This action cannot be undone.')) {
      return
    }

    try {
      setProcessing(true)

      const { data: result, error } = await supabase.rpc('apply_session_rates', {
        p_session_id: activeSession.id
      })

      if (error) throw error

      const { error: endError } = await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', activeSession.id)

      if (endError) throw endError

      setToast({
        type: 'success',
        text: `Session ended. Applied rates to ${result || 0} accounts.`
      })

      setActiveSession(null)
      await fetchActiveSession()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to end session' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Session Management</h1>
        <p className="text-lg text-gray-500 dark:text-white/50">Configure and manage finance sessions</p>
      </motion.div>

      <FinTip
        icon="📊"
        title="How Investment Rates Work"
        color="from-amber-50 to-orange-50"
      >
        <p className="space-y-2">
          <div>Investment rates are applied to student accounts when you end a session. These represent annual percentage returns:</div>
          <div className="mt-2">
            <strong>Savings Interest:</strong> Applied to savings accounts<br />
            <strong>S&P 500 Return:</strong> Applied to S&P 500 accounts<br />
            <strong>NASDAQ Return:</strong> Applied to NASDAQ accounts
          </div>
          <div className="mt-2">For example, a 5% savings rate means a $100 account grows by $5 when the session ends.</div>
        </p>
      </FinTip>

      {activeSession ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-300 dark:border-green-800/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-3 h-3">
                <motion.div
                  className="absolute inset-0 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="absolute inset-0 bg-green-500 rounded-full" />
              </div>
              <h2 className="text-2xl font-extrabold text-green-900 dark:text-green-300">{activeSession.name}</h2>
            </div>

            <p className="text-green-800 dark:text-green-300">
              Session started: <span className="font-semibold">
                {new Date(activeSession.created_at).toLocaleDateString()}
              </span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-green-300 dark:border-green-800/30">
              <Field label="Savings Interest Rate (%)">
                <input
                  type="number"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/10"
                />
              </Field>
              <Field label="S&P 500 Return Rate (%)">
                <input
                  type="number"
                  value={spRate}
                  onChange={(e) => setSpRate(e.target.value)}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/10"
                />
              </Field>
              <Field label="NASDAQ Return Rate (%)">
                <input
                  type="number"
                  value={nasdaqRate}
                  onChange={(e) => setNasdaqRate(e.target.value)}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/10"
                />
              </Field>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={updateRates}
                disabled={processing}
              >
                Update Rates
              </Button>
              <Button
                onClick={endSessionAndApply}
                disabled={processing}
                variant="danger"
              >
                End Session & Apply Rates
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 dark:bg-[#1a1625]/50 space-y-4"
        >
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Start New Session</h2>
          <p className="text-gray-500 dark:text-white/50">Create a new finance session for your students.</p>

          <div className="space-y-4">
            <Field label="Session Name">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Spring 2024"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/10"
              />
            </Field>

            <Field label="Start Date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/10"
              />
            </Field>

            <Button
              onClick={createNewSession}
              disabled={creating}
              full
            >
              Start Session
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
