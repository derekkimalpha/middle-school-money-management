import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { AnimNum, Button, Tag, Toast, Field } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency, ACCOUNT_META } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

export const GuideStudentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [paychecks, setPaychecks] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifyingPaycheck, setVerifyingPaycheck] = useState(null)
  const [verifiedAmounts, setVerifiedAmounts] = useState({})
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusDescription, setBonusDescription] = useState('')
  const [addingBonus, setAddingBonus] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchStudent()
  }, [id])

  const fetchStudent = async () => {
    try {
      setLoading(true)
      const { data: studentData, error: studentError } = await supabase
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
        .eq('id', id)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      const [paychecksData, transactionsData] = await Promise.all([
        supabase
          .from('weekly_paychecks')
          .select('*')
          .eq('student_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('*')
          .eq('student_id', id)
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      setPaychecks(paychecksData.data || [])
      setTransactions(transactionsData.data || [])
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to load student details' })
    } finally {
      setLoading(false)
    }
  }

  const verifyPaycheck = async (paycheckId, amount) => {
    if (!amount || amount <= 0) {
      setToast({ type: 'error', text: 'Enter a valid amount' })
      return
    }

    if (!user?.id) {
      setToast({ type: 'error', text: 'User not authenticated' })
      return
    }

    try {
      setVerifyingPaycheck(paycheckId)
      const { error } = await supabase
        .from('weekly_paychecks')
        .update({
          status: 'verified',
          verified_amount: amount,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', paycheckId)

      if (error) throw error

      setToast({ type: 'success', text: 'Paycheck verified' })
      setVerifiedAmounts(prev => ({ ...prev, [paycheckId]: '' }))
      await fetchStudent()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to verify paycheck' })
    } finally {
      setVerifyingPaycheck(null)
    }
  }

  const addManualBonus = async () => {
    if (!bonusAmount || bonusAmount <= 0) {
      setToast({ type: 'error', text: 'Enter a valid bonus amount' })
      return
    }

    try {
      setAddingBonus(true)
      const amount = parseFloat(bonusAmount)

      const { data: bonusAccount, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('student_id', id)
        .eq('account_type', 'bonus')
        .single()

      if (accountError) throw accountError

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: bonusAccount.balance + amount })
        .eq('id', bonusAccount.id)

      if (updateError) throw updateError

      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          student_id: id,
          account_id: bonusAccount.id,
          account_type: 'bonus',
          type: 'bonus',
          amount: amount,
          description: bonusDescription || 'Manual bonus added by guide',
          created_at: new Date().toISOString()
        })

      if (transError) throw transError

      setToast({ type: 'success', text: 'Bonus added successfully' })
      setBonusAmount('')
      setBonusDescription('')
      await fetchStudent()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to add bonus' })
    } finally {
      setAddingBonus(false)
    }
  }

  const getStudentTotal = () => {
    if (!student) return 0
    return student.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  }

  const initials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-amber-100 text-amber-800',
      verified: 'bg-green-100 text-green-800',
      allocated: 'bg-sage-bg text-sage'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Student not found</p>
      </div>
    )
  }

  const total = getStudentTotal()

  return (
    <div className="space-y-6">
      <Toast message={toast} />

      <motion.button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sage hover:text-sage-dark transition-colors"
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Back to Students</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-sage-50 to-slate-50 p-6 rounded-lg border border-sage border-opacity-20"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-sage to-teal flex items-center justify-center text-white font-bold text-2xl">
            {initials(student.full_name)}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{student.full_name}</h1>
            <p className="text-slate-600">{student.email}</p>
            <p className="text-2xl font-bold text-sage mt-2">
              <AnimNum value={total} prefix="$" duration={600} />
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-900">Account Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(ACCOUNT_META).map(([key, meta]) => {
            const account = student.accounts.find(a => a.account_type === key)
            const balance = account?.balance || 0
            return (
              <motion.div
                key={key}
                className={`p-4 rounded-lg border-2 ${meta.borderColor} ${meta.bgColor}`}
                whileHover={{ y: -2 }}
              >
                <p className="text-xs font-semibold text-slate-600 uppercase">{meta.label}</p>
                <p className="text-lg font-bold mt-2">
                  <AnimNum value={balance} prefix="$" duration={600} />
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-900">Paycheck History</h2>
        <div className="space-y-3">
          {paychecks.length === 0 ? (
            <p className="text-slate-600">No paychecks yet</p>
          ) : (
            paychecks.map(paycheck => (
              <motion.div
                key={paycheck.id}
                className="p-4 rounded-lg border border-slate-200 space-y-3"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      Week of {new Date(paycheck.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      {paycheck.base_pay > 0 && <p>Base: ${paycheck.base_pay}</p>}
                      {paycheck.epic_week_bonus > 0 && <p>Epic: ${paycheck.epic_week_bonus}</p>}
                      {paycheck.bonus_xp > 0 && <p>Bonus XP: ${paycheck.bonus_xp}</p>}
                      {paycheck.mastery_pay > 0 && <p>Mastery: ${paycheck.mastery_pay}</p>}
                      {paycheck.job_earnings > 0 && <p>Job: ${paycheck.job_earnings}</p>}
                      {paycheck.smart_spending_bonus > 0 && <p>Smart Spending: ${paycheck.smart_spending_bonus}</p>}
                      {paycheck.other_earnings > 0 && <p>Other: ${paycheck.other_earnings}</p>}
                    </div>
                  </div>

                  <Tag color={getStatusColor(paycheck.status)}>
                    {paycheck.status}
                  </Tag>
                </div>

                {paycheck.status === 'submitted' && (
                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <Field label="Verified Amount ($)">
                      <input
                        type="number"
                        value={verifiedAmounts[paycheck.id] || ''}
                        onChange={(e) => setVerifiedAmounts(prev => ({
                          ...prev,
                          [paycheck.id]: e.target.value
                        }))}
                        placeholder="Enter verified amount"
                        className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                      />
                    </Field>
                    <Button
                      onClick={() => verifyPaycheck(paycheck.id, parseFloat(verifiedAmounts[paycheck.id]))}
                      disabled={verifyingPaycheck === paycheck.id}
                      size="sm"
                    >
                      Verify ✓
                    </Button>
                  </div>
                )}

                {(paycheck.status === 'verified' || paycheck.status === 'allocated') && paycheck.verified_amount && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                    <Check className="w-4 h-4" />
                    Verified: ${paycheck.verified_amount}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 p-4 rounded-lg bg-rose-50 border border-rose-200"
      >
        <h2 className="text-lg font-bold text-slate-900">Add Manual Bonus</h2>
        <div className="space-y-3">
          <Field label="Bonus Amount ($)">
            <input
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
            />
          </Field>
          <Field label="Description (optional)">
            <input
              type="text"
              value={bonusDescription}
              onChange={(e) => setBonusDescription(e.target.value)}
              placeholder="e.g., Extra credit bonus"
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
            />
          </Field>
          <Button
            onClick={addManualBonus}
            disabled={addingBonus || !bonusAmount}
            full
          >
            Add Bonus
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-900">Transaction History</h2>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-slate-600">No transactions yet</p>
          ) : (
            transactions.map(trans => (
              <motion.div
                key={trans.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                whileHover={{ x: 2 }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 capitalize">{trans.type}</p>
                  <p className="text-sm text-slate-600">{trans.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(trans.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold ${trans.amount >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                    {trans.amount >= 0 ? '+' : ''}{formatCurrency(trans.amount)}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{trans.account_type}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
