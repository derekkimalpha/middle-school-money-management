import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AnimNum,
  Button,
  Confetti,
  FinTip,
  Input,
  Toast,
} from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { usePaycheckSettings } from '../../hooks/usePaycheckSettings'
import { supabase } from '../../lib/supabase'
import { ACCOUNT_META, GRADES, formatCurrency } from '../../lib/constants'
import { ChevronRight, Trash2, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/50' },
  submitted: { label: 'Submitted', color: 'bg-stone-100/50 dark:bg-stone-500/[0.06] text-stone-700 dark:text-stone-400' },
  verified: { label: 'Approved', color: 'bg-sage-100/50 dark:bg-sage-500/[0.06] text-sage-700 dark:text-sage-400' },
  allocated: { label: 'Allocated', color: 'bg-sage-100/50 dark:bg-sage-500/[0.06] text-sage-700 dark:text-sage-400' },
  rejected: { label: 'Returned — Please Fix', color: 'bg-red-500/10 dark:bg-red-400/10 text-red-600 dark:text-red-400' },
}

export const StudentPaycheck = () => {
  const { user, profile } = useAuth()
  const { settings } = usePaycheckSettings()
  const [view, setView] = useState('list')
  const [pastPaychecks, setPastPaychecks] = useState([])
  const [selectedPaycheck, setSelectedPaycheck] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [toast, setToast] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [loading, setLoading] = useState(false)

  // New paycheck form state
  const [xpByDay, setXpByDay] = useState({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 })
  const [epicDays, setEpicDays] = useState({ mon: false, tue: false, wed: false, thu: false, fri: false })
  const [masteryTests, setMasteryTests] = useState([])
  const [customBonuses, setCustomBonuses] = useState({})
  const [jobDone, setJobDone] = useState(false)
  const [studentJob, setStudentJob] = useState(null)

  // Allocation state
  const [allocation, setAllocation] = useState({
    checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0,
  })

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
      // No job assigned
    }
  }

  // ── Derived calculations ──
  const totalXp = Object.values(xpByDay).reduce((sum, val) => sum + val, 0)
  const xpThreshold = settings.xp_threshold || 600
  const xpProgress = (totalXp / xpThreshold) * 100

  const calculateEarnings = () => {
    const epicCount = Object.values(epicDays).filter(Boolean).length
    const basePay = totalXp >= xpThreshold ? (settings.base_pay || 10) : 0
    const epicDaysRequired = settings.epic_days_required || 5
    const epicBonus = epicCount >= epicDaysRequired ? (settings.epic_week_bonus || 5) : 0
    const bonusXp = totalXp > xpThreshold
      ? Math.floor((totalXp - xpThreshold) / (settings.bonus_xp_per || 50)) * (settings.bonus_xp_rate || 1)
      : 0
    const masteryRewards = masteryTests.reduce((sum, test) => {
      if (test.score >= 100) return sum + (settings.mastery_perfect_pay || 100)
      if (test.score >= (settings.mastery_min_score || 90)) return sum + (settings.mastery_pass_pay || 20)
      return sum
    }, 0)
    const jobPay = jobDone && studentJob ? studentJob.weekly_pay || 0 : 0
    const customBonusTotal = (settings.custom_bonuses || []).reduce((sum, bonus) => {
      const entry = customBonuses[bonus.id]
      if (!entry) return sum
      if (bonus.type === 'checkbox' && entry.claimed) return sum + (bonus.amount || 0)
      if (bonus.type === 'student_amount' && entry.amount > 0) return sum + entry.amount
      return sum
    }, 0)

    return {
      basePay: Math.round(basePay * 100) / 100,
      epicBonus,
      bonusXp: Math.round(bonusXp * 100) / 100,
      masteryRewards,
      jobPay,
      customBonusTotal: Math.round(customBonusTotal * 100) / 100,
    }
  }

  const earnings = calculateEarnings()
  const totalPaycheck = Object.values(earnings).reduce((sum, val) => sum + val, 0)

  const getWeekLabel = () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

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
          xp_mon: xpByDay.mon, xp_tue: xpByDay.tue, xp_wed: xpByDay.wed,
          xp_thu: xpByDay.thu, xp_fri: xpByDay.fri,
          epic_mon: epicDays.mon, epic_tue: epicDays.tue, epic_wed: epicDays.wed,
          epic_thu: epicDays.thu, epic_fri: epicDays.fri,
          base_pay: earnings.basePay,
          epic_bonus: earnings.epicBonus,
          xp_bonus: earnings.bonusXp,
          mastery_pay: earnings.masteryRewards,
          job_pay: earnings.jobPay,
          smart_goal: 0,
          other_pay: earnings.customBonusTotal,
          total_earnings: totalPaycheck,
          custom_bonus_data: (settings.custom_bonuses || [])
            .filter(b => {
              const entry = customBonuses[b.id]
              if (!entry) return false
              return (b.type === 'checkbox' && entry.claimed) || (b.type === 'student_amount' && entry.amount > 0)
            })
            .map(b => ({
              id: b.id, name: b.name, type: b.type,
              amount: b.type === 'checkbox' ? b.amount : (customBonuses[b.id]?.amount || 0)
            })),
          job_completed: jobDone,
          job_id: studentJob?.id || null,
        })
        .select()
        .single()

      if (paycheckError) throw paycheckError

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
    setXpByDay({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 })
    setEpicDays({ mon: false, tue: false, wed: false, thu: false, fri: false })
    setMasteryTests([])
    setCustomBonuses({})
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
      <div className="flex items-center justify-center h-screen bg-[#faf8f4] dark:bg-[#1e2a1e]">
        <motion.div
          className="w-10 h-10 border-[3px] border-gray-200 border-t-stone-600 rounded-full dark:border-white/10 dark:border-t-stone-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     LIST VIEW — Paycheck history + create CTA
     ═══════════════════════════════════════════════ */
  if (view === 'list') {
    return (
      <div className="space-y-6 p-8 pb-24">
        <Toast message={toast} />
        <Confetti active={showConfetti} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[12px] font-semibold text-ink-faint dark:text-white/30 uppercase tracking-wider">Weekly</p>
          <h1 className="text-4xl font-extrabold text-ink dark:text-chalk-white font-hand tracking-[-0.02em] mt-1">Paychecks</h1>
        </motion.div>

        <div className="space-y-4">
          {/* New paycheck CTA */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {existingThisWeek ? (
              <div className="bg-white dark:bg-white/[0.04] rounded-sm border border-black/[0.08] dark:border-white/[0.06] p-5 text-center shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
                <p className="text-ink-muted dark:text-white/40 text-sm">
                  Paycheck submitted for {currentWeekLabel}.
                  {existingThisWeek.status === 'verified' && (
                    <button
                      onClick={() => {
                        setSelectedPaycheck(existingThisWeek)
                        setAllocation({ checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0 })
                        setView('allocate')
                      }}
                      className="ml-2 text-sage-600 font-semibold hover:underline"
                    >
                      Allocate now →
                    </button>
                  )}
                </p>
              </div>
            ) : (
              <button
                onClick={() => { resetForm(); setView('new') }}
                className="w-full bg-ink dark:bg-chalk-white hover:bg-ink/90 dark:hover:bg-chalk-white/90 text-white dark:text-ink rounded-sm p-5 flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.06)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 dark:bg-black/10 rounded-sm flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Log This Week's Paycheck</p>
                    <p className="text-sm opacity-60">Week of {currentWeekLabel}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-40" />
              </button>
            )}
          </motion.div>

          {/* History */}
          <div>
            <h2 className="text-[12px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">History</h2>

            {loadingHistory ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/[0.04] rounded-sm animate-pulse" />)}
              </div>
            ) : pastPaychecks.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06]">
                <DollarSign className="w-10 h-10 mx-auto mb-3 text-black/20 dark:text-white/15" />
                <p className="text-[13px] text-gray-400 dark:text-white/30">No paychecks yet</p>
                <p className="text-[11px] text-gray-300 dark:text-white/20 mt-1">Log your first one above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastPaychecks.map((paycheck, idx) => {
                  const statusConf = STATUS_CONFIG[paycheck.status] || STATUS_CONFIG.draft
                  return (
                    <motion.div
                      key={paycheck.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06] p-4 hover:border-black/[0.12] dark:hover:border-white/[0.12] transition-all cursor-pointer"
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
                          <div className="w-10 h-10 rounded-sm bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center font-bold text-sm text-ink dark:text-chalk-white/70">
                            ${Math.round(paycheck.total_earnings || 0)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-ink dark:text-chalk-white">{paycheck.week_label || 'Week'}</p>
                            <p className="text-[11px] text-gray-400 dark:text-white/30">
                              {new Date(paycheck.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-black/20 dark:text-white/20" />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Learn tip */}
          <details className="bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06] group">
            <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-lg">🏦</span>
              <span className="text-sm font-semibold text-ink dark:text-chalk-white flex-1">Why Budget Your Paycheck?</span>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20 transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-500 dark:text-white/40 leading-relaxed border-t border-gray-200 dark:border-white/[0.06] pt-3">
              In real life, your paycheck doesn't all go to one place. Learning to split your earnings now builds habits that'll serve you for life. The 50/30/20 rule suggests: 50% needs, 30% wants, 20% savings.
            </div>
          </details>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     DETAIL VIEW — Read-only paycheck breakdown
     ═══════════════════════════════════════════════ */
  if (view === 'detail' && selectedPaycheck) {
    const p = selectedPaycheck
    const statusConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft
    const totalXpDetail = DAY_KEYS.reduce((sum, k) => sum + (p[`xp_${k}`] || 0), 0)
    const epicCountDetail = DAY_KEYS.filter(k => p[`epic_${k}`]).length

    return (
      <div className="space-y-6 p-8">
        <Toast message={toast} />

        <button
          onClick={() => { setView('list'); setSelectedPaycheck(null) }}
          className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 font-semibold mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back to Paychecks
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ink dark:text-chalk-white">{p.week_label || 'Paycheck'}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConf.color}`}>
                {statusConf.label}
              </span>
            </div>

            <div className="text-center mb-6">
              <p className="text-[12px] text-gray-400 dark:text-white/30 uppercase tracking-wider">Total Earnings</p>
              <p className="text-3xl font-bold text-ink dark:text-chalk-white tabular-nums">{formatCurrency(p.total_earnings || 0)}</p>
            </div>

            {/* XP grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {DAY_LABELS.map((day, i) => {
                const xp = p[`xp_${DAY_KEYS[i]}`] || 0
                const epic = p[`epic_${DAY_KEYS[i]}`]
                return (
                  <div key={day} className="text-center p-2 rounded-sm bg-gray-50 dark:bg-white/[0.03]">
                    <p className="text-[11px] text-gray-400 dark:text-white/30">{day}</p>
                    <p className="text-lg font-bold text-ink dark:text-chalk-white tabular-nums">{xp}</p>
                    {epic && <span className="text-xs">🔥</span>}
                  </div>
                )
              })}
            </div>

            <div className="text-sm text-gray-500 dark:text-white/40 mb-4">
              Total XP: <span className="font-bold">{totalXpDetail}</span> / {xpThreshold}
              {epicCountDetail > 0 && <span className="ml-3">🔥 {epicCountDetail} epic days</span>}
            </div>

            {/* Earnings breakdown */}
            <div className="space-y-2 border-t border-gray-200 dark:border-white/[0.06] pt-4">
              <h3 className="font-semibold text-ink dark:text-chalk-white mb-2">Breakdown</h3>
              {p.base_pay > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-white/40">Base Pay</span><span className="font-semibold">{formatCurrency(p.base_pay)}</span></div>}
              {p.epic_bonus > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>🔥 Epic Bonus</span><span className="font-semibold">{formatCurrency(p.epic_bonus)}</span></div>}
              {p.xp_bonus > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>📈 XP Bonus</span><span className="font-semibold">{formatCurrency(p.xp_bonus)}</span></div>}
              {p.mastery_pay > 0 && <div className="flex justify-between text-sm text-sage-600 dark:text-sage-400"><span>📚 Mastery Tests</span><span className="font-semibold">{formatCurrency(p.mastery_pay)}</span></div>}
              {p.job_pay > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>💼 Job</span><span className="font-semibold">{formatCurrency(p.job_pay)}</span></div>}
              {p.smart_goal > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>🎯 SMART Goal</span><span className="font-semibold">{formatCurrency(p.smart_goal)}</span></div>}
              {p.other_pay > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>⭐ Other</span><span className="font-semibold">{formatCurrency(p.other_pay)}</span></div>}
            </div>

            {/* Allocation (if already allocated) */}
            {p.status === 'allocated' && (
              <div className="mt-4 border-t border-gray-200 dark:border-white/[0.06] pt-4">
                <h3 className="font-semibold text-ink dark:text-chalk-white mb-2">Allocation</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['checking', 'savings', 'sp500', 'nasdaq', 'bonus'].map(acct => {
                    const val = p[`alloc_${acct}`] || 0
                    if (val <= 0) return null
                    return (
                      <div key={acct} className="text-center p-2 rounded-sm bg-gray-50 dark:bg-white/[0.03]">
                        <p className="text-[11px] text-gray-400 dark:text-white/30 capitalize">{ACCOUNT_META[acct]?.label || acct}</p>
                        <p className="text-sm font-bold text-ink dark:text-chalk-white tabular-nums">{formatCurrency(val)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
              <div className="mt-4 p-3 rounded-sm bg-stone-500/[0.06] dark:bg-stone-400/[0.06] border border-stone-500/20 dark:border-stone-400/10 text-sm text-stone-600 dark:text-stone-400">
                <Clock className="w-4 h-4 inline mr-1" />
                Waiting for your guide to approve this paycheck.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     ALLOCATE VIEW — Split approved paycheck
     ═══════════════════════════════════════════════ */
  if (view === 'allocate' && selectedPaycheck) {
    const total = selectedPaycheck.total_earnings || 0
    const allocTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0)
    const isAllocValid = Math.abs(allocTotal - total) < 0.01

    return (
      <div className="space-y-6 p-8">
        <Toast message={toast} />
        <Confetti active={showConfetti} />

        <button
          onClick={() => setView('detail')}
          className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 font-semibold mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-ink dark:text-chalk-white tracking-[-0.02em]">Allocate Your Paycheck</h1>
            <p className="text-[13px] text-gray-500 dark:text-white/40 mt-1">
              {selectedPaycheck.week_label} — {formatCurrency(total)} to distribute
            </p>
          </div>

          <FinTip icon="📍" title="Smart Allocation" color="from-stone-50 to-stone-100">
            Think about your goals. Need something soon? Put more in checking. Building an emergency fund? Boost savings. Playing the long game? Feed your investments.
          </FinTip>

          <div className="bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-semibold text-ink dark:text-chalk-white">Your Split</h3>
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
                      <label className="text-[13px] font-semibold text-ink dark:text-chalk-white/70">{meta?.label || account}</label>
                      <span className="text-[11px] text-gray-400 dark:text-white/30">{percentage.toFixed(0)}%</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value || ''}
                      onChange={(e) => setAllocation({ ...allocation, [account]: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-stone-200 dark:focus:ring-stone-500/10 bg-white dark:bg-white/[0.04] dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                )
              })}
            </div>

            <div className="border-t border-gray-200 dark:border-white/[0.06] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-white/40">Allocated</span>
                <span className="font-semibold">{formatCurrency(allocTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-white/40">Paycheck Total</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold">Remaining</span>
                <span className={`font-bold ${isAllocValid ? 'text-sage-600 dark:text-sage-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(Math.abs(total - allocTotal))}
                </span>
              </div>
              {isAllocValid && <p className="text-[11px] text-sage-600 dark:text-sage-400 font-semibold">✓ All funds allocated</p>}
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

  /* ═══════════════════════════════════════════════
     NEW PAYCHECK VIEW — Single-scroll form with sticky total
     ═══════════════════════════════════════════════ */
  return (
    <div className="relative pb-28">
      <div className="space-y-4 p-8">
        <Toast message={toast} />

        {/* Header */}
        <div className="mb-2">
          <button
            onClick={() => setView('list')}
            className="text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white/80 text-[13px] font-medium mb-3 flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-extrabold text-ink dark:text-chalk-white tracking-[-0.02em]">Log Paycheck</h1>
          <p className="text-[13px] text-gray-500 dark:text-white/40 mt-1">Week of {currentWeekLabel}</p>
        </div>

        <div className="max-w-2xl space-y-4">

          {/* ── Daily XP ── */}
          <div className="bg-white dark:bg-white/[0.04] rounded-sm p-6 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-[12px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-4">Daily XP</h3>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {DAY_LABELS.map((day, idx) => {
                const dayKey = DAY_KEYS[idx]
                const isEpic = epicDays[dayKey]
                return (
                  <div key={day} className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-white/40 text-center">{day}</label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={xpByDay[dayKey] || ''}
                      onChange={(e) => setXpByDay({ ...xpByDay, [dayKey]: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-2 text-center text-lg font-bold border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10 bg-white dark:bg-white/[0.04] dark:text-white"
                      placeholder="0"
                    />
                    <button
                      onClick={() => setEpicDays({ ...epicDays, [dayKey]: !isEpic })}
                      className={`text-xs font-semibold py-1 rounded-sm transition-all ${isEpic ? 'bg-stone-300 text-stone-800' : 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-white/30'}`}
                    >
                      {isEpic ? '🔥 Epic' : 'Epic'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* XP progress bar */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-semibold text-ink dark:text-chalk-white/70">Weekly XP Progress</span>
                <span className="text-[13px] font-bold text-ink dark:text-chalk-white tabular-nums">{totalXp} / {xpThreshold}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-white/[0.06] rounded-full h-3">
                <motion.div
                  className="bg-stone-700 dark:bg-stone-300 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {xpProgress >= 100 && <p className="text-[11px] text-sage-600 dark:text-sage-400 font-semibold mt-2">✓ XP threshold reached — base pay earned!</p>}
            </div>
          </div>

          {/* ── Job Card ── */}
          {studentJob && (
            <motion.div
              className={`border rounded-sm p-4 cursor-pointer transition-all ${jobDone ? 'bg-sage-500/[0.04] dark:bg-sage-400/[0.06] border-sage-500/30 dark:border-sage-400/20' : 'bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.06]'}`}
              onClick={() => setJobDone(!jobDone)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{studentJob.icon || '💼'}</span>
                  <div>
                    <p className="font-semibold text-ink dark:text-chalk-white">{studentJob.title}</p>
                    <p className="text-[13px] text-gray-500 dark:text-white/40">+{formatCurrency(studentJob.weekly_pay || 0)}/week</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${jobDone ? 'bg-stone-700 dark:bg-stone-300 border-stone-700 dark:border-stone-300' : 'border-black/[0.15] dark:border-white/[0.15]'}`}>
                  {jobDone && <span className="text-white text-sm">✓</span>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Mastery Tests ── */}
          <div className="bg-white dark:bg-white/[0.04] rounded-sm p-6 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-[12px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-4">Mastery Tests</h3>
            <p className="text-[11px] text-gray-400 dark:text-white/30 mb-3">
              Score {settings.mastery_min_score || 90}%+ = {formatCurrency(settings.mastery_pass_pay || 20)} | 100% = {formatCurrency(settings.mastery_perfect_pay || 100)}
            </p>

            {masteryTests.map((test, idx) => {
              const reward = test.score >= 100 ? (settings.mastery_perfect_pay || 100) :
                test.score >= (settings.mastery_min_score || 90) ? (settings.mastery_pass_pay || 20) : 0
              return (
                <motion.div key={idx} className="p-3 border border-gray-200 dark:border-white/[0.06] rounded-sm mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <input type="text" value={test.subject} onChange={(e) => { const u = [...masteryTests]; u[idx].subject = e.target.value; setMasteryTests(u) }} placeholder="Subject" className="px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-stone-200 dark:focus:ring-stone-500/10 text-sm bg-white dark:bg-white/[0.04] dark:text-white" />
                      <select value={test.grade} onChange={(e) => { const u = [...masteryTests]; u[idx].grade = e.target.value; setMasteryTests(u) }} className="px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-stone-200 dark:focus:ring-stone-500/10 text-sm bg-white dark:bg-white/[0.04] dark:text-white">
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <input type="number" min="0" max="100" value={test.score || ''} onChange={(e) => { const u = [...masteryTests]; u[idx].score = parseInt(e.target.value) || 0; setMasteryTests(u) }} placeholder="Score %" className="px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-stone-200 dark:focus:ring-stone-500/10 text-sm bg-white dark:bg-white/[0.04] dark:text-white" />
                    </div>
                    <button onClick={() => setMasteryTests(masteryTests.filter((_, i) => i !== idx))} className="p-1 text-gray-300 dark:text-white/20 hover:text-rose-500 dark:hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {reward > 0 && <p className="text-[11px] text-sage-600 dark:text-sage-400 font-semibold mt-1">+{formatCurrency(reward)}</p>}
                </motion.div>
              )
            })}

            {masteryTests.length < 6 && (
              <button onClick={() => setMasteryTests([...masteryTests, { subject: '', grade: 'K', score: 0 }])} className="text-[13px] font-semibold text-ink dark:text-chalk-white/60 hover:text-gray-900 dark:hover:text-white/90">
                + Add Mastery Test
              </button>
            )}
          </div>

          {/* ── Custom Bonuses ── */}
          {(settings.custom_bonuses || []).length > 0 && (
            <div className="bg-white dark:bg-white/[0.04] rounded-sm p-6 border border-gray-200 dark:border-white/[0.06] space-y-4">
              <h3 className="text-[12px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">Bonuses</h3>
              <div className="space-y-3">
                {(settings.custom_bonuses || []).map(bonus => {
                  const entry = customBonuses[bonus.id] || {}
                  if (bonus.type === 'checkbox') {
                    return (
                      <motion.div
                        key={bonus.id}
                        className={`border rounded-sm p-4 cursor-pointer transition-all ${entry.claimed ? 'bg-sage-500/[0.04] dark:bg-sage-400/[0.06] border-sage-500/30 dark:border-sage-400/20' : 'bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.06]'}`}
                        onClick={() => setCustomBonuses({ ...customBonuses, [bonus.id]: { ...entry, claimed: !entry.claimed } })}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-ink dark:text-chalk-white">{bonus.name}</p>
                            <p className="text-[13px] text-gray-500 dark:text-white/40">+{formatCurrency(bonus.amount)}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${entry.claimed ? 'bg-stone-700 dark:bg-stone-300 border-stone-700 dark:border-stone-300' : 'border-black/[0.15] dark:border-white/[0.15]'}`}>
                            {entry.claimed && <span className="text-white text-sm">✓</span>}
                          </div>
                        </div>
                      </motion.div>
                    )
                  } else {
                    return (
                      <div key={bonus.id} className="p-4 rounded-sm border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04]">
                        <label className="font-bold text-ink dark:text-chalk-white block mb-2">{bonus.name}</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.amount || ''}
                          onChange={(e) => setCustomBonuses({ ...customBonuses, [bonus.id]: { ...entry, amount: parseFloat(e.target.value) || 0 } })}
                          placeholder="Enter amount"
                          prefix="$"
                        />
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky bottom bar: running total + submit ── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[240px] z-30 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 dark:text-white/30 uppercase tracking-wider">Total Earnings</p>
            <p className="text-2xl font-bold text-ink dark:text-chalk-white tabular-nums">
              <AnimNum value={totalPaycheck} prefix="$" />
            </p>
            {totalPaycheck > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {earnings.basePay > 0 && <span className="text-[10px] text-gray-400 dark:text-white/30">Base {formatCurrency(earnings.basePay)}</span>}
                {earnings.epicBonus > 0 && <span className="text-[10px] text-stone-500">🔥 {formatCurrency(earnings.epicBonus)}</span>}
                {earnings.bonusXp > 0 && <span className="text-[10px] text-stone-500">XP +{formatCurrency(earnings.bonusXp)}</span>}
                {earnings.masteryRewards > 0 && <span className="text-[10px] text-sage-500">📚 {formatCurrency(earnings.masteryRewards)}</span>}
                {earnings.jobPay > 0 && <span className="text-[10px] text-stone-500">💼 {formatCurrency(earnings.jobPay)}</span>}
                {earnings.customBonusTotal > 0 && <span className="text-[10px] text-stone-500">⭐ {formatCurrency(earnings.customBonusTotal)}</span>}
              </div>
            )}
          </div>
          <button
            onClick={handleSubmitPaycheck}
            disabled={loading || totalPaycheck <= 0}
            className={`rounded-sm px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
              totalPaycheck > 0 && !loading
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm'
                : 'bg-gray-100 dark:bg-white/[0.04] text-gray-300 dark:text-white/20 cursor-not-allowed'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit'}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
