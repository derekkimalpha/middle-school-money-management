import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Plus, X, Trash2, DollarSign, Settings, ChevronDown, Lock, Award, AlertCircle } from 'lucide-react'
import { Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../lib/constants'

const SUBJECTS = ['math', 'reading', 'language', 'science']
const GRADE_LEVELS = ['4th', '5th', '6th', '7th', '8th', '9th', '10th']

const SUBJECT_LABELS = {
  math: '🔢 Math',
  reading: '📖 Reading',
  language: '✏️ Language',
  science: '🔬 Science',
}

export const GuideMAP = () => {
  const { profile } = useAuth()
  const [students, setStudents] = useState([])
  const [mapTests, setMapTests] = useState([])
  const [payoutSettings, setPayoutSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Add test modal
  const [showAddTest, setShowAddTest] = useState(false)
  const [newTest, setNewTest] = useState({
    student_id: '',
    subject: 'math',
    percentile: '',
    grade_level: '6th',
    test_date: new Date().toISOString().split('T')[0],
    rit_score: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Settings panel
  const [showSettings, setShowSettings] = useState(false)
  const [editingSettings, setEditingSettings] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [studentsRes, testsRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
        supabase.from('map_tests')
          .select('*, student:profiles!student_id(full_name)')
          .order('test_date', { ascending: false }),
        supabase.from('map_payout_settings').select('*'),
      ])
      setStudents(studentsRes.data || [])
      setMapTests(testsRes.data || [])
      setPayoutSettings(settingsRes.data || [])
    } catch (err) {
      console.error('Failed to fetch MAP data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate payout based on rules
  const calculatePayout = useCallback((subject, percentile, gradeLevel, studentId) => {
    if (percentile < 90) return { amount: 0, reason: 'Below 90th percentile' }

    const isScience = subject === 'science'
    const gradeNum = parseInt(gradeLevel)
    const gradeBand = gradeNum <= 5 ? '4-5' : '6-8'
    const tier = percentile >= 99 ? '99' : '90-98'

    // Science below 99th gets nothing
    if (isScience && tier === '90-98') {
      return { amount: 0, reason: 'Science requires 99th percentile' }
    }

    // Check if first time or re-earn
    const previousTests = mapTests.filter(t =>
      t.student_id === studentId && t.subject === subject
    )

    if (previousTests.length > 0) {
      const best = previousTests.reduce((max, t) => t.percentile > max.percentile ? t : max, previousTests[0])

      if (best.percentile >= 99) {
        // Already hit 99th — must be 2 grades above current age level
        const bestGradeNum = parseInt(best.grade_level)
        if (gradeNum < bestGradeNum + 2) {
          return { amount: 0, reason: `Already earned 99th. Need ${bestGradeNum + 2}th grade level to re-earn.` }
        }
      } else if (best.percentile >= 90) {
        // Already hit 90-98th — must hit 99th at current age grade level
        if (percentile < 99) {
          return { amount: 0, reason: 'Already earned 90-98th. Need 99th to re-earn.' }
        }
      }
    }

    const subjectType = isScience ? 'science' : 'standard'
    const setting = payoutSettings.find(s =>
      s.grade_band === gradeBand && s.percentile_tier === tier && s.subject_type === subjectType
    )

    const amount = setting?.payout || 0
    const isFirstTime = previousTests.length === 0
    return {
      amount,
      reason: isFirstTime ? 'First time bonus' : 'Re-earn bonus',
      isFirstTime
    }
  }, [mapTests, payoutSettings])

  const handleAddTest = async () => {
    if (!newTest.student_id || !newTest.percentile || !newTest.grade_level || !newTest.test_date) {
      setToast({ type: 'error', message: 'Please fill in all required fields' })
      return
    }

    const percentile = parseInt(newTest.percentile)
    if (percentile < 1 || percentile > 99) {
      setToast({ type: 'error', message: 'Percentile must be between 1 and 99' })
      return
    }

    setSubmitting(true)
    try {
      const payoutInfo = calculatePayout(newTest.subject, percentile, newTest.grade_level, newTest.student_id)

      const { data, error } = await supabase.from('map_tests').insert({
        student_id: newTest.student_id,
        subject: newTest.subject,
        percentile,
        grade_level: newTest.grade_level,
        test_date: newTest.test_date,
        rit_score: newTest.rit_score ? parseInt(newTest.rit_score) : null,
        payout: payoutInfo.amount,
        is_first_time: payoutInfo.isFirstTime !== false,
        locked: true,
        notes: newTest.notes || null,
        entered_by: profile?.id,
      }).select('*, student:profiles!student_id(full_name)').single()

      if (error) throw error

      // If payout > 0, deposit to checking (locked)
      if (payoutInfo.amount > 0) {
        const { data: acct } = await supabase
          .from('accounts')
          .select('id, balance')
          .eq('student_id', newTest.student_id)
          .eq('account_type', 'checking')
          .single()

        if (acct) {
          await supabase.from('accounts')
            .update({ balance: acct.balance + payoutInfo.amount })
            .eq('id', acct.id)
        }
      }

      setMapTests([data, ...mapTests])
      setShowAddTest(false)
      setNewTest({
        student_id: '',
        subject: 'math',
        percentile: '',
        grade_level: '6th',
        test_date: new Date().toISOString().split('T')[0],
        rit_score: '',
        notes: '',
      })
      setToast({
        type: 'success',
        message: payoutInfo.amount > 0
          ? `MAP score recorded! ${formatCurrency(payoutInfo.amount)} deposited (locked until graduation).`
          : 'MAP score recorded. No payout earned.'
      })
    } catch (err) {
      console.error('Error adding MAP test:', err)
      setToast({ type: 'error', message: 'Failed to record MAP test' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTest = async (test) => {
    if (!confirm(`Delete ${test.student?.full_name}'s ${test.subject} MAP score?`)) return

    try {
      // If had payout, reverse it from checking
      if (test.payout > 0) {
        const { data: acct } = await supabase
          .from('accounts')
          .select('id, balance')
          .eq('student_id', test.student_id)
          .eq('account_type', 'checking')
          .single()

        if (acct) {
          await supabase.from('accounts')
            .update({ balance: Math.max(0, acct.balance - test.payout) })
            .eq('id', acct.id)
        }
      }

      await supabase.from('map_tests').delete().eq('id', test.id)
      setMapTests(mapTests.filter(t => t.id !== test.id))
      setToast({ type: 'success', message: 'MAP test deleted' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete' })
    }
  }

  const handleSaveSettings = async () => {
    try {
      for (const setting of editingSettings) {
        await supabase.from('map_payout_settings')
          .update({ payout: setting.payout })
          .eq('id', setting.id)
      }
      setPayoutSettings(editingSettings)
      setShowSettings(false)
      setToast({ type: 'success', message: 'Payout settings updated' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save settings' })
    }
  }

  // Preview payout as user fills form
  const previewPayout = newTest.student_id && newTest.percentile
    ? calculatePayout(newTest.subject, parseInt(newTest.percentile) || 0, newTest.grade_level, newTest.student_id)
    : null

  // Group tests by student
  const testsByStudent = students.map(s => ({
    ...s,
    tests: mapTests.filter(t => t.student_id === s.id),
    totalEarned: mapTests.filter(t => t.student_id === s.id).reduce((sum, t) => sum + (t.payout || 0), 0),
  })).filter(s => s.tests.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-[3px] border-stone-200 dark:border-stone-700 border-t-stone-600 dark:border-t-stone-400 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-chalk-white font-hand">MAP Testing</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
            Record MAP scores and manage payouts. Earnings are locked until graduation.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingSettings([...payoutSettings]); setShowSettings(true) }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm font-medium text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
          >
            <Settings className="w-4 h-4" /> Payouts
          </button>
          <button
            onClick={() => setShowAddTest(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ink dark:bg-white text-white dark:text-ink rounded-sm text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Record Score
          </button>
        </div>
      </div>

      {/* Payout Reference Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/30 rounded-sm p-4">
        <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" /> Payout Reference
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {['6-8', '4-5'].map(band => (
            <div key={band} className="space-y-1.5">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{band === '6-8' ? '6th–8th Grade' : '4th–5th Grade'}</p>
              {payoutSettings.filter(s => s.grade_band === band).map(s => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span className="text-amber-700/70 dark:text-amber-400/60">
                    {s.percentile_tier === '99' ? '99th' : '90–98th'} {s.subject_type === 'science' ? '(Science)' : '(Standard)'}
                  </span>
                  <span className={`font-semibold ${s.payout > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-gray-400 dark:text-white/20'}`}>
                    {s.payout > 0 ? formatCurrency(s.payout) : '—'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-700/20">
          <p className="text-[10px] text-amber-600/70 dark:text-amber-500/50 leading-relaxed">
            99th earners must score 99th <strong>2 grades above</strong> current level to re-earn. 90–98th earners must reach 99th at current level. Science pays only at 99th percentile.
          </p>
        </div>
      </div>

      {/* Student MAP Results */}
      {testsByStudent.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-white/30">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No MAP tests recorded yet</p>
          <p className="text-sm mt-1">Click "Record Score" to add a student's MAP results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testsByStudent.map(student => (
            <div key={student.id} className="bg-white dark:bg-white/[0.04] rounded-sm border border-gray-200 dark:border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 dark:text-teal-400">
                    {student.full_name.charAt(0)}
                  </div>
                  <span className="font-semibold text-ink dark:text-chalk-white">{student.full_name}</span>
                </div>
                {student.totalEarned > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(student.totalEarned)}</span>
                    <span className="text-[10px] text-gray-400 dark:text-white/30">locked</span>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {student.tests.map(test => (
                  <div key={test.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] group">
                    <div className="flex items-center gap-4">
                      <span className="text-lg">{SUBJECT_LABELS[test.subject]?.split(' ')[0]}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink dark:text-chalk-white">
                            {test.subject.charAt(0).toUpperCase() + test.subject.slice(1)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40">
                            {test.grade_level} grade
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            test.percentile >= 99 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                            test.percentile >= 90 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40'
                          }`}>
                            {test.percentile}th %ile
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
                          {new Date(test.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {test.rit_score && ` · RIT ${test.rit_score}`}
                          {test.notes && ` · ${test.notes}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {test.payout > 0 ? (
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> {formatCurrency(test.payout)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-white/20">—</span>
                      )}
                      <button
                        onClick={() => handleDeleteTest(test)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-white/20 hover:text-rose-500 dark:hover:text-rose-400 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Test Modal */}
      <AnimatePresence>
        {showAddTest && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddTest(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1a1918] rounded-sm shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-white/[0.1]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-ink dark:text-chalk-white font-hand">Record MAP Score</h2>
                <button onClick={() => setShowAddTest(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Student */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">Student</label>
                  <select
                    value={newTest.student_id}
                    onChange={e => setNewTest({ ...newTest, student_id: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                  >
                    <option value="">Select student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>

                {/* Subject + Grade */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">Subject</label>
                    <select
                      value={newTest.subject}
                      onChange={e => setNewTest({ ...newTest, subject: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">Grade Level</label>
                    <select
                      value={newTest.grade_level}
                      onChange={e => setNewTest({ ...newTest, grade_level: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                    >
                      {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {/* Percentile + RIT */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">Percentile (1-99)</label>
                    <input
                      type="number"
                      min="1" max="99"
                      value={newTest.percentile}
                      onChange={e => setNewTest({ ...newTest, percentile: e.target.value })}
                      placeholder="e.g. 95"
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">RIT Score (opt.)</label>
                    <input
                      type="number"
                      value={newTest.rit_score}
                      onChange={e => setNewTest({ ...newTest, rit_score: e.target.value })}
                      placeholder="e.g. 230"
                      className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                    />
                  </div>
                </div>

                {/* Test Date */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">Test Date</label>
                  <input
                    type="date"
                    value={newTest.test_date}
                    onChange={e => setNewTest({ ...newTest, test_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">Notes (opt.)</label>
                  <input
                    type="text"
                    value={newTest.notes}
                    onChange={e => setNewTest({ ...newTest, notes: e.target.value })}
                    placeholder="e.g. Fall 2026 MAP"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                  />
                </div>

                {/* Payout Preview */}
                {previewPayout && (
                  <div className={`p-3 rounded-sm border ${
                    previewPayout.amount > 0
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-700/30'
                      : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06]'
                  }`}>
                    <div className="flex items-center gap-2">
                      {previewPayout.amount > 0 ? (
                        <>
                          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            {formatCurrency(previewPayout.amount)} payout
                          </span>
                          <Lock className="w-3 h-3 text-amber-500 ml-1" />
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">locked</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-gray-400 dark:text-white/30" />
                          <span className="text-sm text-gray-500 dark:text-white/40">No payout</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-white/30 mt-1">{previewPayout.reason}</p>
                  </div>
                )}

                <button
                  onClick={handleAddTest}
                  disabled={submitting || !newTest.student_id || !newTest.percentile}
                  className="w-full py-2.5 bg-ink dark:bg-white text-white dark:text-ink rounded-sm font-semibold text-sm hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? 'Saving...' : 'Record MAP Score'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1a1918] rounded-sm shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-white/[0.1]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-ink dark:text-chalk-white font-hand">MAP Payout Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {['6-8', '4-5'].map(band => (
                  <div key={band}>
                    <h3 className="text-sm font-bold text-ink dark:text-chalk-white mb-2">
                      {band === '6-8' ? '6th–8th Grade' : '4th–5th Grade'}
                    </h3>
                    <div className="space-y-2">
                      {editingSettings.filter(s => s.grade_band === band).map(setting => (
                        <div key={setting.id} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-600 dark:text-white/50 flex-1">
                            {setting.percentile_tier === '99' ? '99th' : '90–98th'} percentile
                            {' '}({setting.subject_type === 'science' ? 'Science' : 'Standard subjects'})
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-400">$</span>
                            <input
                              type="number"
                              min="0"
                              value={setting.payout}
                              onChange={e => {
                                setEditingSettings(editingSettings.map(s =>
                                  s.id === setting.id ? { ...s, payout: parseFloat(e.target.value) || 0 } : s
                                ))
                              }}
                              className="w-24 px-2 py-1.5 border border-gray-200 dark:border-white/[0.1] rounded-sm text-sm text-right bg-white dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-gray-200 dark:border-white/[0.06]">
                  <p className="text-[11px] text-gray-400 dark:text-white/30 mb-3">
                    Re-earn rules: 99th percentile earners must score 99th at 2 grades above. 90-98th earners must reach 99th at current grade. Science only pays at 99th percentile.
                  </p>
                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-2.5 bg-ink dark:bg-white text-white dark:text-ink rounded-sm font-semibold text-sm hover:opacity-90"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
