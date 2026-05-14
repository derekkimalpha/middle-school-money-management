import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Settings, X, Lock } from 'lucide-react'
import { Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../lib/constants'

const SUBJECTS = [
  { key: 'math', label: 'Math' },
  { key: 'reading', label: 'Reading' },
  { key: 'language', label: 'Language' },
  { key: 'science', label: 'Science' },
]

export const GuideMAP = () => {
  const { profile } = useAuth()
  const [students, setStudents] = useState([])
  const [mapTests, setMapTests] = useState([])
  const [payoutSettings, setPayoutSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [toggling, setToggling] = useState(null) // "studentId-subject-tier" while processing
  const [showSettings, setShowSettings] = useState(false)
  const [editingSettings, setEditingSettings] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [studentsRes, testsRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
        supabase.from('map_tests').select('*').order('created_at', { ascending: false }),
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

  // Check if a student has earned a specific tier for a subject
  const hasEarned = (studentId, subject, tier) => {
    return mapTests.some(t =>
      t.student_id === studentId &&
      t.subject === subject &&
      ((tier === '99' && t.percentile >= 99) ||
       (tier === '90-98' && t.percentile >= 90 && t.percentile <= 98))
    )
  }

  // Get payout amount for a tier/subject combo
  const getPayoutAmount = (subject, tier, gradeLevel) => {
    const isScience = subject === 'science'
    const gradeNum = parseInt(gradeLevel) || 6
    const gradeBand = gradeNum <= 5 ? '4-5' : '6-8'
    const subjectType = isScience ? 'science' : 'standard'

    // Science below 99th gets nothing
    if (isScience && tier === '90-98') return 0

    const setting = payoutSettings.find(s =>
      s.grade_band === gradeBand && s.percentile_tier === tier && s.subject_type === subjectType
    )
    return setting?.payout || 0
  }

  // Toggle a MAP achievement on/off
  const handleToggle = async (student, subject, tier) => {
    const key = `${student.id}-${subject}-${tier}`
    if (toggling) return
    setToggling(key)

    const alreadyEarned = hasEarned(student.id, subject, tier)

    try {
      if (alreadyEarned) {
        // Remove the test and reverse payout from roth
        const test = mapTests.find(t =>
          t.student_id === student.id &&
          t.subject === subject &&
          ((tier === '99' && t.percentile >= 99) ||
           (tier === '90-98' && t.percentile >= 90 && t.percentile <= 98))
        )
        if (!test) return

        if (test.payout > 0) {
          const { data: acct } = await supabase
            .from('accounts')
            .select('id, balance')
            .eq('student_id', student.id)
            .eq('account_type', 'roth')
            .single()

          if (acct) {
            await supabase.from('accounts')
              .update({ balance: Math.max(0, acct.balance - test.payout) })
              .eq('id', acct.id)
          }
        }

        await supabase.from('map_tests').delete().eq('id', test.id)
        setMapTests(prev => prev.filter(t => t.id !== test.id))
        setToast({ type: 'success', message: `Removed ${student.full_name}'s ${subject} ${tier === '99' ? '99th' : '90-98th'} percentile` })
      } else {
        // Add the test and deposit payout to roth
        const percentile = tier === '99' ? 99 : 95
        const gradeLevel = student.grade_level || '6th'
        const payout = getPayoutAmount(subject, tier, gradeLevel)

        const { data, error } = await supabase.from('map_tests').insert({
          student_id: student.id,
          subject,
          percentile,
          grade_level: gradeLevel,
          test_date: new Date().toISOString().split('T')[0],
          payout,
          is_first_time: true,
          locked: true,
          entered_by: profile?.id,
        }).select().single()

        if (error) throw error

        // Deposit to roth account
        if (payout > 0) {
          const { data: acct } = await supabase
            .from('accounts')
            .select('id, balance')
            .eq('student_id', student.id)
            .eq('account_type', 'roth')
            .single()

          if (acct) {
            await supabase.from('accounts')
              .update({ balance: acct.balance + payout })
              .eq('id', acct.id)
          }
        }

        setMapTests(prev => [data, ...prev])
        setToast({
          type: 'success',
          message: payout > 0
            ? `${formatCurrency(payout)} deposited to ${student.full_name}'s Roth account`
            : `${student.full_name}'s ${subject} score recorded (no payout for this tier)`
        })
      }
    } catch (err) {
      console.error('Toggle error:', err)
      setToast({ type: 'error', message: 'Failed to update MAP score' })
    } finally {
      setToggling(null)
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

  // Get total roth balance for display
  const getStudentTotal = (studentId) => {
    return mapTests
      .filter(t => t.student_id === studentId)
      .reduce((sum, t) => sum + (t.payout || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-[3px] border-ds-hairline border-t-ds-accent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
      <div className="space-y-6">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">MAP Testing</h1>
            <p className="text-sm text-ds-tertiary mt-1">
              Toggle achievements to deposit payouts into each student's Roth account.
            </p>
          </div>
          <button
            onClick={() => { setEditingSettings([...payoutSettings]); setShowSettings(true) }}
            className="flex items-center gap-2 px-4 py-2 border border-ds-hairline rounded-ds-md text-sm font-medium text-ds-secondary hover:bg-ds-overlay"
          >
            <Settings className="w-4 h-4" /> Payouts
          </button>
        </div>

        {/* Student Cards */}
        <div className="space-y-4">
          {students.map((student, si) => {
            const total = getStudentTotal(student.id)
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.04 }}
                className="bg-ds-surface rounded-ds-xl border border-ds-hairline overflow-hidden"
              >
                {/* Student header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-ds-hairline">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ds-inset flex items-center justify-center text-sm font-semibold text-ds-secondary">
                      {student.full_name.charAt(0)}
                    </div>
                    <span className="font-semibold text-ds-primary">{student.full_name}</span>
                  </div>
                  {total > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Lock className="w-3.5 h-3.5 text-ds-secondary" />
                      <span className="font-bold text-ds-primary tabular-nums">{formatCurrency(total)}</span>
                      <span className="text-[10px] text-ds-tertiary">Roth</span>
                    </div>
                  )}
                </div>

                {/* Subject rows */}
                <div className="px-5 py-3 space-y-3">
                  {SUBJECTS.map(({ key: subj, label }) => {
                    const has99 = hasEarned(student.id, subj, '99')
                    const has90 = hasEarned(student.id, subj, '90-98')
                    const payout99 = getPayoutAmount(subj, '99', student.grade_level || '6th')
                    const payout90 = getPayoutAmount(subj, '90-98', student.grade_level || '6th')
                    const is99Toggling = toggling === `${student.id}-${subj}-99`
                    const is90Toggling = toggling === `${student.id}-${subj}-90-98`

                    return (
                      <div key={subj} className="flex items-center justify-between">
                        <span className="text-sm text-ds-secondary w-20">{label}</span>
                        <div className="flex gap-2">
                          {/* 99th percentile toggle */}
                          <button
                            onClick={() => handleToggle(student, subj, '99')}
                            disabled={!!toggling}
                            className={`px-3 py-1.5 rounded-ds-md text-xs font-semibold transition-all tabular-nums ${
                              has99
                                ? 'bg-ds-inset text-ds-primary border border-ds-border'
                                : 'bg-ds-inset text-ds-tertiary border border-ds-hairline hover:border-ds-border hover:text-ds-secondary'
                            } ${is99Toggling ? 'opacity-50' : ''}`}
                          >
                            {is99Toggling ? '...' : `99th${payout99 > 0 ? ` · ${formatCurrency(payout99)}` : ''}`}
                          </button>

                          {/* 90-98th percentile toggle (skip science) */}
                          {payout90 > 0 || subj !== 'science' ? (
                            <button
                              onClick={() => handleToggle(student, subj, '90-98')}
                              disabled={!!toggling || (subj === 'science')}
                              className={`px-3 py-1.5 rounded-ds-md text-xs font-semibold transition-all tabular-nums ${
                                subj === 'science'
                                  ? 'bg-ds-inset text-ds-tertiary border border-ds-hairline cursor-not-allowed'
                                  : has90
                                    ? 'bg-ds-accent-soft text-ds-positive border border-ds-hairline'
                                    : 'bg-ds-inset text-ds-tertiary border border-ds-hairline hover:border-ds-border hover:text-ds-positive'
                              } ${is90Toggling ? 'opacity-50' : ''}`}
                            >
                              {is90Toggling ? '...' : `90-98th${payout90 > 0 ? ` · ${formatCurrency(payout90)}` : subj === 'science' ? ' · n/a' : ''}`}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-ds-surface rounded-ds-xl w-full max-w-lg p-6 border border-ds-hairline"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-ds-primary">MAP Payout Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-1 text-ds-tertiary hover:text-ds-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {['6-8', '4-5'].map(band => (
                  <div key={band}>
                    <h3 className="text-sm font-semibold text-ds-primary mb-2">
                      {band === '6-8' ? '6th-8th Grade' : '4th-5th Grade'}
                    </h3>
                    <div className="space-y-2">
                      {editingSettings.filter(s => s.grade_band === band).map(setting => (
                        <div key={setting.id} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-ds-secondary flex-1">
                            {setting.percentile_tier === '99' ? '99th' : '90-98th'} percentile
                            {' '}({setting.subject_type === 'science' ? 'Science' : 'Standard subjects'})
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-ds-tertiary">$</span>
                            <input
                              type="number"
                              min="0"
                              value={setting.payout}
                              onChange={e => {
                                setEditingSettings(editingSettings.map(s =>
                                  s.id === setting.id ? { ...s, payout: parseFloat(e.target.value) || 0 } : s
                                ))
                              }}
                              className="w-24 px-2 py-1.5 border border-ds-hairline rounded-ds-md text-sm text-right bg-ds-inset text-ds-primary tabular-nums focus:outline-none focus:border-ds-border"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-ds-hairline">
                  <p className="text-[11px] text-ds-tertiary mb-3">
                    Payouts deposit into the student's Roth account (locked until graduation). Science only pays at 99th percentile.
                  </p>
                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-2.5 bg-ds-accent text-ds-on-accent rounded-ds-md font-semibold text-sm hover:bg-ds-accent-hover"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
