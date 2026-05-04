import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
import { ChevronRight, Trash2, Clock, CheckCircle, AlertCircle, DollarSign, Save, Lock, Send, Wallet, PiggyBank, TrendingUp, BarChart3, Sparkles } from 'lucide-react'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const STATUS_CONFIG = {
  draft: { label: 'In Progress', color: 'bg-pencil/10 dark:bg-pencil/10 text-pencil-dark dark:text-pencil' },
  submitted: { label: 'Submitted', color: 'bg-stone-100/50 dark:bg-stone-500/[0.06] text-stone-700 dark:text-stone-400' },
  verified: { label: 'Approved', color: 'bg-sage-100/50 dark:bg-sage-500/[0.06] text-sage-700 dark:text-sage-400' },
  allocated: { label: 'Allocated', color: 'bg-sage-100/50 dark:bg-sage-500/[0.06] text-sage-700 dark:text-sage-400' },
}

// Get today's day key (mon, tue, etc.) — returns null on weekends
const getTodayKey = () => {
  const dayIndex = new Date().getDay() // 0=Sun, 1=Mon, ... 6=Sat
  if (dayIndex === 0 || dayIndex === 6) return null
  return DAY_KEYS[dayIndex - 1]
}

export const StudentPaycheck = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { settings } = usePaycheckSettings()
  const [view, setView] = useState('tracker')
  const requestedWeekNumber = searchParams.get('week') ? parseInt(searchParams.get('week')) : null
  const [step, setStep] = useState(1) // 1=Log XP, 2=Review & Allocate, 3=Confirm
  const [pastPaychecks, setPastPaychecks] = useState([])
  const [sessionPaychecks, setSessionPaychecks] = useState([])
  const [currentWeekNum, setCurrentWeekNum] = useState(null)
  const [selectedPaycheck, setSelectedPaycheck] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [toast, setToast] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [loading, setLoading] = useState(false)

  // Draft state
  const [draftId, setDraftId] = useState(null)
  const [xpByDay, setXpByDay] = useState({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 })
  const [epicDays, setEpicDays] = useState({ mon: false, tue: false, wed: false, thu: false, fri: false })
  const [masteryTests, setMasteryTests] = useState([])
  const [customBonuses, setCustomBonuses] = useState({})
  const [jobDone, setJobDone] = useState(false)
  const [studentJob, setStudentJob] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const [draftStatus, setDraftStatus] = useState('draft')

  // Allocation state
  const [allocation, setAllocation] = useState({
    checking: 0, savings: 0, sp500: 0, nasdaq: 0, bonus: 0,
  })

  const saveTimer = useRef(null)
  const todayKey = getTodayKey()

  useEffect(() => {
    if (!profile?.id) return
    initDraft()
    fetchPastPaychecks()
    fetchJob()
    fetchSessionPaychecks()
  }, [profile?.id, requestedWeekNumber])

  // Fetch all S5 paychecks for this kid (used to render the week-selector pills)
  const fetchSessionPaychecks = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('weekly_paychecks')
      .select('id, week_label, week_number, status, total_earnings')
      .eq('student_id', profile.id)
      .eq('session_number', 5)
      .order('week_number', { ascending: true })
    if (data) setSessionPaychecks(data)
    // Compute current week (today vs S5 start Apr 27, 2026). S5 W1 starts Mon Apr 27.
    const s5Start = new Date('2026-04-27T00:00:00')
    const now = new Date()
    const wk = Math.floor((now.getTime() - s5Start.getTime()) / (7 * 86400000)) + 1
    setCurrentWeekNum(Math.max(1, Math.min(6, wk)))
  }

  const getWeekLabel = () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const currentWeekLabel = getWeekLabel()
  const [targetWeekNumber, setTargetWeekNumber] = useState(requestedWeekNumber)

  // ── Initialize or load draft for requested week (or current week) ──
  const initDraft = async () => {
    try {
      let weekLabel = currentWeekLabel
      let useWeekNumber = false

      // If ?week=N is provided, find paycheck by session_number=5 AND week_number=N
      if (requestedWeekNumber) {
        const { data: existing, error: err } = await supabase
          .from('weekly_paychecks')
          .select('*')
          .eq('student_id', profile.id)
          .eq('session_number', 5)
          .eq('week_number', requestedWeekNumber)
          .maybeSingle()

        if (existing) {
          weekLabel = existing.week_label
          useWeekNumber = true
          // Load and return early
          setDraftId(existing.id)
          setDraftStatus(existing.status)
          setXpByDay({
            mon: existing.xp_mon || 0,
            tue: existing.xp_tue || 0,
            wed: existing.xp_wed || 0,
            thu: existing.xp_thu || 0,
            fri: existing.xp_fri || 0,
          })
          setEpicDays({
            mon: !!existing.epic_mon,
            tue: !!existing.epic_tue,
            wed: !!existing.epic_wed,
            thu: !!existing.epic_thu,
            fri: !!existing.epic_fri,
          })
          setJobDone(!!existing.job_completed)
          if (existing.custom_bonus_data && Array.isArray(existing.custom_bonus_data)) {
            const bonusMap = {}
            existing.custom_bonus_data.forEach(b => {
              bonusMap[b.id] = b.type === 'checkbox' ? { claimed: true } : { amount: b.amount || 0 }
            })
            setCustomBonuses(bonusMap)
          }
          if (existing.status !== 'draft') {
            setSelectedPaycheck(existing)
          }
          return
        }
      }

      // Check for existing paycheck by week_label (current week fallback)
      const { data: existing, error } = await supabase
        .from('weekly_paychecks')
        .select('*')
        .eq('student_id', profile.id)
        .eq('week_label', weekLabel)
        .maybeSingle()

      if (error) throw error

      if (existing) {
        // Load existing data into form
        setDraftId(existing.id)
        setDraftStatus(existing.status)
        setXpByDay({
          mon: existing.xp_mon || 0,
          tue: existing.xp_tue || 0,
          wed: existing.xp_wed || 0,
          thu: existing.xp_thu || 0,
          fri: existing.xp_fri || 0,
        })
        setEpicDays({
          mon: !!existing.epic_mon,
          tue: !!existing.epic_tue,
          wed: !!existing.epic_wed,
          thu: !!existing.epic_thu,
          fri: !!existing.epic_fri,
        })
        setJobDone(!!existing.job_completed)
        // Load custom bonus data if present
        if (existing.custom_bonus_data && Array.isArray(existing.custom_bonus_data)) {
          const bonusMap = {}
          existing.custom_bonus_data.forEach(b => {
            bonusMap[b.id] = b.type === 'checkbox' ? { claimed: true } : { amount: b.amount || 0 }
          })
          setCustomBonuses(bonusMap)
        }
        // If it's not a draft, show tracker in read mode.
        // Verified paychecks now auto-flow to Savings via DB trigger — no
        // manual allocation step needed.
        if (existing.status !== 'draft') {
          setSelectedPaycheck(existing)
        }
      } else {
        // Create new draft
        const { data: session } = await supabase
          .from('sessions')
          .select('id')
          .eq('is_active', true)
          .maybeSingle()

        const { data: newDraft, error: createError } = await supabase
          .from('weekly_paychecks')
          .insert({
            student_id: profile.id,
            session_id: session?.id || null,
            week_label: currentWeekLabel,
            status: 'draft',
            xp_mon: 0, xp_tue: 0, xp_wed: 0, xp_thu: 0, xp_fri: 0,
            epic_mon: false, epic_tue: false, epic_wed: false, epic_thu: false, epic_fri: false,
            base_pay: 0, epic_bonus: 0, xp_bonus: 0, mastery_pay: 0,
            job_pay: 0, smart_goal: 0, other_pay: 0, total_earnings: 0,
          })
          .select()
          .single()

        if (createError) throw createError
        setDraftId(newDraft.id)
        setDraftStatus('draft')
      }
    } catch (err) {
      console.error('Error initializing draft:', err)
    }
  }

  const fetchPastPaychecks = async () => {
    try {
      setLoadingHistory(true)
      // Only show current session's paychecks (S5+). Old S3/S4 paychecks live in the kid's
      // starting balance and shouldn't clutter this view.
      const { data, error } = await supabase
        .from('weekly_paychecks')
        .select('*')
        .eq('student_id', profile.id)
        .eq('session_number', 5)
        .neq('week_label', currentWeekLabel)
        .order('week_number', { ascending: true })
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

  // ── Auto-save with debounce ──
  const autoSave = useCallback(async (updatedXp, updatedEpic, updatedJob, updatedBonuses) => {
    if (!draftId || draftStatus !== 'draft') return

    setSaveStatus('saving')
    try {
      const xp = updatedXp || xpByDay
      const epic = updatedEpic || epicDays
      const job = updatedJob !== undefined ? updatedJob : jobDone

      // Recalculate earnings
      const totalXpCalc = Object.values(xp).reduce((sum, val) => sum + val, 0)
      // Epic day = rings filled (epic_X column) AND xp >= 145 for that day
      const epicCount = DAY_KEYS.filter((d) => epic[d] && (xp[d] || 0) >= 145).length
      const basePay = totalXpCalc >= (settings.xp_threshold || 600) ? (settings.base_pay || 10) : 0
      const epicBonus = epicCount >= (settings.epic_days_required || 5) ? (settings.epic_week_bonus || 5) : 0
      const bonusXp = totalXpCalc > (settings.xp_threshold || 600)
        ? Math.floor((totalXpCalc - (settings.xp_threshold || 600)) / (settings.bonus_xp_per || 50)) * (settings.bonus_xp_rate || 1)
        : 0
      const masteryRewards = masteryTests.reduce((sum, test) => {
        if (test.score >= 100) return sum + (settings.mastery_perfect_pay || 100)
        if (test.score >= (settings.mastery_min_score || 90)) return sum + (settings.mastery_pass_pay || 20)
        return sum
      }, 0)
      const jobPay = job && studentJob ? studentJob.weekly_pay || 0 : 0
      const bonuses = updatedBonuses || customBonuses
      const customBonusTotal = (settings.custom_bonuses || []).reduce((sum, bonus) => {
        const entry = bonuses[bonus.id]
        if (!entry) return sum
        if (bonus.type === 'checkbox' && entry.claimed) return sum + (bonus.amount || 0)
        if (bonus.type === 'student_amount' && entry.amount > 0) return sum + entry.amount
        return sum
      }, 0)

      const totalEarnings = basePay + epicBonus + bonusXp + masteryRewards + jobPay + customBonusTotal

      const customBonusData = (settings.custom_bonuses || [])
        .filter(b => {
          const entry = bonuses[b.id]
          if (!entry) return false
          return (b.type === 'checkbox' && entry.claimed) || (b.type === 'student_amount' && entry.amount > 0)
        })
        .map(b => ({
          id: b.id, name: b.name, type: b.type,
          amount: b.type === 'checkbox' ? b.amount : (bonuses[b.id]?.amount || 0)
        }))

      const { error } = await supabase
        .from('weekly_paychecks')
        .update({
          xp_mon: xp.mon, xp_tue: xp.tue, xp_wed: xp.wed,
          xp_thu: xp.thu, xp_fri: xp.fri,
          epic_mon: epic.mon, epic_tue: epic.tue, epic_wed: epic.wed,
          epic_thu: epic.thu, epic_fri: epic.fri,
          base_pay: Math.round(basePay * 100) / 100,
          epic_bonus: epicBonus,
          xp_bonus: Math.round(bonusXp * 100) / 100,
          mastery_pay: masteryRewards,
          job_pay: jobPay,
          other_pay: Math.round(customBonusTotal * 100) / 100,
          total_earnings: Math.round(totalEarnings * 100) / 100,
          custom_bonus_data: customBonusData,
          job_completed: job,
          job_id: studentJob?.id || null,
        })
        .eq('id', draftId)

      if (error) throw error
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Auto-save error:', err)
      setSaveStatus('idle')
    }
  }, [draftId, draftStatus, xpByDay, epicDays, jobDone, customBonuses, masteryTests, settings, studentJob])

  const debouncedSave = useCallback((updatedXp, updatedEpic, updatedJob, updatedBonuses) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(updatedXp, updatedEpic, updatedJob, updatedBonuses), 800)
  }, [autoSave])

  // Update handlers that trigger auto-save
  const updateXp = (dayKey, value) => {
    const xpVal = parseInt(value) || 0
    const updated = { ...xpByDay, [dayKey]: xpVal }
    setXpByDay(updated)
    debouncedSave(updated, undefined, undefined, undefined)
  }

  const toggleEpic = (dayKey) => {
    // Epic days are now auto-calculated from XP, but allow manual override
    const updated = { ...epicDays, [dayKey]: !epicDays[dayKey] }
    setEpicDays(updated)
    debouncedSave(undefined, updated, undefined, undefined)
  }

  const toggleJob = () => {
    const updated = !jobDone
    setJobDone(updated)
    debouncedSave(undefined, undefined, updated, undefined)
  }

  const updateCustomBonus = (bonusId, entry) => {
    const updated = { ...customBonuses, [bonusId]: entry }
    setCustomBonuses(updated)
    debouncedSave(undefined, undefined, undefined, updated)
  }

  // ── Derived calculations ──
  const totalXp = Object.values(xpByDay).reduce((sum, val) => sum + val, 0)
  const xpThreshold = settings.xp_threshold || 600
  const xpProgress = (totalXp / xpThreshold) * 100

  const calculateEarnings = () => {
    // Epic day = rings filled AND xp >= 145
    const epicCount = DAY_KEYS.filter((d) => epicDays[d] && (xpByDay[d] || 0) >= 145).length
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

  // ── Lock In (submit) ──
  const handleLockIn = async () => {
    if (totalPaycheck <= 0) {
      setToast({ type: 'error', text: 'No earnings to submit yet' })
      return
    }
    setLoading(true)
    try {
      // Do a final save first
      await autoSave()

      // Now update mastery tests
      if (masteryTests.length > 0 && draftId) {
        const testsToInsert = masteryTests
          .filter(t => t.subject && t.score > 0)
          .map(test => ({
            paycheck_id: draftId,
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

      // Set status to submitted, include allocation
      const allocData = {}
      if (allocation.checking > 0) allocData.alloc_checking = allocation.checking
      if (allocation.savings > 0) allocData.alloc_savings = allocation.savings
      if (allocation.sp500 > 0) allocData.alloc_sp500 = allocation.sp500
      if (allocation.nasdaq > 0) allocData.alloc_nasdaq = allocation.nasdaq
      if (allocation.bonus > 0) allocData.alloc_bonus = allocation.bonus

      const { error } = await supabase
        .from('weekly_paychecks')
        .update({ status: 'submitted', ...allocData })
        .eq('id', draftId)

      if (error) throw error

      setDraftStatus('submitted')
      setShowConfetti(true)
      setToast({ type: 'success', text: 'Paycheck submitted! Your guide will review it.' })
      setTimeout(() => setShowConfetti(false), 3000)
      await fetchPastPaychecks()
    } catch (error) {
      console.error('Error locking in paycheck:', error)
      setToast({ type: 'error', text: 'Failed to submit paycheck' })
    } finally {
      setLoading(false)
    }
  }

  const handleAllocatePaycheck = async () => {
    const pc = selectedPaycheck || { total_earnings: totalPaycheck, id: draftId }
    const total = pc.total_earnings || 0
    const allocTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0)
    if (Math.abs(allocTotal - total) > 0.01) {
      setToast({ type: 'error', text: `Allocation must equal ${formatCurrency(total)}` })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.rpc('allocate_paycheck', {
        p_paycheck_id: pc.id,
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
      setView('tracker')
      setSelectedPaycheck(null)
      setDraftStatus('allocated')
      await fetchPastPaychecks()
      await initDraft()
    } catch (error) {
      console.error('Error allocating:', error)
      setToast({ type: 'error', text: error.message || 'Failed to allocate paycheck' })
    } finally {
      setLoading(false)
    }
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

  const isEditable = draftStatus === 'draft'

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
     ALLOCATE VIEW — Split approved paycheck
     ═══════════════════════════════════════════════ */
  if (view === 'allocate' && (selectedPaycheck || draftId)) {
    const pc = selectedPaycheck || { total_earnings: totalPaycheck, id: draftId }
    const total = pc.total_earnings || 0
    const allocTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0)
    const isAllocValid = Math.abs(allocTotal - total) < 0.01

    return (
      <div className="space-y-6 p-8">
        <Toast message={toast} />
        <Confetti active={showConfetti} />

        <button
          onClick={() => { setView('tracker'); setSelectedPaycheck(null) }}
          className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 font-semibold mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-alpha-navy-800 dark:text-white tracking-[-0.02em]">Allocate Your Paycheck</h1>
            <p className="text-[13px] text-gray-500 dark:text-white/40 mt-1">
              {pc.week_label || currentWeekLabel} — {formatCurrency(total)} to distribute
            </p>
          </div>

          <div className="rounded-xl p-4 border border-teal/20 dark:border-teal/10 bg-teal/[0.04] dark:bg-teal/[0.02]">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-teal bg-teal/10 uppercase tracking-wider">Learn</span>
              <span className="text-[12px] font-bold text-ink dark:text-chalk-white">Smart Allocation</span>
            </div>
            <p className="text-[12px] text-ink-light dark:text-white/50 leading-relaxed">
              Think about your goals. Need something soon? Put more in checking. Building an emergency fund? Boost savings. Playing the long game? Feed your investments.
            </p>
          </div>

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
                      className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-pencil dark:focus:border-pencil/60 focus:ring-2 focus:ring-pencil/20 bg-white dark:bg-white/[0.04] dark:text-white"
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
              {isAllocValid && <p className="text-[11px] text-sage-600 dark:text-sage-400 font-semibold">All funds allocated</p>}
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
     DETAIL VIEW — Read-only paycheck breakdown (for past weeks)
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
          onClick={() => { setView('tracker'); setSelectedPaycheck(null) }}
          className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 font-semibold mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back to Paychecks
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-alpha-navy-800 dark:text-white">{p.week_label || 'Paycheck'}</h2>
              <span className={`px-3 py-1 rounded-sm text-xs font-semibold ${statusConf.color}`}>
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
                    {epic && <span className="text-xs font-bold text-pencil">E</span>}
                  </div>
                )
              })}
            </div>

            <div className="text-sm text-gray-500 dark:text-white/40 mb-4">
              Total XP: <span className="font-bold">{totalXpDetail}</span> / {xpThreshold}
              {epicCountDetail > 0 && <span className="ml-3">{epicCountDetail} epic days</span>}
            </div>

            {/* Earnings breakdown */}
            <div className="space-y-2 border-t border-gray-200 dark:border-white/[0.06] pt-4">
              <h3 className="text-[11px] font-bold text-alpha-navy/60 dark:text-alpha-blue-300 mb-3 uppercase tracking-[0.18em]">Breakdown</h3>
              {p.base_pay > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-white/40">Base Pay</span><span className="font-semibold">{formatCurrency(p.base_pay)}</span></div>}
              {p.epic_bonus > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>Epic Bonus</span><span className="font-semibold">{formatCurrency(p.epic_bonus)}</span></div>}
              {p.xp_bonus > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>XP Bonus</span><span className="font-semibold">{formatCurrency(p.xp_bonus)}</span></div>}
              {p.mastery_pay > 0 && <div className="flex justify-between text-sm text-sage-600 dark:text-sage-400"><span>Mastery Tests</span><span className="font-semibold">{formatCurrency(p.mastery_pay)}</span></div>}
              {p.job_pay > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>Job</span><span className="font-semibold">{formatCurrency(p.job_pay)}</span></div>}
              {p.other_pay > 0 && <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400"><span>Other</span><span className="font-semibold">{formatCurrency(p.other_pay)}</span></div>}
            </div>

            {/* Allocation (if already allocated) */}
            {p.status === 'allocated' && (
              <div className="mt-4 border-t border-gray-200 dark:border-white/[0.06] pt-4">
                <h3 className="text-[11px] font-bold text-alpha-navy/60 dark:text-alpha-blue-300 mb-3 uppercase tracking-[0.18em]">Allocation</h3>
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
              <div className="mt-6 p-3 rounded-sm bg-sage-500/[0.06] dark:bg-sage-400/[0.06] border border-sage-500/20 dark:border-sage-400/10 text-sm text-sage-600 dark:text-sage-400">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Approved! This paycheck landed in your Savings, earning 4% APY.
              </div>
            )}

            {p.status === 'submitted' && (
              <div className="mt-4 p-3 rounded-sm bg-stone-500/[0.06] dark:bg-stone-400/[0.06] border border-stone-500/20 dark:border-stone-400/10 text-sm text-stone-600 dark:text-stone-400">
                <Clock className="w-4 h-4 inline mr-1" />
                Waiting for your guide to review this paycheck.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     TRACKER VIEW — Daily paycheck tracker (main view)
     ═══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-alpha-blue-50 dark:bg-[#0c100c] relative pb-28">
      <div className="space-y-5 max-w-3xl mx-auto px-5 md:px-8 pt-7">
        <Toast message={toast} />
        <Confetti active={showConfetti} />

        {/* Header with save status */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black text-black/55 dark:text-white/50 uppercase tracking-[0.18em]">
                {requestedWeekNumber ? 'Paycheck' : 'This Week'}
              </p>
              <h1 className="text-[32px] md:text-[40px] font-black text-black dark:text-white tracking-[-0.02em] leading-[1.05] mt-1">
                {requestedWeekNumber ? `S5 W${requestedWeekNumber}` : 'My Paycheck'}
              </h1>
              <p className="text-[13px] font-semibold text-black/55 dark:text-white/45 mt-1">
                {requestedWeekNumber ? `S5 W${requestedWeekNumber} Paycheck` : `Week of ${currentWeekLabel}`}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap justify-end">
              <AnimatePresence mode="wait">
                {saveStatus === 'saving' && (
                  <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] font-bold text-black/55 dark:text-white/45 flex items-center gap-1">
                    <motion.div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    Saving...
                  </motion.span>
                )}
                {saveStatus === 'saved' && (
                  <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Saved
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-alpha-blue-100 text-alpha-blue-700">
                {STATUS_CONFIG[draftStatus]?.label || 'In Progress'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Week selector pills — flip between S5 W1, W2, etc. */}
        {sessionPaychecks.length > 0 && currentWeekNum && (
          <div className="flex flex-wrap gap-2">
            {sessionPaychecks.map((wp) => {
              const isCurrent = (requestedWeekNumber || currentWeekNum) === wp.week_number
              const isFuture = wp.week_number > currentWeekNum
              const isAllocated = wp.status === 'allocated' || wp.status === 'verified'
              const isSubmitted = wp.status === 'submitted'
              return (
                <button
                  key={wp.id}
                  disabled={isFuture}
                  onClick={() => navigate(`/paycheck?week=${wp.week_number}`)}
                  className={[
                    'px-3.5 py-2 rounded-full text-[12px] font-bold border border-alpha-blue-300 transition-all',
                    isCurrent ? 'bg-alpha-blue-500 text-white shadow-soft' :
                    isFuture ? 'bg-alpha-blue-200/30 text-alpha-blue-400/50 dark:bg-alpha-blue-900/20 dark:text-alpha-blue-600/40 cursor-not-allowed border-alpha-blue-200/50' :
                    isAllocated ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                    isSubmitted ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                    'bg-white text-alpha-blue-700 hover:bg-alpha-blue-50 dark:bg-white/[0.04] dark:text-alpha-blue-300'
                  ].join(' ')}
                >
                  W{wp.week_number}
                  {isAllocated && ' ✓'}
                  {isSubmitted && ' ⏳'}
                </button>
              )
            })}
          </div>
        )}

        {/* Status messages */}
        {draftStatus === 'submitted' && (
          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft text-[13px] font-bold text-alpha-navy-800 dark:text-white">
            <Clock className="w-4 h-4 inline mr-1" />
            Submitted! Waiting for your guide to review.
          </div>
        )}
        {(draftStatus === 'verified' || draftStatus === 'allocated') && (
          <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 shadow-soft text-[13px] font-bold text-emerald-900 dark:text-emerald-200">
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Approved! Your paycheck landed in Savings, earning 4% APY. Open the dashboard to invest or transfer.
          </div>
        )}

        <div className="space-y-5">

          {/* ══════ STEP 1: Log XP ══════ */}
          {step === 1 && <>

          {/* ── Daily XP — the star of the show ── */}
          <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-6 border border-alpha-blue-200 shadow-soft">
            <h3 className="text-[11px] font-black text-black/55 dark:text-white/50 uppercase tracking-[0.15em] mb-1">Daily XP</h3>
            {isEditable && (
              <p className="text-[12px] text-black/55 dark:text-white/45 font-semibold mb-4">Enter your XP each day — it saves automatically</p>
            )}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {DAY_LABELS.map((day, idx) => {
                const dayKey = DAY_KEYS[idx]
                const isToday = dayKey === todayKey
                const ringsFilled = epicDays[dayKey]   // epic_X column repurposed as "rings filled"
                const xpVal = xpByDay[dayKey] || 0
                const hasValue = xpVal > 0
                const isEpicDay = ringsFilled && xpVal >= 145   // auto-epic rule
                return (
                  <div key={day} className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <label className={`text-[11px] font-bold ${isToday ? 'text-cobalt-500 dark:text-cobalt-200' : 'text-black/55 dark:text-white/45'}`}>
                        {day} {isToday && '←'}
                      </label>
                      {isEpicDay && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border-[1.5px] border-black uppercase tracking-wider">
                          Epic
                        </span>
                      )}
                    </div>
                    <div className={`relative ${isToday ? 'ring-2 ring-cobalt-400/40 rounded-lg' : ''}`}>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={xpByDay[dayKey] || ''}
                        onChange={(e) => updateXp(dayKey, e.target.value)}
                        disabled={!isEditable}
                        className={`w-full px-2 py-2 text-center text-lg font-black border-[2px] rounded-lg focus:outline-none focus:border-cobalt-400 dark:focus:border-cobalt-200 focus:ring-2 focus:ring-cobalt-400/20 bg-white dark:bg-white/[0.04] dark:text-white ${
                          !isEditable ? 'opacity-60 cursor-not-allowed' : ''
                        } ${hasValue ? 'border-black' : 'border-black/20 dark:border-white/[0.1]'}`}
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={() => isEditable && toggleEpic(dayKey)}
                      disabled={!isEditable}
                      className={`text-[11px] font-black py-1.5 rounded-lg transition-all border-[2px] ${
                        ringsFilled
                          ? 'bg-alpha-blue-500 text-white border-alpha-blue-500'
                          : 'bg-white text-black/45 border-black/15 hover:border-black/30'
                      } ${!isEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {ringsFilled ? '✓ Rings' : 'Rings'}
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
                  className="h-3 rounded-full"
                  style={{ background: 'repeating-linear-gradient(45deg, #e8c840, #e8c840 4px, #d4b84c 4px, #d4b84c 8px)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {xpProgress >= 100 && <p className="text-[11px] text-sage-600 dark:text-sage-400 font-semibold mt-2">XP threshold reached — base pay earned!</p>}
            </div>

            {/* Extra XP Bonus Breakdown */}
            {totalXp > xpThreshold && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Extra XP Bonus</p>
                    <p className="text-[12px] text-amber-600/80 dark:text-amber-400/60 mt-0.5">
                      {totalXp - xpThreshold} extra XP × {formatCurrency(settings.bonus_xp_rate || 1)} per {settings.bonus_xp_per || 50} XP
                    </p>
                  </div>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400 tabular-nums">
                    +{formatCurrency(earnings.bonusXp)}
                  </span>
                </div>
              </div>
            )}

            {/* Epic Days Summary — auto-computed from rings filled + xp >= 145 */}
            {(() => {
              const epicDaysCount = DAY_KEYS.filter((d) => epicDays[d] && (xpByDay[d] || 0) >= 145).length
              return epicDaysCount > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20 border-[2px] border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">Epic Days</p>
                    <p className="text-[12px] text-amber-800/80 dark:text-amber-200/70 font-semibold mt-0.5">
                      {epicDaysCount} / {settings.epic_days_required || 5} days needed for bonus (rings filled + 145 XP)
                    </p>
                  </div>
                  <span className="text-lg font-black text-amber-900 dark:text-amber-200 tabular-nums">
                    {earnings.epicBonus > 0 ? `+${formatCurrency(earnings.epicBonus)}` : '$0'}
                  </span>
                </div>
              </div>
            )})()}
          </div>

          {/* ── Job Card ── */}
          {studentJob && (
            <motion.div
              className={`border rounded-sm p-4 transition-all ${isEditable ? 'cursor-pointer' : 'opacity-70'} ${jobDone ? 'bg-sage-500/[0.04] dark:bg-sage-400/[0.06] border-sage-500/30 dark:border-sage-400/20' : 'bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.06]'}`}
              onClick={isEditable ? toggleJob : undefined}
              whileHover={isEditable ? { scale: 1.01 } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{studentJob.icon || 'J'}</span>
                  <div>
                    <p className="font-semibold text-ink dark:text-chalk-white">{studentJob.title}</p>
                    <p className="text-[13px] text-gray-500 dark:text-white/40">+{formatCurrency(studentJob.weekly_pay || 0)}/week</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${jobDone ? 'bg-pencil border-pencil-dark' : 'border-black/[0.15] dark:border-white/[0.15]'}`}>
                  {jobDone && <span className="text-ink text-sm font-bold">Done</span>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Mastery Tests ── */}
          {isEditable && (
            <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-6 border border-alpha-blue-200 shadow-soft">
              <h3 className="text-[11px] font-black text-black/55 dark:text-white/50 uppercase tracking-[0.15em] mb-2">Mastery Tests</h3>
              <p className="text-[12px] text-black/55 dark:text-white/45 font-semibold mb-4">
                Score {settings.mastery_min_score || 90}%+ = {formatCurrency(settings.mastery_pass_pay || 20)} · 100% = {formatCurrency(settings.mastery_perfect_pay || 100)}
              </p>

              {masteryTests.map((test, idx) => {
                const reward = test.score >= 100 ? (settings.mastery_perfect_pay || 100) :
                  test.score >= (settings.mastery_min_score || 90) ? (settings.mastery_pass_pay || 20) : 0
                return (
                  <motion.div key={idx} className="p-3 border border-gray-200 dark:border-white/[0.06] rounded-sm mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <input type="text" value={test.subject} onChange={(e) => { const u = [...masteryTests]; u[idx].subject = e.target.value; setMasteryTests(u) }} placeholder="Subject" className="px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-pencil dark:focus:border-pencil/60 focus:ring-2 focus:ring-pencil/20 text-sm bg-white dark:bg-white/[0.04] dark:text-white" />
                        <select value={test.grade} onChange={(e) => { const u = [...masteryTests]; u[idx].grade = e.target.value; setMasteryTests(u) }} className="px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-pencil dark:focus:border-pencil/60 focus:ring-2 focus:ring-pencil/20 text-sm bg-white dark:bg-white/[0.04] dark:text-white">
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <input type="number" min="0" max="100" value={test.score || ''} onChange={(e) => { const u = [...masteryTests]; u[idx].score = parseInt(e.target.value) || 0; setMasteryTests(u) }} placeholder="Score %" className="px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm focus:outline-none focus:border-pencil dark:focus:border-pencil/60 focus:ring-2 focus:ring-pencil/20 text-sm bg-white dark:bg-white/[0.04] dark:text-white" />
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
          )}

          {/* ── Custom Bonuses ── */}
          {isEditable && (settings.custom_bonuses || []).length > 0 && (
            <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-6 border-[3px] border-black shadow-gum space-y-4">
              <h3 className="text-[11px] font-black text-black/55 dark:text-white/50 uppercase tracking-[0.15em]">Bonuses</h3>
              <div className="space-y-3">
                {(settings.custom_bonuses || []).map(bonus => {
                  const entry = customBonuses[bonus.id] || {}
                  if (bonus.type === 'checkbox') {
                    return (
                      <motion.div
                        key={bonus.id}
                        className={`border rounded-sm p-4 cursor-pointer transition-all ${entry.claimed ? 'bg-sage-500/[0.04] dark:bg-sage-400/[0.06] border-sage-500/30 dark:border-sage-400/20' : 'bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.06]'}`}
                        onClick={() => updateCustomBonus(bonus.id, { ...entry, claimed: !entry.claimed })}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-ink dark:text-chalk-white">{bonus.name}</p>
                            <p className="text-[13px] text-gray-500 dark:text-white/40">+{formatCurrency(bonus.amount)}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${entry.claimed ? 'bg-pencil border-pencil-dark' : 'border-black/[0.15] dark:border-white/[0.15]'}`}>
                            {entry.claimed && <span className="text-ink text-sm font-bold">Done</span>}
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
                          onChange={(e) => updateCustomBonus(bonus.id, { ...entry, amount: parseFloat(e.target.value) || 0 })}
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

          </>}

          {/* ══════ STEP 2: Review & Allocate ══════ */}
          {step === 2 && isEditable && <>
            {/* Earnings Summary */}
            <div className="bg-white dark:bg-white/[0.04] rounded-xl p-6 border border-black/[0.06] dark:border-white/[0.06]">
              <h3 className="text-[12px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-4">Earnings Breakdown</h3>
              <div className="space-y-3">
                {earnings.basePay > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <span className="text-[13px] text-ink-light dark:text-white/60">Base Pay (XP threshold met)</span>
                    <span className="text-[13px] font-bold text-ink dark:text-chalk-white">{formatCurrency(earnings.basePay)}</span>
                  </div>
                )}
                {earnings.epicBonus > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <span className="text-[13px] text-ink-light dark:text-white/60">Epic Week Bonus</span>
                    <span className="text-[13px] font-bold text-pencil">{formatCurrency(earnings.epicBonus)}</span>
                  </div>
                )}
                {earnings.bonusXp > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <span className="text-[13px] text-ink-light dark:text-white/60">Extra XP Bonus ({totalXp - xpThreshold} extra XP)</span>
                    <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400">{formatCurrency(earnings.bonusXp)}</span>
                  </div>
                )}
                {earnings.masteryRewards > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <span className="text-[13px] text-ink-light dark:text-white/60">Mastery Tests</span>
                    <span className="text-[13px] font-bold text-sage">{formatCurrency(earnings.masteryRewards)}</span>
                  </div>
                )}
                {earnings.jobPay > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <span className="text-[13px] text-ink-light dark:text-white/60">Job Pay</span>
                    <span className="text-[13px] font-bold text-ink dark:text-chalk-white">{formatCurrency(earnings.jobPay)}</span>
                  </div>
                )}
                {earnings.customBonusTotal > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <span className="text-[13px] text-ink-light dark:text-white/60">Bonuses</span>
                    <span className="text-[13px] font-bold text-ink dark:text-chalk-white">{formatCurrency(earnings.customBonusTotal)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[15px] font-black text-ink dark:text-chalk-white">Total Paycheck</span>
                  <span className="text-2xl font-black text-ink dark:text-chalk-white tabular-nums">{formatCurrency(totalPaycheck)}</span>
                </div>
              </div>
              {totalPaycheck <= 0 && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200/50 dark:border-rose-700/20">
                  <p className="text-[12px] text-rose-600 dark:text-rose-400 font-semibold">No earnings yet — go back to Step 1 and log your XP!</p>
                </div>
              )}
            </div>

            {/* Allocation */}
            {totalPaycheck > 0 && (
              <div className="bg-white dark:bg-white/[0.04] rounded-xl p-6 border border-black/[0.06] dark:border-white/[0.06]">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-[12px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider">Split Your Paycheck</h3>
                    <p className="text-[11px] text-ink-faint dark:text-white/25 mt-0.5">Decide where your {formatCurrency(totalPaycheck)} goes</p>
                  </div>
                  <button
                    onClick={() => useSuggestedSplit(totalPaycheck)}
                    className="text-[11px] font-bold text-teal dark:text-teal hover:underline"
                  >
                    Use 20/30/25/15/10 split
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'checking', label: 'Checking', icon: Wallet, color: '#7c8c78', desc: 'Spending money' },
                    { key: 'savings', label: 'Savings', icon: PiggyBank, color: '#6b8a87', desc: 'Earn interest' },
                    { key: 'sp500', label: 'S&P 500', icon: TrendingUp, color: '#a68b5b', desc: 'Top 500 companies' },
                    { key: 'nasdaq', label: 'NASDAQ', icon: BarChart3, color: '#78716c', desc: 'Tech & growth' },
                  ].map(({ key, label, icon: Icon, color, desc }) => {
                    const pct = totalPaycheck > 0 ? ((allocation[key] || 0) / totalPaycheck * 100).toFixed(0) : 0
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[12px] font-semibold text-ink dark:text-chalk-white">{label}</span>
                            <span className="text-[10px] text-ink-faint dark:text-white/30">{pct}%</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={allocation[key] || ''}
                            onChange={(e) => setAllocation({ ...allocation, [key]: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.1] rounded-lg focus:outline-none focus:border-pencil dark:focus:border-pencil/60 focus:ring-2 focus:ring-pencil/20 bg-white dark:bg-white/[0.04] dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Allocation summary */}
                <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                  {(() => {
                    const allocTotal = Object.entries(allocation)
                      .filter(([k]) => k !== 'bonus')
                      .reduce((sum, [, val]) => sum + val, 0)
                    const remaining = totalPaycheck - allocTotal
                    const isValid = Math.abs(remaining) < 0.01
                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-ink-muted dark:text-white/40">Allocated</span>
                          <span className="font-bold text-ink dark:text-chalk-white">{formatCurrency(allocTotal)}</span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-ink-muted dark:text-white/40">Remaining</span>
                          <span className={`font-bold ${isValid ? 'text-sage' : remaining > 0 ? 'text-amber-600' : 'text-rose'}`}>
                            {formatCurrency(Math.abs(remaining))}
                          </span>
                        </div>
                        {isValid && <p className="text-[11px] text-sage font-semibold">All funds allocated</p>}
                        {remaining > 0.01 && <p className="text-[11px] text-amber-600 dark:text-amber-400">{formatCurrency(remaining)} still needs a home</p>}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </>}

          {/* ── Past Paychecks ── */}
          <div className="mt-6">
            <h2 className="text-[12px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">Past Weeks</h2>
            {loadingHistory ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/[0.04] rounded-sm animate-pulse" />)}
              </div>
            ) : pastPaychecks.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06]">
                <p className="text-[13px] text-gray-400 dark:text-white/30">No past paychecks yet</p>
                <p className="text-[11px] text-gray-300 dark:text-white/20 mt-1">They'll show up here after each week</p>
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
                        // If allocated/verified, show read-only detail. Otherwise jump to editor for that week.
                        if (paycheck.status === 'allocated' || paycheck.status === 'verified') {
                          setSelectedPaycheck(paycheck)
                          setView('detail')
                        } else if (paycheck.week_number) {
                          navigate(`/paycheck?week=${paycheck.week_number}`)
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

          {/* Learn tip — educational styling (teal/learn theme) */}
          <details className="rounded-xl border border-teal/20 dark:border-teal/10 bg-teal/[0.04] dark:bg-teal/[0.02] group">
            <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-teal bg-teal/10 uppercase tracking-wider">Learn</span>
              <span className="text-sm font-semibold text-ink dark:text-chalk-white flex-1">Why Budget Your Paycheck?</span>
              <ChevronRight className="w-4 h-4 text-teal/40 transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-4 pb-4 text-[13px] text-ink-light dark:text-white/50 leading-relaxed border-t border-teal/10 pt-3">
              In real life, your paycheck doesn't all go to one place. Learning to split your earnings now builds habits that'll serve you for life. The 50/30/20 rule suggests: 50% needs, 30% wants, 20% savings.
            </div>
          </details>
        </div>
      </div>

      {/* ── Sticky bottom bar: running total + submit ── */}
      {(isEditable || draftStatus === 'verified') && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[240px] z-30 bg-alpha-blue-50/95 dark:bg-[#0c100c]/95 backdrop-blur-xl border-t border-alpha-blue-200">
          <div className="max-w-3xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black text-black/55 dark:text-white/50 uppercase tracking-[0.15em]">Total Earnings</p>
              <p className="text-[24px] font-black text-black dark:text-white tabular-nums">
                <AnimNum value={totalPaycheck} prefix="$" />
              </p>
              {totalPaycheck > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {earnings.basePay > 0 && <span className="text-[10px] text-gray-400 dark:text-white/30">Base {formatCurrency(earnings.basePay)}</span>}
                  {earnings.epicBonus > 0 && <span className="text-[10px] text-pencil">Epic {formatCurrency(earnings.epicBonus)}</span>}
                  {earnings.bonusXp > 0 && <span className="text-[10px] text-amber-600 dark:text-amber-400">XP +{formatCurrency(earnings.bonusXp)}</span>}
                  {earnings.masteryRewards > 0 && <span className="text-[10px] text-sage-500">Tests {formatCurrency(earnings.masteryRewards)}</span>}
                  {earnings.jobPay > 0 && <span className="text-[10px] text-stone-500">Job {formatCurrency(earnings.jobPay)}</span>}
                  {earnings.customBonusTotal > 0 && <span className="text-[10px] text-stone-500">Other {formatCurrency(earnings.customBonusTotal)}</span>}
                </div>
              )}
            </div>
            {draftStatus === 'verified' || draftStatus === 'allocated' ? (
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border-[2px] border-black text-[12px] font-black">✓ In Savings</span>
            ) : (
              <button
                onClick={handleLockIn}
                disabled={loading || totalPaycheck <= 0}
                className={`rounded-full px-6 py-3 text-[14px] font-bold border border-alpha-blue-500 transition-all flex items-center gap-2 ${
                  totalPaycheck > 0 && !loading
                    ? 'bg-alpha-blue-500 text-white shadow-soft hover:bg-alpha-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Submitting...' : (
                  <>
                    <Send className="w-4 h-4" strokeWidth={2.6} />
                    Submit for Guide Review
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
