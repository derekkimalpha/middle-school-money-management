import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertCircle, Plus, X } from 'lucide-react'
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
      const [paychecks, purchases] = await Promise.all([
        supabase
          .from('weekly_paychecks')
          .select('id')
          .eq('status', 'submitted'),
        supabase
          .from('purchase_requests')
          .select('id')
          .eq('status', 'pending')
      ])

      setPaycheckCount(paychecks.data?.length || 0)
      setPurchaseCount(purchases.data?.length || 0)
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
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

      // Refresh the student list
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

  const alertVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 }
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.3
      }
    })
  }

  const totalBalance = students.reduce((sum, student) => sum + getStudentTotal(student.accounts), 0)

  return (
    <div className="space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-ink dark:text-chalk-white font-hand">Students</h1>
          <p className="text-lg text-ink-muted dark:text-white/50">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} •{' '}
            <span className="font-bold text-pencil-dark dark:text-pencil">
              <AnimNum value={totalBalance} prefix="$" duration={600} />
            </span>
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 mt-1"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paycheck_count > 0 && (
          <motion.div
            variants={alertVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
            className="bg-pencil/20 dark:bg-pencil/10 border-l-4 border-pencil p-4 rounded-sm flex items-start gap-3 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]"
          >
            <AlertCircle className="w-5 h-5 text-pencil-dark dark:text-pencil mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold font-hand text-pencil-dark dark:text-pencil">{paycheck_count} Paychecks to Review</p>
              <p className="text-sm text-pencil-dark/80 dark:text-pencil/80">Student submissions pending review</p>
            </div>
          </motion.div>
        )}

        {purchase_count > 0 && (
          <motion.div
            variants={alertVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15 }}
            className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-300 p-4 rounded-sm flex items-start gap-3 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]"
          >
            <AlertCircle className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold font-hand text-red-800">{purchase_count} Purchases to Review</p>
              <p className="text-sm text-red-700">Items awaiting approval</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted dark:text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-3 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-chalk-white text-ink placeholder-ink-muted dark:placeholder-white/50 focus:outline-none focus:border-pencil focus:ring-2 focus:ring-pencil/20 dark:focus:border-pencil dark:focus:ring-pencil/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-16 text-center">
          {students.length === 0 ? (
            <>
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm font-semibold text-ink-muted dark:text-white/40">No students yet</p>
              <p className="text-xs text-ink-faint dark:text-white/25 mt-1">Click '+ Add Student' to get started</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-semibold text-ink-muted dark:text-white/40">No results</p>
              <p className="text-xs text-ink-faint dark:text-white/25 mt-1">Try a different search term</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2 overflow-hidden">
          {filteredStudents.map((student, index) => {
            const total = getStudentTotal(student.accounts)
            return (
              <motion.button
                key={student.id}
                custom={index}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                onClick={() => handleStudentClick(student.id)}
                className="w-full text-left"
              >
                <motion.div
                  className="flex items-center gap-4 p-4 rounded-sm border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:border-black/[0.12] dark:hover:border-white/[0.10] hover:shadow-sm transition-all group shadow-[2px_2px_0px_rgba(0,0,0,0.06)]"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ink dark:bg-chalk-white flex items-center justify-center text-white dark:text-ink font-bold text-sm shadow-md shadow-black/10">
                    {initials(student.full_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink dark:text-chalk-white truncate font-hand">{student.full_name}</p>
                    <p className="text-sm text-ink-muted dark:text-white/40 truncate">{student.email}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="font-extrabold text-lg text-ink dark:text-chalk-white tabular-nums">
                      <AnimNum value={total} prefix="$" duration={600} />
                    </p>
                    <p className="text-xs text-ink-faint dark:text-white/30 font-medium">Total balance</p>
                  </div>

                  <div className="flex-shrink-0 text-ink-muted dark:text-white/50 group-hover:translate-x-1 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
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
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-white/[0.04] rounded-2xl shadow-2xl shadow-black/5 z-50 w-full max-w-sm mx-4 p-6 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-hand">Add Student</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                >
                  <X className="w-6 h-6" />
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleCloseModal}
                    disabled={addingStudent}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={addingStudent}
                    className="flex-1"
                  >
                    {addingStudent ? 'Adding...' : 'Add Student'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
