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
import { ChevronRight, Trash2 } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export const StudentPaycheck = () => {
  const { user, profile } = useAuth()
  const { settings } = usePaycheckSettings()
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
    checking: 0,
    savings: 0,
    sp500: 0,
    nasdaq: 0,
    bonus: 0,
  })
  const [allocView, setAllocView] = useState('chart')

  // Fetch student's job
  useEffect(() => {
    if (!profile?.id) return

    const fetchJob = async () => {
      try {
        const { data } = await supabase
          .from('student_jobs')
          .select('job_id, jobs:job_id(*)')
          .eq('student_id', profile.id)
          .single()

        if (data?.jobs) {
          setStudentJob(data.jobs)
        }
      } catch (error) {
        console.error('Error fetching job:', error)
      }
    }

    fetchJob()
  }, [profile?.id])

  // Calculate earnings
  const calculateEarnings = () => {
    const xpDays = Object.values(xpByDay).reduce((sum, val) => sum + val, 0)
    const epicBonus = Object.values(epicDays).filter(Boolean).length * 50
    const basePay = (xpDays / (settings.xp_threshold || 600)) * (settings.base_pay || 10)
    const masteryRewards = masteryTests.reduce((sum, test) => {
      if (test.score >= 100) return sum + 100
      if (test.score >= 90) return sum + 20
      return sum
    }, 0)
    const jobPay = jobDone && studentJob ? studentJob.weekly_pay || 0 : 0

    return {
      basePay: Math.round(basePay * 100) / 100,
      epicBonus,
      masteryRewards,
      jobPay,
      smartGoal: smartGoal || 0,
      other: other || 0,
    }
  }

  const earnings = calculateEarnings()
  const totalPaycheck =
    earnings.basePay +
    earnings.epicBonus +
    earnings.masteryRewards +
    earnings.jobPay +
    earnings.smartGoal +
    earnings.other

  const xpThreshold = settings.xp_threshold || 600
  const totalXp = Object.values(xpByDay).reduce((sum, val) => sum + val, 0)
  const xpProgress = (totalXp / xpThreshold) * 100

  // Handle Step 1 Submit
  const handleStep1Submit = async () => {
    if (totalXp === 0 && !jobDone && masteryTests.length === 0 && smartGoal === 0 && other === 0) {
      setToast({
        type: 'error',
        text: 'Please log some activity or earnings',
      })
      return
    }

    setStep(2)
    setTimeout(() => {
      setStep(3)
    }, 900)
  }

  // Handle allocation change
  const handleAllocationChange = (account, value) => {
    const newAlloc = { ...allocation, [account]: Math.max(0, value) }
    setAllocation(newAlloc)
  }

  // Handle use suggested split
  const useSuggestedSplit = () => {
    const suggested = {
      checking: Math.round(totalPaycheck * 0.2 * 100) / 100,
      savings: Math.round(totalPaycheck * 0.3 * 100) / 100,
      sp500: Math.round(totalPaycheck * 0.25 * 100) / 100,
      nasdaq: Math.round(totalPaycheck * 0.15 * 100) / 100,
      bonus: Math.round(totalPaycheck * 0.1 * 100) / 100,
    }
    setAllocation(suggested)
  }

  // Validate allocation
  const allocTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0)
  const allocDiff = Math.abs(allocTotal - totalPaycheck)
  const isAllocValid = allocDiff < 0.01

  // Handle Step 3 Submit
  const handleStep3Submit = async () => {
    if (!isAllocValid) {
      setToast({
        type: 'error',
        text: `Allocation must equal ${formatCurrency(totalPaycheck)}`,
      })
      return
    }

    setLoading(true)
    try {
      // Insert paycheck
      const { data: paycheckData, error: paycheckError } = await supabase
        .from('weekly_paychecks')
        .insert({
          student_id: profile.id,
          base_pay: earnings.basePay,
          epic_bonus: earnings.epicBonus,
          mastery_rewards: earnings.masteryRewards,
          job_pay: earnings.jobPay,
          smart_goal: earnings.smartGoal,
          other: earnings.other,
          total_amount: totalPaycheck,
          allocation,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (paycheckError) throw paycheckError

      // Insert mastery tests
      if (masteryTests.length > 0) {
        const testsToInsert = masteryTests.map((test) => ({
          weekly_paycheck_id: paycheckData.id,
          subject: test.subject,
          grade: test.grade,
          score: test.score,
        }))

        const { error: testsError } = await supabase
          .from('mastery_tests')
          .insert(testsToInsert)

        if (testsError) throw testsError
      }

      // Call allocate_paycheck RPC
      const { error: allocError } = await supabase.rpc('allocate_paycheck', {
        paycheck_id: paycheckData.id,
        student_id: profile.id,
        allocation,
      })

      if (allocError) throw allocError

      setShowConfetti(true)
      setStep(4)
      setToast({
        type: 'success',
        text: 'Paycheck allocated successfully!',
      })

      // Reset after 3 seconds
      setTimeout(() => {
        setStep(1)
        setXpByDay({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 })
        setEpicDays({ mon: false, tue: false, wed: false, thu: false, fri: false })
        setMasteryTests([])
        setSmartGoal(0)
        setOther(0)
        setJobDone(false)
        setAllocation({
          checking: 0,
          savings: 0,
          sp500: 0,
          nasdaq: 0,
          bonus: 0,
        })
        setShowConfetti(false)
      }, 3000)
    } catch (error) {
      console.error('Error saving paycheck:', error)
      setToast({
        type: 'error',
        text: 'Failed to save paycheck',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray to-white p-6 pb-20">
      <Confetti active={showConfetti} />
      <Toast message={toast} />

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3, 4].map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s
                  ? 'bg-gradient-to-r from-green-400 to-sage-400 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
              animate={{ scale: step === s ? 1.1 : 1 }}
            >
              {s}
            </motion.div>
            {idx < 3 && (
              <div
                className={`w-12 h-1 rounded-full transition-all ${
                  step > s ? 'bg-sage-400' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Log XP */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Log Your Weekly XP
              </h1>
              <p className="text-slate-600">
                Track your effort and earnings for the week
              </p>
            </div>

            <FinTip
              icon="📊"
              title="How XP Works"
              color="from-blue-50 to-cyan-50"
            >
              XP represents your weekly effort. Log how much effort you put in each
              day. Epic days give you a bonus! Reaching your XP threshold earns you
              base pay.
            </FinTip>

            {/* Daily XP Inputs */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Daily XP</h3>
              <div className="grid grid-cols-5 gap-3 mb-6">
                {DAYS.map((day, idx) => {
                  const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri'][idx]
                  const isEpic = epicDays[dayKey]

                  return (
                    <div key={day} className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-700 text-center">
                        {day.slice(0, 3)}
                      </label>
                      <motion.input
                        type="number"
                        min="0"
                        max="200"
                        value={xpByDay[dayKey]}
                        onChange={(e) =>
                          setXpByDay({
                            ...xpByDay,
                            [dayKey]: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 text-center text-lg font-bold border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-200"
                        whileFocus={{ scale: 1.05 }}
                      />
                      <button
                        onClick={() =>
                          setEpicDays({
                            ...epicDays,
                            [dayKey]: !isEpic,
                          })
                        }
                        className={`text-xs font-semibold py-1 rounded-lg transition-all ${
                          isEpic
                            ? 'bg-amber-300 text-amber-900'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isEpic ? '🔥 Epic' : 'Epic'}
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Weekly XP Progress
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {totalXp} / {xpThreshold}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-green-400 to-sage-400 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {xpProgress >= 100 && (
                  <p className="text-xs text-sage-600 font-semibold mt-2">
                    ✓ XP threshold reached!
                  </p>
                )}
              </div>
            </div>

            {/* Job Card */}
            {studentJob && (
              <motion.div
                className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setJobDone(!jobDone)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{studentJob.icon || '💼'}</div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {studentJob.title}
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Weekly Pay: {formatCurrency(studentJob.weekly_pay || 0)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      jobDone
                        ? 'bg-sage-400 border-sage-400'
                        : 'border-slate-300'
                    }`}
                  >
                    {jobDone && <span className="text-white text-sm">✓</span>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mastery Tests Section */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Mastery Tests
              </h3>

              {masteryTests.length > 0 && (
                <div className="space-y-4 mb-6">
                  {masteryTests.map((test, idx) => {
                    const reward =
                      test.score >= 100 ? 100 : test.score >= 90 ? 20 : 0

                    return (
                      <motion.div
                        key={idx}
                        className="p-4 border-2 border-slate-200 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                                  Subject
                                </label>
                                <input
                                  type="text"
                                  value={test.subject}
                                  onChange={(e) => {
                                    const updated = [...masteryTests]
                                    updated[idx].subject = e.target.value
                                    setMasteryTests(updated)
                                  }}
                                  placeholder="Math, Science..."
                                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                                  Grade
                                </label>
                                <select
                                  value={test.grade}
                                  onChange={(e) => {
                                    const updated = [...masteryTests]
                                    updated[idx].grade = e.target.value
                                    setMasteryTests(updated)
                                  }}
                                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400"
                                >
                                  {GRADES.map((g) => (
                                    <option key={g} value={g}>
                                      {g}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                                  Score
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={test.score}
                                  onChange={(e) => {
                                    const updated = [...masteryTests]
                                    updated[idx].score = parseInt(e.target.value) || 0
                                    setMasteryTests(updated)
                                  }}
                                  placeholder="0-100"
                                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-sage-400"
                                />
                              </div>
                            </div>
                            {reward > 0 && (
                              <p className="text-xs text-sage-600 font-semibold mt-2">
                                Reward: {formatCurrency(reward)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setMasteryTests(masteryTests.filter((_, i) => i !== idx))
                            }}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {masteryTests.length < 6 && (
                <button
                  onClick={() =>
                    setMasteryTests([
                      ...masteryTests,
                      { subject: '', grade: 'K', score: 0 },
                    ])
                  }
                  className="text-sm font-semibold text-sage-600 hover:text-sage-700 mb-6"
                >
                  + Add Mastery Test
                </button>
              )}
            </div>

            {/* SMART Goal and Other */}
            <div className="grid grid-cols-2 gap-4 bg-white rounded-xl p-6 shadow-lg">
              <Field label="SMART Goal Bonus">
                <Input
                  type="number"
                  min="0"
                  value={smartGoal}
                  onChange={(e) => setSmartGoal(parseInt(e.target.value) || 0)}
                  placeholder="Amount"
                />
              </Field>
              <Field label="Other Income">
                <Input
                  type="number"
                  min="0"
                  value={other}
                  onChange={(e) => setOther(parseInt(e.target.value) || 0)}
                  placeholder="Amount"
                />
              </Field>
            </div>

            {/* Earnings Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-lg space-y-3">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Earnings Breakdown
              </h3>

              <div className="space-y-2 text-sm">
                {earnings.basePay > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Pay</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(earnings.basePay)}
                    </span>
                  </div>
                )}
                {earnings.epicBonus > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>🔥 Epic Week Bonus</span>
                    <span className="font-semibold">
                      {formatCurrency(earnings.epicBonus)}
                    </span>
                  </div>
                )}
                {earnings.masteryRewards > 0 && (
                  <div className="flex justify-between text-sage-600">
                    <span>📚 Mastery Tests</span>
                    <span className="font-semibold">
                      {formatCurrency(earnings.masteryRewards)}
                    </span>
                  </div>
                )}
                {earnings.jobPay > 0 && (
                  <div className="flex justify-between text-teal-600">
                    <span>💼 Job</span>
                    <span className="font-semibold">
                      {formatCurrency(earnings.jobPay)}
                    </span>
                  </div>
                )}
                {earnings.smartGoal > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>🎯 SMART Goal</span>
                    <span className="font-semibold">
                      {formatCurrency(earnings.smartGoal)}
                    </span>
                  </div>
                )}
                {earnings.other > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>⭐ Other</span>
                    <span className="font-semibold">
                      {formatCurrency(earnings.other)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-slate-200 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-slate-900">Total Paycheck</span>
                  <span className="text-xl font-bold text-sage-600">
                    <AnimNum value={totalPaycheck} prefix="$" />
                  </span>
                </div>
              </div>
            </div>

            <Button full size="lg" onClick={handleStep1Submit}>
              Review Allocation
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Verification (brief transition) */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center h-64"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-400 mx-auto mb-4"></div>
              <p className="text-slate-600 font-semibold">Verifying earnings...</p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Allocate */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Allocate Your Paycheck
              </h1>
              <p className="text-slate-600">
                Decide where your money goes
              </p>
            </div>

            <FinTip
              icon="📍"
              title="Smart Allocation"
              color="from-green-50 to-teal-50"
            >
              Balance your accounts wisely. Checking for daily needs, Savings for
              emergencies, investments for growth. A typical split is 20% checking,
              30% savings, 25% S&P, 15% NASDAQ, 10% bonus.
            </FinTip>

            {/* Suggested Split */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Suggested Split
                </h3>
                <Button size="sm" onClick={useSuggestedSplit}>
                  Use This
                </Button>
              </div>

              <div className="mb-4">
                {totalPaycheck > 0 && (
                  <DonutChart
                    data={[
                      { value: totalPaycheck * 0.2, color: '#7EA58C' },
                      { value: totalPaycheck * 0.3, color: '#14B8A6' },
                      { value: totalPaycheck * 0.25, color: '#F59E0B' },
                      { value: totalPaycheck * 0.15, color: '#A855F7' },
                      { value: totalPaycheck * 0.1, color: '#F43F5E' },
                    ]}
                    size={200}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#7EA58C]" />
                  <span className="text-slate-700">Checking 20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#14B8A6]" />
                  <span className="text-slate-700">Savings 30%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <span className="text-slate-700">S&P 500 25%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#A855F7]" />
                  <span className="text-slate-700">NASDAQ 15%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F43F5E]" />
                  <span className="text-slate-700">Bonus 10%</span>
                </div>
              </div>
            </div>

            {/* Your Split */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Your Split</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAllocView('chart')}
                    className={`px-3 py-1 text-sm font-semibold rounded-lg transition-all ${
                      allocView === 'chart'
                        ? 'bg-sage-400 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setAllocView('list')}
                    className={`px-3 py-1 text-sm font-semibold rounded-lg transition-all ${
                      allocView === 'list'
                        ? 'bg-sage-400 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {allocView === 'chart' && (
                <div className="mb-6">
                  {Object.values(allocation).some((v) => v > 0) ? (
                    <DonutChart
                      data={Object.entries(allocation)
                        .filter(([, value]) => value > 0)
                        .map(([account]) => ({
                          value: allocation[account],
                          color:
                            {
                              checking: '#7EA58C',
                              savings: '#14B8A6',
                              sp500: '#F59E0B',
                              nasdaq: '#A855F7',
                              bonus: '#F43F5E',
                            }[account],
                        }))}
                      size={200}
                    />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400">
                      Allocate funds to see chart
                    </div>
                  )}
                </div>
              )}

              {allocView === 'list' && (
                <div className="space-y-4 mb-6">
                  {Object.entries(allocation).map(([account, value]) => {
                    const meta = ACCOUNT_META[account]
                    const percentage =
                      totalPaycheck > 0 ? (value / totalPaycheck) * 100 : 0

                    return (
                      <div key={account}>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-semibold text-slate-700 capitalize">
                            {meta?.label}
                          </label>
                          <span className="text-sm text-slate-600">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={value}
                              onChange={(e) =>
                                handleAllocationChange(
                                  account,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                                meta?.borderColor || 'border-slate-300'
                              }`}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="w-20 bg-slate-200 rounded-lg p-2">
                            <div className="text-xs font-semibold text-slate-600 text-center">
                              {formatCurrency(value)}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                          <motion.div
                            className={`h-1.5 rounded-full ${
                              meta?.color?.replace('text-', 'bg-')
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Allocation Summary */}
              <div className="border-t-2 border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Allocated</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(allocTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Paycheck</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(totalPaycheck)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-900">Difference</span>
                  <span
                    className={`font-bold ${
                      isAllocValid ? 'text-sage-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(allocDiff)}
                  </span>
                </div>

                {isAllocValid && (
                  <p className="text-xs text-sage-600 font-semibold">
                    ✓ Allocation is valid
                  </p>
                )}
              </div>
            </div>

            <Button
              full
              size="lg"
              disabled={!isAllocValid || loading}
              onClick={handleStep3Submit}
            >
              {loading ? 'Saving...' : 'Lock It In'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="max-w-2xl mx-auto text-center space-y-8"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-6xl"
            >
              💰
            </motion.div>

            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Paid!</h1>
              <p className="text-xl text-slate-600">
                {formatCurrency(totalPaycheck)} allocated to your accounts
              </p>
            </div>

            {/* Account Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-lg space-y-3">
              {Object.entries(allocation)
                .filter(([, value]) => value > 0)
                .map(([account, value]) => {
                  const meta = ACCOUNT_META[account]

                  return (
                    <div
                      key={account}
                      className="flex justify-between items-center p-3 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            meta?.color?.replace('text-', 'bg-')
                          }`}
                        />
                        <span className="font-semibold text-slate-900">
                          {meta?.label}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  )
                })}
            </div>

            <p className="text-sm text-slate-600">
              Check your dashboard to see your updated balances
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
