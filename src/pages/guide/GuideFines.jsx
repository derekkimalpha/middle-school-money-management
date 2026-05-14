import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, X, Trash2, Send, Users, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../lib/constants'

export const GuideFines = () => {
  const { profile } = useAuth()
  const [fineTypes, setFineTypes] = useState([])
  const [students, setStudents] = useState([])
  const [recentFines, setRecentFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Quick-issue state
  const [activeFine, setActiveFine] = useState(null) // currently selected fine type for issuing
  const [issuingTo, setIssuingTo] = useState(null) // student id currently being issued to (for loading state)
  const [justIssued, setJustIssued] = useState({}) // { [studentId]: true } for green checkmark flash

  // Add fine type modal
  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState({ title: '', amount: '', description: '' })
  const [savingType, setSavingType] = useState(false)

  // Manage mode
  const [manageMode, setManageMode] = useState(false)

  // Show recent
  const [showRecent, setShowRecent] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [typesRes, studentsRes, finesRes] = await Promise.all([
        supabase.from('fine_definitions').select('*').eq('active', true).order('amount'),
        supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
        supabase.from('student_fines')
          .select('*, student:profiles!student_id(full_name), fine_type:fine_definitions(title)')
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setFineTypes(typesRes.data || [])
      setStudents(studentsRes.data || [])
      setRecentFines(finesRes.data || [])
    } catch (err) {
      console.error('Failed to fetch fines data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddType = async () => {
    if (!newType.title || !newType.amount) {
      setToast({ type: 'error', text: 'Title and amount are required' })
      return
    }
    setSavingType(true)
    try {
      const { error } = await supabase.from('fine_definitions').insert({
        title: newType.title,
        amount: parseFloat(newType.amount),
        description: newType.description || null,
        icon: '',
      })
      if (error) throw error
      setToast({ type: 'success', text: `"${newType.title}" added` })
      setNewType({ title: '', amount: '', description: '' })
      setShowAddType(false)
      await fetchAll()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to add fine type' })
    } finally {
      setSavingType(false)
    }
  }

  const handleDeleteType = async (id, title) => {
    try {
      await supabase.from('fine_definitions').update({ active: false }).eq('id', id)
      setToast({ type: 'success', text: `"${title}" removed` })
      if (activeFine?.id === id) setActiveFine(null)
      await fetchAll()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to remove' })
    }
  }

  const quickIssueFine = async (student) => {
    if (!activeFine || issuingTo) return
    setIssuingTo(student.id)
    try {
      const { error } = await supabase.rpc('issue_fine', {
        p_student_id: student.id,
        p_fine_def_id: activeFine.id,
        p_amount: activeFine.amount,
        p_reason: activeFine.title,
        p_issued_by: profile?.id,
      })
      if (error) throw error
      setJustIssued(prev => ({ ...prev, [student.id]: true }))
      setTimeout(() => setJustIssued(prev => { const n = { ...prev }; delete n[student.id]; return n }), 1500)
      setToast({
        type: 'success',
        text: `${student.full_name.split(' ')[0]} fined ${formatCurrency(activeFine.amount)}`,
      })
      fetchAll()
    } catch (err) {
      console.error('Issue fine error:', err)
      setToast({ type: 'error', text: 'Failed to issue fine' })
    } finally {
      setIssuingTo(null)
    }
  }

  const fineAllStudents = async () => {
    if (!activeFine || issuingTo) return
    setIssuingTo('all')
    try {
      for (const student of students) {
        const { error } = await supabase.rpc('issue_fine', {
          p_student_id: student.id,
          p_fine_def_id: activeFine.id,
          p_amount: activeFine.amount,
          p_reason: activeFine.title,
          p_issued_by: profile?.id,
        })
        if (error) throw error
      }
      students.forEach(s => setJustIssued(prev => ({ ...prev, [s.id]: true })))
      setTimeout(() => setJustIssued({}), 1500)
      setToast({
        type: 'success',
        text: `${activeFine.title} issued to all ${students.length} students`,
      })
      fetchAll()
    } catch (err) {
      console.error('Issue fine error:', err)
      setToast({ type: 'error', text: 'Failed to issue fines' })
    } finally {
      setIssuingTo(null)
    }
  }

  // Group fine types by amount
  const grouped = fineTypes.reduce((acc, ft) => {
    const key = ft.amount
    if (!acc[key]) acc[key] = []
    acc[key].push(ft)
    return acc
  }, {})
  const sortedAmounts = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))

  if (loading) {
    return (
      <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-ds-inset rounded-ds-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
      <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
        <Toast message={toast} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">Fines</h1>
              <p className="text-[13px] text-ds-tertiary mt-1">
                Tap a fine, then tap a student to issue
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setManageMode(!manageMode)}
                className={`px-3 py-1.5 rounded-ds-md text-[11px] font-semibold transition-colors ${
                  manageMode
                    ? 'bg-ds-negative-soft text-ds-negative border border-ds-hairline'
                    : 'text-ds-tertiary hover:bg-ds-overlay'
                }`}
              >
                {manageMode ? 'Done' : 'Edit'}
              </button>
              <button
                onClick={() => setShowAddType(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-ds-md bg-ds-accent text-ds-on-accent text-[11px] font-semibold hover:bg-ds-accent-hover transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>
        </motion.div>

        {/* Fine Types Grid — grouped by amount */}
        {sortedAmounts.map((amount) => (
          <div key={amount} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-ds-negative tabular-nums">-${amount}</span>
              <div className="flex-1 h-px bg-ds-hairline" />
            </div>
            <div className="flex flex-wrap gap-2">
              {grouped[amount].map((ft) => (
                <motion.button
                  key={ft.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (manageMode) return
                    setActiveFine(activeFine?.id === ft.id ? null : ft)
                  }}
                  className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-ds-lg text-left transition-all border ${
                    activeFine?.id === ft.id
                      ? 'bg-ds-negative text-white border-ds-negative'
                      : 'bg-ds-negative-soft border-ds-hairline hover:bg-ds-overlay'
                  }`}
                >
                  <span className={`text-[13px] font-semibold ${activeFine?.id === ft.id ? 'text-white' : 'text-ds-negative'}`}>
                    {ft.title}
                  </span>
                  {manageMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteType(ft.id, ft.title) }}
                      className="ml-1 p-0.5 rounded-full hover:bg-ds-negative-soft text-ds-tertiary hover:text-ds-negative"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {/* Student Selector — appears when a fine is selected */}
        <AnimatePresence>
          {activeFine && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 mb-8 rounded-ds-xl bg-ds-surface border border-ds-hairline p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em]">
                      Issue "{activeFine.title}" to:
                    </p>
                  </div>
                  <button
                    onClick={fineAllStudents}
                    disabled={issuingTo === 'all'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-ds-md bg-ds-negative-soft text-ds-negative text-[11px] font-semibold hover:bg-ds-overlay transition-colors disabled:opacity-50"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {issuingTo === 'all' ? 'Issuing...' : 'Fine All'}
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {students.map(s => {
                    const firstName = s.full_name.split(' ')[0]
                    const initials = s.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                    const wasJustIssued = justIssued[s.id]
                    const isCurrentlyIssuing = issuingTo === s.id

                    return (
                      <motion.button
                        key={s.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => quickIssueFine(s)}
                        disabled={isCurrentlyIssuing || wasJustIssued}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-ds-lg transition-all border ${
                          wasJustIssued
                            ? 'bg-ds-accent-soft border-ds-hairline'
                            : 'border-ds-hairline hover:bg-ds-overlay'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors ${
                          wasJustIssued
                            ? 'bg-ds-accent-soft text-ds-positive'
                            : 'bg-ds-inset text-ds-tertiary'
                        }`}>
                          {wasJustIssued ? (
                            <Check className="w-5 h-5" />
                          ) : isCurrentlyIssuing ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-ds-hairline border-t-ds-negative rounded-full"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <span className={`text-[11px] font-semibold ${
                          wasJustIssued ? 'text-ds-positive' : 'text-ds-primary'
                        }`}>
                          {firstName}
                        </span>
                        {wasJustIssued && (
                          <span className="text-[9px] font-semibold text-ds-positive tabular-nums">-${activeFine.amount}</span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Fines — collapsible */}
        {recentFines.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] hover:text-ds-secondary transition-colors"
            >
              Recent Fines
              {showRecent ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <AnimatePresence>
              {showRecent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5">
                    {recentFines.map((fine, i) => (
                      <motion.div
                        key={fine.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 rounded-ds-lg bg-ds-surface border border-ds-hairline"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-ds-primary">
                            {fine.student?.full_name}
                          </p>
                          <p className="text-[10px] text-ds-tertiary">
                            {fine.reason || fine.fine_type?.title}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-ds-negative tabular-nums">
                          -{formatCurrency(fine.amount)}
                        </span>
                        <span className="text-[10px] text-ds-tertiary">
                          {new Date(fine.created_at).toLocaleDateString()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Add Type Modal */}
        <AnimatePresence>
          {showAddType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddType(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-ds-surface rounded-ds-xl p-6 w-full max-w-md mx-4 border border-ds-hairline"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-ds-primary">New Fine Type</h3>
                  <button onClick={() => setShowAddType(false)} className="text-ds-tertiary hover:text-ds-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1.5 block">Title</label>
                    <input
                      value={newType.title}
                      onChange={(e) => setNewType({ ...newType, title: e.target.value })}
                      placeholder="e.g. Late to Class"
                      className="w-full px-3 py-2.5 rounded-ds-lg border border-ds-hairline bg-ds-inset text-[13px] text-ds-primary placeholder-ds-tertiary focus:outline-none focus:border-ds-border"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1.5 block">Amount ($)</label>
                    <input
                      type="number"
                      value={newType.amount}
                      onChange={(e) => setNewType({ ...newType, amount: e.target.value })}
                      placeholder="5"
                      className="w-full px-3 py-2.5 rounded-ds-lg border border-ds-hairline bg-ds-inset text-[13px] text-ds-primary placeholder-ds-tertiary focus:outline-none focus:border-ds-border tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1.5 block">Description (optional)</label>
                    <input
                      value={newType.description}
                      onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                      placeholder="Short description"
                      className="w-full px-3 py-2.5 rounded-ds-lg border border-ds-hairline bg-ds-inset text-[13px] text-ds-primary placeholder-ds-tertiary focus:outline-none focus:border-ds-border"
                    />
                  </div>

                  <button
                    onClick={handleAddType}
                    disabled={savingType}
                    className="w-full py-3 rounded-ds-lg bg-ds-accent text-ds-on-accent text-[13px] font-semibold hover:bg-ds-accent-hover transition-colors disabled:opacity-50"
                  >
                    {savingType ? 'Adding...' : 'Add Fine Type'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
