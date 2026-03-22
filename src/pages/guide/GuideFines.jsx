import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, X, Trash2, Send, DollarSign, Users, Edit3 } from 'lucide-react'
import { Toast, AnimNum } from '../../components/shared'
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

  // Add fine type modal
  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState({ title: '', amount: '', description: '', icon: '' })
  const [savingType, setSavingType] = useState(false)

  // Issue fine modal
  const [showIssueFine, setShowIssueFine] = useState(false)
  const [selectedFineType, setSelectedFineType] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [customNote, setCustomNote] = useState('')
  const [issuingFine, setIssuingFine] = useState(false)

  const ICON_OPTIONS = [] // icons removed for cleaner aesthetic

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
          .select('*, student:profiles!student_id(full_name), fine_type:fine_definitions(title, icon)')
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
        icon: newType.icon,
      })
      if (error) throw error
      setToast({ type: 'success', text: `"${newType.title}" fine type added` })
      setNewType({ title: '', amount: '', description: '', icon: '' })
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
      await fetchAll()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to remove' })
    }
  }

  const handleIssueFine = async () => {
    if (!selectedStudent || !selectedFineType) return
    setIssuingFine(true)
    try {
      const { data, error } = await supabase.rpc('issue_fine', {
        p_student_id: selectedStudent.id,
        p_fine_def_id: selectedFineType.id,
        p_amount: selectedFineType.amount,
        p_reason: customNote || `${selectedFineType.title}`,
        p_issued_by: profile?.id,
      })
      if (error) throw error
      setToast({
        type: 'success',
        text: `${formatCurrency(selectedFineType.amount)} fine issued to ${selectedStudent.full_name}`,
      })
      setShowIssueFine(false)
      setSelectedStudent(null)
      setSelectedFineType(null)
      setCustomNote('')
      await fetchAll()
    } catch (err) {
      console.error('Issue fine error:', err)
      setToast({ type: 'error', text: 'Failed to issue fine' })
    } finally {
      setIssuingFine(false)
    }
  }

  const openIssueFine = (fineType) => {
    setSelectedFineType(fineType)
    setSelectedStudent(null)
    setCustomNote('')
    setShowIssueFine(true)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-surface-2 dark:bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <Toast message={toast} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-hand font-bold text-ink dark:text-chalk-white">Fines</h1>
        <p className="text-[13px] text-ink-muted dark:text-white/40 mt-1">
          Set up fine types and issue fines to students
        </p>
      </motion.div>

      {/* Fine Types */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider">
            Fine Types
          </h2>
          <button
            onClick={() => setShowAddType(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink dark:bg-chalk-white text-white dark:text-ink text-[11px] font-bold hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Type
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fineTypes.map((ft, i) => (
            <motion.div
              key={ft.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-400">${ft.amount}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-ink dark:text-chalk-white">{ft.title}</p>
                {ft.description && (
                  <p className="text-[10px] text-ink-faint dark:text-white/30 truncate">{ft.description}</p>
                )}
              </div>
              <span className="text-sm font-black text-rose tabular-nums flex-shrink-0">
                -${ft.amount}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openIssueFine(ft)}
                  className="p-1.5 rounded-lg hover:bg-rose-bg text-ink-muted hover:text-rose transition-colors"
                  title="Issue this fine"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteType(ft.id, ft.title)}
                  className="p-1.5 rounded-lg hover:bg-rose-bg text-ink-faint hover:text-rose transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Issue */}
      <div className="mb-8">
        <h2 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
          <Send className="w-3.5 h-3.5 inline mr-1.5" />
          Quick Issue
        </h2>
        <div className="rounded-xl p-5 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fineTypes.map(ft => (
              <button
                key={ft.id}
                onClick={() => openIssueFine(ft)}
                className="flex items-center gap-2 p-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] hover:border-rose/30 hover:bg-rose-bg/50 dark:hover:bg-rose/[0.04] transition-all text-left"
              >
                <div className="w-6 h-6 rounded bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-[10px] font-bold text-rose-600 dark:text-rose-400">${ft.amount}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-ink dark:text-chalk-white truncate">{ft.title}</p>
                  <p className="text-[10px] font-bold text-rose">-${ft.amount}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Fines */}
      {recentFines.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
            Recent Fines
          </h2>
          <div className="space-y-1.5">
            {recentFines.map((fine, i) => (
              <motion.div
                key={fine.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-400">${fine.amount}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                    {fine.student?.full_name}
                  </p>
                  <p className="text-[10px] text-ink-faint dark:text-white/30">
                    {fine.reason || fine.fine_type?.title}
                  </p>
                </div>
                <span className="text-sm font-bold text-rose tabular-nums">
                  -{formatCurrency(fine.amount)}
                </span>
                <span className="text-[10px] text-ink-faint dark:text-white/25">
                  {new Date(fine.created_at).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
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
              className="bg-white dark:bg-[#1e2a1e] rounded-2xl p-6 w-full max-w-md mx-4 border border-black/10 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-hand font-bold text-ink dark:text-chalk-white">New Fine Type</h3>
                <button onClick={() => setShowAddType(false)} className="text-ink-faint hover:text-ink dark:hover:text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Icon picker */}
                <div>
                  <label className="text-[11px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-1.5 block">Icon</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewType({ ...newType, icon })}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${
                          newType.icon === icon
                            ? 'border-ink dark:border-chalk-white bg-surface-2 dark:bg-white/[0.08]'
                            : 'border-transparent hover:bg-surface-2 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-1.5 block">Title</label>
                  <input
                    value={newType.title}
                    onChange={(e) => setNewType({ ...newType, title: e.target.value })}
                    placeholder="e.g. Late to Class"
                    className="w-full px-3 py-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-surface-2 dark:bg-white/[0.04] text-[13px] text-ink dark:text-chalk-white placeholder-ink-faint dark:placeholder-white/30 focus:outline-none focus:border-ink/20 dark:focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-1.5 block">Amount ($)</label>
                  <input
                    type="number"
                    value={newType.amount}
                    onChange={(e) => setNewType({ ...newType, amount: e.target.value })}
                    placeholder="5"
                    className="w-full px-3 py-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-surface-2 dark:bg-white/[0.04] text-[13px] text-ink dark:text-chalk-white placeholder-ink-faint dark:placeholder-white/30 focus:outline-none focus:border-ink/20 dark:focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
                  <input
                    value={newType.description}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    placeholder="Short description"
                    className="w-full px-3 py-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-surface-2 dark:bg-white/[0.04] text-[13px] text-ink dark:text-chalk-white placeholder-ink-faint dark:placeholder-white/30 focus:outline-none focus:border-ink/20 dark:focus:border-white/20"
                  />
                </div>

                <button
                  onClick={handleAddType}
                  disabled={savingType}
                  className="w-full py-3 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors disabled:opacity-50"
                >
                  {savingType ? 'Adding...' : 'Add Fine Type'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issue Fine Modal */}
      <AnimatePresence>
        {showIssueFine && selectedFineType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowIssueFine(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1e2a1e] rounded-2xl p-6 w-full max-w-md mx-4 border border-black/10 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedFineType.icon}</span>
                  <h3 className="text-lg font-hand font-bold text-ink dark:text-chalk-white">
                    Issue Fine
                  </h3>
                </div>
                <button onClick={() => setShowIssueFine(false)} className="text-ink-faint hover:text-ink dark:hover:text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl p-3 bg-rose-bg dark:bg-rose/[0.06] border border-rose/20 mb-4">
                <p className="text-[13px] font-bold text-ink dark:text-chalk-white">{selectedFineType.title}</p>
                <p className="text-lg font-black text-rose">-{formatCurrency(selectedFineType.amount)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-1.5 block">Student</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                    {students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={`p-2.5 rounded-lg text-[12px] font-bold text-left transition-all border ${
                          selectedStudent?.id === s.id
                            ? 'border-ink dark:border-chalk-white bg-surface-2 dark:bg-white/[0.08] text-ink dark:text-chalk-white'
                            : 'border-transparent text-ink-light dark:text-white/50 hover:bg-surface-2 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        {s.full_name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-1.5 block">Note (optional)</label>
                  <input
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Additional context"
                    className="w-full px-3 py-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-surface-2 dark:bg-white/[0.04] text-[13px] text-ink dark:text-chalk-white placeholder-ink-faint dark:placeholder-white/30 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleIssueFine}
                  disabled={issuingFine || !selectedStudent}
                  className="w-full py-3 rounded-xl bg-rose text-white text-[13px] font-bold hover:bg-rose/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {issuingFine ? 'Issuing...' : `Fine ${selectedStudent?.full_name || 'Student'} ${formatCurrency(selectedFineType.amount)}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
