import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AnimNum,
  Button,
  Confetti,
  DonutChart,
  Field,
  FinTip,
  Input,
  Toast,
} from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { usePaycheckSettings } from '../../hooks/usePaycheckSettings'
import { supabase } from '../../lib/supabase'
import { ACCOUNT_META, GRADES, formatCurrency } from '../../lib/constants'
import { ChevronRight, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  allocated: { label: 'Allocated', color: 'bg-sage-100 text-sage-700', icon: DollarSign },
  rejected: { label: 'Needs Changes', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
}

export const StudentPaycheck = () => {
  const { user, profile } = useAuth()
  const { settings } = usePaycheckSettings()
  const [view, setView] = useState('list') // 'list' or 'new' or 'detail'
  const [pastPaychecks, setPastPaychecks] = useState([])
  const [selectedPaycheck, setSelectedPaycheck] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [loading, setLoading] = useState(false)

  // Step 1: Log XP
  const [xpByDay, setXpByDay] = useState({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 })
  const [epicDays, setEpicDays] = useState({ mon: false, tue: false, wed: false, thu: false, fri: false })
  const [masteryTests, setMasteryTests] = useState([])
  const [smartGoal, setSmartGoal] = useState(0)
  const [other, setOther] = useState(0)
  const [jobDone, setJobDone] = useState(false)
  const [studentJob, setStudentJob] = useState(null)

  // Step 3: Allocate
  const [allocation, setAllocation] = useState({
    checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0,
  })

  // Fetch past paychecks
  useEffect(() => {
    if (!profile?.id) return
    fetchPastPaychecks()
    fetchJob()
  }, [profile?.id])

  const fetchPastPaychecks = async () => {
    try {
      setLoadingHistory(true)
      const { data, error } = await supabase
        .from('weekly_paychecks')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPastPaychecks(data || [])
    } catch (err) {
      console.error('Error fetching paychecks:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchJob = async () => {
    try {
      const { data } = await supabase
        .from('student_jobs')
        .select('job_id, jobs:job_id(*)')
        .eq('student_id', profile.id)
        .eq('is_active', true)
        .single()

      if (data?.jobs) setStudentJob(data.jobs)
    } catch (error) {
      // No job assigned, that's fine
    }
  }

  // Calculate earnings
  const totalXp = Object.values(xpByDay).reduce((sum, val) => sum + val, 0)
  const xpThreshold = settings.xp_threshold || 600
  const xpProgress = (totalXp / xpThreshold) * 100

  const calculateEarnings = () => {
    const epicCount = Object.values(epicDays).filter(Boolean).length
    const basePay = totalXp >= xpThreshold ? (settings.base_pay || 10) : 0
    const epicBonus = epicCount === 5 ? (settings.epic_week_bonus || 5) : 0
    const bonusXp = totalXp > xpThreshold
      ? Math.floor((totalXp - xpThreshold) / (settings.bonus_xp_per || 50)) * (settings.bonus_xp_rate || 1)
      : 0
    const masteryRewards = masteryTests.reduce((sum, test) => {
      if (test.score >= 100) return sum + (settings.mastery_perfect_pay || 100)
      if (test.score >= (settings.mastery_min_score || 90)) return sum + (settings.mastery_pass_pay || 20)
      return sum
    }, 0)
    const jobPay = jobDone && studentJob ? studentJob.weekly_pay || 0 : 0

    return {
      basePay: Math.round(basePay * 100) / 100,
      epicBonus,
      bonusXp: Math.round(bonusXp * 100) / 100,
      masteryRewards,
      jobPay,
      smartGoal: smartGoal || 0,
      other: other || 0,
    }
  }

  const earnings = calculateEarnings()
  const totalPaycheck = Object.values(earnings).reduce((sum, val) => sum + val, 0)

  // Week label for this paycheck
  const getWeekLabel = () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Check if a paycheck already exists for this week
  const currentWeekLabel = getWeekLabel()
  const existingThisWeek = pastPaychecks.find(p => p.week_label === currentWeekLabel)

  const handleSubmitPaycheck = async () => {
    if (totalPaycheck <= 0) {
      setToast({ type: 'error', text: 'No earnings to submit' })
      return
    }

    setLoading(true)
    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single()

      const { data: paycheckData, error: paycheckError } = await supabase
        .from('weekly_paychecks')
        .insert({
          student_id: profile.id,
          session_id: session?.id || null,
          week_label: currentWeekLabel,
          status: 'submitted',
          xp_mon: xpByDay.mon,
          xp_tue: xpByDay.tue,
          xp_wed: xpByDay.wed,
          xp_thu: xpByDay.thu,
          xp_fri: xpByDay.fri,
          epic_mon: epicDays.mon,
          epic_tue: epicDays.tue,
          epic_wed: epicDays.wed,
          epic_thu: epicDays.thu,
          epic_fri: epicDays.fri,
          base_pay: earnings.basePay,
          epic_bonus: earnings.epicBonus,
          xp_bonus: earnings.bonusXp,
          mastery_pay: earnings.masteryRewards,
          job_pay: earnings.jobPay,
          smart_goal: earnings.smartGoal,
          other_pay: earnings.other,
          total_earnings: totalPaycheck,
          job_completed: jobDone,
          job_id: studentJob?.id || null,
        })
        .select()
        .single()

      if (paycheckError) throw paycheckError

      // Insert mastery tests
      if (masteryTests.length > 0) {
        const testsToInsert = masteryTests
          .filter(t => t.subject && t.score > 0)
          .map(test => ({
            paycheck_id: paycheckData.id,
            student_id: profile.id,
            subject: test.subject,
            grade: test.grade,
            score: test.score,
            payout: test.score >= 100 ? (settings.mastery_perfect_pay || 100) :
              test.score >= (settings.mastery_min_score || 90) ? (settings.mastery_pass_pay || 20) : 0
          }))

        if (testsToInsert.length > 0) {
          await supabase.from('mastery_tests').insert(testsToInsert)
        }
      }

      setToast({ type: 'success', text: 'Paycheck submitted for review!' })
      resetForm()
      setView('list')
      await fetchPastPaychecks()
    } catch (error) {
      console.error('Error saving paycheck:', error)
      setToast({ type: 'error', text: 'Failed to save paycheck' })
    } finally {
      setLoading(false)
    }
  }

  const handleAllocatePaycheck = async () => {
    const allocTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0)
    if (Math.abs(allocTotal - selectedPaycheck.total_earnings) > 0.01) {
      setToast({ type: 'error', text: `Allocation must equal ${formatCurrency(selectedPaycheck.total_earnings)}` })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.rpc('allocate_paycheck', {
        p_paycheck_id: selectedPaycheck.id,
        p_checking: allocation.checking,
        p_savings: allocation.savings,
        p_sp500: allocation.sp500,
        p_nasdaq: allocation.nasdaq,
        p_bonus: allocation.bonus,
      })

      if (error) throw error

      setShowConfetti(true)
      setToast({ type: 'success', text: 'Paycheck allocated to your accounts!' })
      setTimeout(() => setShowConfetti(false), 3000)
      setView('list')
      setSelectedPaycheck(null)
      await fetchPastPaychecks()
    } catch (error) {
      console.error('Error allocating:', error)
      setToast({ type: 'error', text: error.message || 'Failed to allocate paycheck' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setXpByDay({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 })
    setEpicDays({ mon: false, tue: false, wed: false, thu: false, fri: false })
    setMasteryTests([])
    setSmartGoal(0)
    setOther(0)
    setJobDone(false)
    setAllocation({ checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0 })
  }

  const useSuggestedSplit = (total) => {
    setAllocation({
      checking: Math.round(total * 0.2 * 100) / 100,
      savings: Math.round(total * 0.3 * 100) / 100,
      sp500: Math.round(total * 0.25 * 100) / 100,
      nasdaq: Math.round(total * 0.15 * 100) / 100,
      bonus: Math.round(total * 0.1 * 100) / 100,
    })
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-400"></div>
      </div>
    )
  }

  // ─── PAYCHECK LIST VIEW ────────────────────────────
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-gray to-white p-6 pb-20">
        <Toast message={toast} />
        <Confetti active={showConfetti} />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Paychecks</h1>
          <p className="text-slate-600">Track your weekly earnings and allocations</p>
        </motion.div>

        <FinTip icon="💡" title="How Paychecks Work" color="from-blue-50 to-cyan-50">
          Each week, log your XP, epic days, mastery tests, and any bonuses. Your guide reviews and approves your paycheck, then you decide how to split it across your accounts. Think of it like a real job — you earn, it gets verified, then you budget!
        </FinTip>

        {/* New Paycheck Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 mb-6">
          {existingThisWeek ? (
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-center">
              <p className="text-slate-600 text-sm">
                You already submitted a paycheck for this week ({currentWeekLabel}).
                {existingThisWeek.status === 'verified' && (
                  <button
                    onClick={() => {
                      setSelectedPaycheck(existingThisWeek)
                      setAllocation({
                        checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0,
                      })
                      setView('allocate')
                    }}
                    className="ml-2 text-sage-600 font-semibold underline"
                  >
                    Allocate it now
                  </button>
                )}
              </p>
            </div>
          ) : (
            <Button full size="lg" onClick={() => { resetForm(); setView('new') }}>
              <DollarSign className="w-5 h-5 mr-2" />
              Log This Week's Paycheck
            </Button>
          )}
        </motion.div>

        {/* Past Paychecks */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Paycheck History</h2>

          {loadingHistory ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
            </div>
          ) : pastPaychecks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No paychecks yet. Log your first one!</p>
            </div>
          ) : (
            pastPaychecks.map((paycheck, idx) => {
              const statusConf = STATUS_CONFIG[paycheck.status] || STATUS_CONFIG.draft
              const StatusIcon = statusConf.icon

              return (
                <motion.div
                  key={paycheck.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (paycheck.status === 'verified') {
                      setSelectedPaycheck(paycheck)
                      setAllocation({ checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0 })
                      setView('allocate')
                    } else {
                      setSelectedPaycheck(paycheck)
                      setView('detail')
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-400 to-green-400 flex items-center justify-center text-white font-bold text-sm">
                        ${Math.round(paycheck.total_earnings || 0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{paycheck.week_label || 'Week'}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(paycheck.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConf.color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusConf.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Financial literacy */}
        <div className="mt-8">
          <FinTip icon="🏦" title="Why Budget Your Paycheck?" color="from-green-50 to-emerald-50">
            In real life, your paycheck doesn't all go to one place. Bills, savings, investments, and fun money all need their share. Learning to split your earnings now builds habits that'll serve you for life. The 50/30/20 rule suggests: 50% needs, 30% wants, 20% savings.
          </FinTip>
        </div>
      </div>
    )
  }

  // ─── PAYCHECK DETAIL VIEW ────────────────────────
  if (view === 'detail' && selectedPaycheck) {
    const p = selectedPaycheck
    const statusConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft
    const totalXpDetail = (p.xp_mon || 0) + (p.xp_tue || 0) + (p.xp_wed || 0) + (p.xp_thu || 0) + (p.xp_fri || 0)
    const epicCountDetail = [p.epic_mon, p.epic_tue, p.epic_wed, p.epic_thu, p.epic_fri].filter(Boolean).length

    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-gray to-white p-6 pb-20">
        <Toast message={toast} />

        <button
          onClick={() => { setView('list'); setSelectedPaycheck(null) }}
          className="text-sage-600 font-semibold mb-4 flex items-center gap-1 hover:underline"
        >
          ← Back to Paychecks
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{p.week_label || 'Paycheck'}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConf.color}`}>
                {statusConf.label}
              </span>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-slate-500">Total Earnings</p>
              <p className="text-4xl font-bold text-sage-600">{formatCurrency(p.total_earnings || 0)}</p>
            </div>

            {/* XP Summary */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => {
                const key = ['mon', 'tue', 'wed', 'thu', 'fri'][i]
                const xp = p[`xp_${key}`] || 0
                const epic = p[`epic_${key}`]
                return (
                  <div key={day} className="text-center p-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">{day}</p>
                    <p className="text-lg font-bold text-slate-900">{xp}</p>
                    {epic && <span className="text-xs">🔥</span>}
                  </div>
                )
              })}
            </div>

            <div className="text-sm text-slate-600 mb-4">
              Total XP: <span className="font-bold">{totalXpDetail}</span> / {xpThreshold}
              {epicCountDetail > 0 && <span className="ml-3">🔥 {epicCountDetail} epic days</span>}
            </div>

            {/* Earnings Breakdown */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Breakdown</h3>
              {p.base_pay > 0 && <div className="flex justify-between text-sm"><span className="text-slate-600">Base Pay</span><span className="font-semibold">{formatCurrency(p.base_pay)}</span></div>}
              {p.epic_bonus > 0 && <div className="flex justify-between text-sm text-amber-600"><span>🔥 Epic Bonus</span><span className="font-semibold">{formatCurrency(p.epic_bonus)}</span></div>}
              {p.xp_bonus > 0 && <div className="flex justify-between text-sm text-blue-600"><span>📈 XP Bonus</span><span className="font-semibold">{formatCurrency(p.xp_bonus)}</span></div>}
              {p.mastery_pay > 0 && <div className="flex justify-between text-sm text-sage-600"><span>📚 Mastery Tests</span><span className="font-semibold">{formatCurrency(p.mastery_pay)}</span></div>}
              {p.job_pay > 0 && <div className="flex justify-between text-sm text-teal-600"><span>💼 Job</span><span className="font-semibold">{formatCurrency(p.job_pay)}</span></div>}
              {p.smart_goal > 0 && <div className="flex justify-between text-sm text-blue-600"><span>🎯 SMART Goal</span><span className="font-semibold">{formatCurrency(p.smart_goal)}</span></div>}
              {p.other_pay > 0 && <div className="flex justify-between text-sm text-purple-600"><span>⭐ Other</span><span className="font-semibold">{formatCurrency(p.other_pay)}</span></div>}
            </div>

            {/* Allocation (if allocated) */}
            {p.status === 'allocated' && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-2">Allocation</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['checking', 'savings', 'sp500', 'nasdaq', 'bonus'].map(acct => {
                    const val = p[`alloc_${acct}`] || 0
                    if (val <= 0) return null
                    return (
                      <div key={acct} className="text-center p-2 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500 capitalize">{ACCOUNT_META[acct]?.label || acct}</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(val)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Action button if verified but not allocated */}
            {p.status === 'verified' && (
              <div className="mt-6">
                <Button full size="lg" onClick={() => {
                  setAllocation({ checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0 })
                  setView('allocate')
                }}>
                  Allocate This Paycheck
                </Button>
              </div>
            )}

            {p.status === 'submitted' && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                <Clock className="w-4 h-4 inline mr-1" />
                Waiting for your guide to approve this paycheck.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── ALLOCATE VIEW ────────────────────────────
  if (view === 'allocate' && selectedPaycheck) {
    const total = selectedPaycheck.total_earnings || 0
    const allocTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0)
    const isAllocValid = Math.abs(allocTotal - total) < 0.01

    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-gray to-white p-6 pb-20">
        <Toast message={toast} />
        <Confetti active={showConfetti} />

        <button
          onClick={() => { setView('detail'); }}
          className="text-sage-600 font-semibold mb-4 flex items-center gap-1 hover:underline"
        >
          ← Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Allocate Your Paycheck</h1>
            <p className="text-slate-600">
              {selectedPaycheck.week_label} — {formatCurrency(total)} to distribute
            </p>
          </div>

          <FinTip icon="📍" title="Smart Allocation" color="from-green-50 to-teal-50">
            Think about your goals. Need something soon? Put more in checking. Building an emergency fund? Boost savings. Playing the long game? Feed your investments. There's no single right answer — it's about YOUR priorities.
          </FinTip>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Your Split</h3>
              <Button size="sm" onClick={() => useSuggestedSplit(total)}>
                Use 20/30/25/15/10
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              {Object.entries(allocation).map(([account, value]) => {
                const meta = ACCOUNT_META[account]
                const percentage = total > 0 ? (value / total) * 100 : 0

                return (
                  <div key={account}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-slate-700">{meta?.label || account}</label>
                      <span className="text-xs text-slate-500">{percentage.toFixed(0)}%</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value || ''}
                      onChange={(e) => setAllocation({ ...allocation, [account]: parseFloat(e.target.value) || 0 })}
                      className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:border-sage-400 ${meta?.borderColor || 'border-slate-300'}`}
                      placeholder="0.00"
                    />
                  </div>
                )
              })}
            </div>

            <div className="border-t-2 border-slate-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Allocated</span>
                <span className="font-semibold">{formatCurrency(allocTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Paycheck Total</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold">Remaining</span>
                <span className={`font-bold ${isAllocValid ? 'text-sage-600' : 'text-rose-600'}`}>
                  {formatCurrency(Math.abs(total - allocTotal))}
                </span>
              </div>
              {isAllocValid && <p className="text-xs text-sage-600 font-semibold">✓ All funds allocated</p>}
            </div>
          </div>

          <Button full size="lg" disabled={!isAllocValid || loading} onClick={handleAllocatePaycheck}>
            {loading ? 'Allocating...' : 'Lock It In'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    )
  }

  // ─── NEW PAYCHECK VIEW ────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray to-white p-6 pb-20">
      <Toast message={toast} />

      <button
        onClick={() => setView('list')}
        className="text-sage-600 font-semibold mb-4 flex items-center gap-1 hover:underline"
      >
        ← Back to Paychecks
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Log Your Weekly Paycheck</h1>
          <p className="text-slate-600">Week of {currentWeekLabel}</p>
        </div>

        <FinTip icon="📊" title="How Earning Works" color="from-blue-50 to-cyan-50">
          Your paycheck is built from multiple sources: XP from daily work (hit {xpThreshold} XP for base pay), epic day bonuses, mastery test rewards, your job, and any SMART goal or other bonuses your guide awards. It mirrors real life — most adults have income from multiple sources too!
        </FinTip>

        {/* Daily XP */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Daily XP</h3>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {DAYS.map((day, idx) => {
              const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri'][idx]
              const isEpic = epicDays[dayKey]

              return (
                <div key={day} className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700 text-center">{day.slice(0, 3)}</label>
                  <motion.input
                    type="number"
                    min="0"
                    max="300"
                    value={xpByDay[dayKey] || ''}
                    onChange={(e) => setXpByDay({ ...xpByDay, [dayKey]: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-2 text-center text-lg font-bold border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-200"
                    whileFocus={{ scale: 1.05 }}
                    placeholder="0"
                  />
                  <button
                    onClick={() => setEpicDays({ ...epicDays, [dayKey]: !isEpic })}
                    className={`text-xs font-semibold py-1 rounded-lg transition-all ${isEpic ? 'bg-amber-300 text-amber-900' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {isEpic ? '🔥 Epic' : 'Epic'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Weekly XP Progress</span>
              <span className="text-sm font-bold text-slate-900">{totalXp} / {xpThreshold}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-green-400 to-sage-400 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {xpProgress >= 100 && <p className="text-xs text-sage-600 font-semibold mt-2">✓ XP threshold reached — base pay earned!</p>}
          </div>
        </div>

        {/* Job Card */}
        {studentJob && (
          <motion.div
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${jobDone ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}
            onClick={() => setJobDone(!jobDone)}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{studentJob.icon || '💼'}</span>
                <div>
                  <p className="font-bold text-slate-900">{studentJob.title}</p>
                  <p className="text-sm text-slate-600">+{formatCurrency(studentJob.weekly_pay || 0)}/week</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${jobDone ? 'bg-sage-400 border-sage-400' : 'border-slate-300'}`}>
                {jobDone && <span className="text-white text-sm">✓</span>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mastery Tests */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Mastery Tests</h3>
          <p className="text-xs text-slate-500 mb-3">
            Score {settings.mastery_min_score || 90}%+ = {formatCurrency(settings.mastery_pass_pay || 20)} | 100% = {formatCurrency(settings.mastery_perfect_pay || 100)}
          </p>

          {masteryTests.map((test, idx) => {
            const reward = test.score >= 100 ? (settings.mastery_perfect_pay || 100) :
              test.score >= (settings.mastery_min_score || 90) ? (settings.mastery_pass_pay || 20) : 0

            return (
              <motion.div key={idx} className="p-3 border border-slate-200 rounded-lg mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input type="text" value={test.subject} onChange={(e) => { const u = [...masteryTests]; u[idx].subject = e.target.value; setMasteryTests(u) }} placeholder="Subject" className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400 text-sm" />
                    <select value={test.grade} onChange={(e) => { const u = [...masteryTests]; u[idx].grade = e.target.value; setMasteryTests(u) }} className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400 text-sm">
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input type="number" min="0" max="100" value={test.score || ''} onChange={(e) => { const u = [...masteryTests]; u[idx].score = parseInt(e.target.value) || 0; setMasteryTests(u) }} placeholder="Score" className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400 text-sm" />
                  </div>
                  <button onClick={() => setMasteryTests(masteryTests.filter((_, i) => i !== idx))} className="p-1 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {reward > 0 && <p className="text-xs text-sage-600 font-semibold mt-1">+{formatCurrency(reward)}</p>}
              </motion.div>
            )
          })}

          {masteryTests.length < 6 && (
            <button onClick={() => setMasteryTests([...masteryTests, { subject: '', grade: 'K', score: 0 }])} className="text-sm font-semibold text-sage-600 hover:text-sage-700">
              + Add Mastery Test
            </button>
          )}
        </div>

        {/* SMART Goal and Other */}
        <div className="grid grid-cols-2 gap-4 bg-white rounded-xl p-6 shadow-lg">
          <Field label={`SMART Goal Bonus`}>
            <Input type="number" min="0" value={smartGoal || ''} onChange={(e) => setSmartGoal(parseInt(e.target.value) || 0)} placeholder="Amount" />
          </Field>
          <Field label="Other Income">
            <Input type="number" min="0" value={other || ''} onChange={(e) => setOther(parseInt(e.target.value) || 0)} placeholder="Amount" />
          </Field>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-lg space-y-3">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Earnings Breakdown</h3>
          <div className="space-y-2 text-sm">
            {earnings.basePay > 0 && <div className="flex justify-between"><span className="text-slate-600">Base Pay</span><span className="font-semibold">{formatCurrency(earnings.basePay)}</span></div>}
            {earnings.epicBonus > 0 && <div className="flex justify-between text-amber-600"><span>🔥 Epic Week Bonus</span><span className="font-semibold">{formatCurrency(earnings.epicBonus)}</span></div>}
            {earnings.bonusXp > 0 && <div className="flex justify-between text-blue-600"><span>📈 Bonus XP Pay</span><span className="font-semibold">{formatCurrency(earnings.bonusXp)}</span></div>}
            {earnings.masteryRewards > 0 && <div className="flex justify-between text-sage-600"><span>📚 Mastery Tests</span><span className="font-semibold">{formatCurrency(earnings.masteryRewards)}</span></div>}
            {earnings.jobPay > 0 && <div className="flex justify-between text-teal-600"><span>💼 Job</span><span className="font-semibold">{formatCurrency(earnings.jobPay)}</span></div>}
            {earnings.smartGoal > 0 && <div className="flex justify-between text-blue-600"><span>🎯 SMART Goal</span><span className="font-semibold">{formatCurrency(earnings.smartGoal)}</span></div>}
            {earnings.other > 0 && <div className="flex justify-between text-purple-600"><span>⭐ Other</span><span className="font-semibold">{formatCurrency(earnings.other)}</span></div>}

            <div className="border-t-2 border-slate-200 pt-2 mt-2 flex justify-between">
              <span className="font-bold text-slate-900">Total Paycheck</span>
              <span className="text-xl font-bold text-sage-600"><AnimNum value={totalPaycheck} prefix="$" /></span>
            </div>
          </div>
        </div>

        <Button full size="lg" onClick={handleSubmitPaycheck} disabled={loading || totalPaycheck <= 0}>
          {loading ? 'Submitting...' : 'Submit for Review'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-xs text-center text-slate-500">
          Your guide will review and approve your paycheck before you can allocate it.
        </p>
      </motion.div>
    </div>
  )
}
