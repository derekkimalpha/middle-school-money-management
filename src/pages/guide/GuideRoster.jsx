import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertCircle, Plus, X, DollarSign, Check, XCircle, HandCoins } from 'lucide-react'
import { AnimNum, Tag, Toast, Button, Input, Field } from '../../components/shared'
import { formatCurrency, ACCOUNT_META } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

export const GuideRoster = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [paycheck_count, setPaycheckCount] = useState(0)
  const [purchase_count, setPurchaseCount] = useState(0)
  const [cashout_requests, setCashoutRequests] = useState([])
  const [toast, setToast] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addFormData, setAddFormData] = useState({ name: '', email: '' })
  const [addingStudent, setAddingStudent] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchAlerts()
  }, [])

  useEffect(() => {
    const filtered = students.filter(student =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [searchQuery, students])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          accounts (
            id,
            account_type,
            balance
          )
        `)
        .eq('role', 'student')
        .order('full_name')

      if (error) throw error

      setStudents(data || [])
      setFilteredStudents(data || [])
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to load students' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const [paychecks, purchases, cashouts] = await Promise.all([
        supabase
          .from('weekly_paychecks')
          .select('id')
          .eq('status', 'submitted'),
        supabase
          .from('purchase_requests')
          .select('id')
          .eq('status', 'pending'),
        supabase
          .from('cash_out_requests')
          .select('*, profiles!cash_out_requests_student_id_fkey(full_name)')
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: true })
      ])

      setPaycheckCount(paychecks.data?.length || 0)
      setPurchaseCount(purchases.data?.length || 0)
      setCashoutRequests(cashouts.data || [])
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    }
  }

  const handleCashOutAction = async (requestId, action) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const rpcName = action === 'approve' ? 'approve_cash_out'
                    : action === 'paid' ? 'mark_cash_out_paid'
                    : 'deny_cash_out'
      const { data, error } = await supabase.rpc(rpcName, {
        p_request_id: requestId,
        p_guide_id: userData.user.id,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      // On approve: copy a Cash Card sheet row to clipboard so Derek can paste into Petter's sheet.
      // Column order matches "Payment Requests" tab:
      // Date, Requester, Program, FirstName, LastName, Email, Addr1, City, State, Zip, Phone, Reward$, Type, Reason, Notes
      if (action === 'approve') {
        const req = cashout_requests.find(r => r.id === requestId)
        const fullName = req?.profiles?.full_name || ''
        const [first, ...rest] = fullName.split(' ')
        const last = rest.join(' ')
        const today = new Date()
        const dateStr = `${today.getMonth()+1}/${today.getDate()}/${today.getFullYear()}`
        const row = [
          dateStr,
          'Derek Kim',
          'Alpha L3 & L4 - SF',
          first,
          last,
          req?.profiles?.email || '',
          '3741 Buchanan St',
          'SF',
          'CA',
          '94123',
          '',
          `$${Number(req?.amount || 0).toFixed(2)}`,
          'Physical Card',
          'S5 Cash Out',
          '',
        ].join('\t')
        try {
          await navigator.clipboard.writeText(row)
          setToast({ type: 'success', text: `Approved — row copied! Paste into Cash Card sheet (Payment Requests tab)` })
        } catch {
          setToast({ type: 'success', text: `Cash out approved (clipboard blocked — copy manually)` })
        }
      } else {
        const msg = action === 'paid' ? 'Marked as paid' : `Cash out ${action}d`
        setToast({ type: 'success', text: msg })
      }

      fetchAlerts()
      fetchStudents()
    } catch (err) {
      setToast({ type: 'error', text: err.message || `Failed to ${action}` })
    }
  }

  const getStudentTotal = (accounts) => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  }

  const initials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleStudentClick = (id) => {
    navigate(`/student/${id}`)
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()

    if (!addFormData.name.trim() || !addFormData.email.trim()) {
      setToast({ type: 'error', text: 'Please enter both name and email' })
      return
    }

    setAddingStudent(true)
    try {
      const { error } = await supabase.rpc('add_student', {
        p_name: addFormData.name.trim(),
        p_email: addFormData.email.trim()
      })

      if (error) throw error

      setToast({ type: 'success', text: 'Student added successfully' })
      setAddFormData({ name: '', email: '' })
      setShowAddModal(false)

      await fetchStudents()
    } catch (err) {
      console.error('Failed to add student:', err)
      setToast({ type: 'error', text: err.message || 'Failed to add student' })
    } finally {
      setAddingStudent(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setAddFormData({ name: '', email: '' })
  }

  const totalBalance = students.reduce((sum, student) => sum + getStudentTotal(student.accounts), 0)

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <Toast message={toast} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-hand font-bold text-ink dark:text-chalk-white">Students</h1>
            <p className="text-[13px] text-ink-muted dark:text-white/40 mt-1">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} · <span className="font-semibold text-ink dark:text-chalk-white"><AnimNum value={totalBalance} prefix="$" duration={600} /></span> total
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </motion.div>

      {/* Cash Out Requests — Pending (need approve/deny) */}
      {cashout_requests.filter(r => r.status === 'pending').length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-[11px] font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-2">
            Cash Out Requests
          </h3>
          {cashout_requests.filter(r => r.status === 'pending').map(req => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl border border-sage/20 bg-sage/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sage/15 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-sage-dark" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                    {req.profiles?.full_name} wants {formatCurrency(req.amount)}
                  </p>
                  <p className="text-[11px] text-ink-muted dark:text-white/40">
                    {req.note || 'No note'} · {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCashOutAction(req.id, 'deny')}
                  className="w-8 h-8 rounded-lg bg-rose/10 hover:bg-rose/20 flex items-center justify-center transition-colors"
                  title="Deny"
                >
                  <XCircle className="w-4 h-4 text-rose" />
                </button>
                <button
                  onClick={() => handleCashOutAction(req.id, 'approve')}
                  className="w-8 h-8 rounded-lg bg-sage/15 hover:bg-sage/25 flex items-center justify-center transition-colors"
                  title="Approve"
                >
                  <Check className="w-4 h-4 text-sage-dark" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cash Out — Approved, ready to hand cash */}
      {cashout_requests.filter(r => r.status === 'approved').length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-[11px] font-bold text-amber dark:text-amber uppercase tracking-wider mb-2">
            Ready to Pay Out
          </h3>
          {cashout_requests.filter(r => r.status === 'approved').map(req => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl border border-amber/30 bg-amber/[0.06]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber/15 flex items-center justify-center">
                  <HandCoins className="w-4 h-4 text-amber" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                    Hand {req.profiles?.full_name} {formatCurrency(req.amount)}
                  </p>
                  <p className="text-[11px] text-ink-muted dark:text-white/40">
                    Approved · {req.note || 'No note'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCashOutAction(req.id, 'paid')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink dark:bg-chalk-white text-white dark:text-ink text-[11px] font-bold hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors"
              >
                <HandCoins className="w-3.5 h-3.5" />
                Mark Paid
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {(paycheck_count > 0 || purchase_count > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {paycheck_count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-amber-200/60 dark:border-amber/20 bg-amber-bg dark:bg-amber/[0.04]"
            >
              <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-amber dark:text-amber" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink dark:text-chalk-white">{paycheck_count} paychecks to review</p>
                <p className="text-[11px] text-ink-muted dark:text-white/40">Pending approval</p>
              </div>
            </motion.div>
          )}

          {purchase_count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-rose/20 dark:border-rose/10 bg-rose-bg dark:bg-rose/[0.04]"
            >
              <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-rose dark:text-rose" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink dark:text-chalk-white">{purchase_count} purchases to review</p>
                <p className="text-[11px] text-ink-muted dark:text-white/40">Items awaiting approval</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint dark:text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03] text-ink dark:text-chalk-white placeholder-ink-faint dark:placeholder-white/30 text-[13px] focus:outline-none focus:border-ink/20 dark:focus:border-white/20 focus:ring-2 focus:ring-ink/5 dark:focus:ring-white/5 transition-all"
        />
      </div>

      {/* Student List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[72px] bg-surface-2 dark:bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-20 text-center">
          {students.length === 0 ? (
            <>
              <p className="text-[13px] font-medium text-ink-muted dark:text-white/40">No students yet</p>
              <p className="text-[11px] text-ink-faint dark:text-white/25 mt-1">Click "Add Student" to get started</p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium text-ink-muted dark:text-white/40">No results</p>
              <p className="text-[11px] text-ink-faint dark:text-white/25 mt-1">Try a different search term</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredStudents.map((student, index) => {
            const total = getStudentTotal(student.accounts)
            const accountBreakdown = {}
            student.accounts.forEach(a => { accountBreakdown[a.account_type] = a.balance })
            const maxTotal = Math.max(...students.map(s => getStudentTotal(s.accounts)), 1)
            const wealthPct = Math.min((total / maxTotal) * 100, 100)

            return (
              <motion.button
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                onClick={() => handleStudentClick(student.id)}
                className="w-full text-left group"
              >
                <div className="relative flex items-center gap-4 p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.04] hover:border-black/[0.08] dark:hover:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:shadow-sm transition-all overflow-hidden">
                  {/* Subtle wealth bar at bottom */}
                  <div className="absolute bottom-0 left-0 h-[2px] bg-sage/30 dark:bg-sage/20 transition-all duration-700" style={{ width: `${wealthPct}%` }} />

                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sage/10 dark:bg-sage/15 flex items-center justify-center text-sage-dark dark:text-sage-300 font-bold text-xs border border-sage/20 dark:border-sage/15">
                    {initials(student.full_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink dark:text-chalk-white truncate">{student.full_name}</p>
                    <p className="text-[11px] text-ink-faint dark:text-white/30 truncate">{student.email}</p>
                  </div>

                  {/* Mini account breakdown */}
                  <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                    {['checking', 'savings', 'sp500', 'nasdaq'].map(key => {
                      const bal = accountBreakdown[key] || 0
                      if (bal === 0) return null
                      return (
                        <div key={key} className="text-right">
                          <p className="text-[10px] text-ink-faint dark:text-white/25 uppercase tracking-wider">{ACCOUNT_META[key]?.label}</p>
                          <p className="text-[11px] font-semibold tabular-nums text-ink-muted dark:text-white/50">{formatCurrency(bal)}</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex-shrink-0 text-right ml-2">
                    <p className="text-lg font-black tabular-nums text-ink dark:text-chalk-white">
                      <AnimNum value={total} prefix="$" duration={600} />
                    </p>
                  </div>

                  <svg className="w-4 h-4 text-ink-faint dark:text-white/20 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1e2a1e] rounded-2xl shadow-2xl z-50 w-full max-w-sm mx-4 p-6 border border-black/[0.08] dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-hand font-bold text-ink dark:text-chalk-white">Add Student</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-ink-faint dark:text-white/30 hover:text-ink-muted dark:hover:text-white/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <Field label="Student Name">
                  <Input
                    type="text"
                    placeholder="e.g., Sarah Johnson"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    disabled={addingStudent}
                  />
                </Field>

                <Field label="Email Address">
                  <Input
                    type="email"
                    placeholder="e.g., sarah@example.com"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    disabled={addingStudent}
                  />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={addingStudent}
                    className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-[13px] font-bold text-ink-muted dark:text-white/50 hover:bg-surface-2 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingStudent}
                    className="flex-1 py-2.5 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors disabled:opacity-50"
                  >
                    {addingStudent ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
