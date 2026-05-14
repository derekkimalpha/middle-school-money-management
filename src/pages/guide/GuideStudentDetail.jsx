import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Wallet, PiggyBank, TrendingUp, BarChart3, Gift, Lock } from 'lucide-react'
import { AnimNum, Button, Tag, Toast, Field, ConfirmDialog } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency, ACCOUNT_META } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

const ACCOUNT_ICONS = {
  checking: Wallet,
  savings: PiggyBank,
  sp500: TrendingUp,
  nasdaq: BarChart3,
  bonus: Gift,
  roth: Lock,
}

const ACCOUNT_HEX = {
  checking: '#7c8c78',
  savings: '#6b8a87',
  sp500: '#a68b5b',
  nasdaq: '#78716c',
  bonus: '#a67272',
  roth: '#8b5cf6',
}

const ACCOUNT_BG = {
  checking: 'rgba(124,140,120,0.06)',
  savings: 'rgba(107,138,135,0.06)',
  sp500: 'rgba(166,139,91,0.06)',
  nasdaq: 'rgba(120,113,108,0.06)',
  bonus: 'rgba(166,114,114,0.06)',
  roth: 'rgba(139,92,246,0.06)',
}

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
  const [confirmPaycheck, setConfirmPaycheck] = useState(null)

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
      draft: 'bg-ds-inset text-ds-secondary',
      submitted: 'bg-ds-inset text-ds-tertiary',
      verified: 'bg-ds-accent-soft text-ds-positive',
      allocated: 'bg-ds-inset text-ds-tertiary',
    }
    return colors[status] || 'bg-ds-inset text-ds-tertiary'
  }

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'In Progress',
      submitted: 'Pending',
      verified: 'Approved',
      allocated: 'Allocated',
    }
    return labels[status] || status
  }

  const returnPaycheck = async (paycheckId) => {
    try {
      const { error } = await supabase
        .from('weekly_paychecks')
        .update({ status: 'draft' })
        .eq('id', paycheckId)
      if (error) throw error
      setToast({ type: 'success', text: 'Sent back for corrections' })
      await fetchStudent()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to return paycheck' })
    }
  }

  const [editingPaycheck, setEditingPaycheck] = useState(null)
  const [editFields, setEditFields] = useState({})

  const startEditPaycheck = (paycheck) => {
    setEditingPaycheck(paycheck.id)
    setEditFields({
      total_earnings: paycheck.total_earnings || 0,
      base_pay: paycheck.base_pay || 0,
      epic_bonus: paycheck.epic_bonus || 0,
      xp_bonus: paycheck.xp_bonus || 0,
      mastery_pay: paycheck.mastery_pay || 0,
      job_pay: paycheck.job_pay || 0,
      other_pay: paycheck.other_pay || 0,
    })
  }

  const saveEditPaycheck = async (paycheckId) => {
    try {
      const total = editFields.base_pay + editFields.epic_bonus + editFields.xp_bonus +
        editFields.mastery_pay + editFields.job_pay + editFields.other_pay
      const { error } = await supabase
        .from('weekly_paychecks')
        .update({
          ...editFields,
          total_earnings: Math.round(total * 100) / 100,
        })
        .eq('id', paycheckId)
      if (error) throw error
      setToast({ type: 'success', text: 'Paycheck updated' })
      setEditingPaycheck(null)
      await fetchStudent()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to update paycheck' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
        <div className="max-w-3xl mx-auto px-8 py-10 space-y-4">
          <div className="h-20 bg-ds-inset rounded-ds-lg animate-pulse" />
          <div className="h-48 bg-ds-inset rounded-ds-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
        <div className="text-center py-12">
          <p className="text-ds-tertiary">Student not found</p>
        </div>
      </div>
    )
  }

  const total = getStudentTotal()

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <Toast message={toast} />

        {/* Back */}
        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[13px] font-semibold text-ds-tertiary hover:text-ds-primary transition-colors"
          whileHover={{ x: -3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Students
        </motion.button>

        {/* Student Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ds-inset flex items-center justify-center text-ds-secondary font-semibold text-sm">
              {initials(student.full_name)}
            </div>
            <div>
              <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">{student.full_name}</h1>
              <p className="text-[13px] text-ds-tertiary">{student.email}</p>
            </div>
          </div>
          <p className="text-4xl font-bold tabular-nums text-ds-primary mt-4">
            <AnimNum value={total} prefix="$" duration={600} />
          </p>
          <p className="text-[11px] text-ds-tertiary mt-1">Total across all accounts</p>
        </motion.div>

        {/* Account Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-3">Accounts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {Object.entries(ACCOUNT_META).map(([key, meta]) => {
              const account = student.accounts.find(a => a.account_type === key)
              const balance = account?.balance || 0
              const Icon = ACCOUNT_ICONS[key]
              const hex = ACCOUNT_HEX[key]
              const bg = ACCOUNT_BG[key]
              return (
                <div
                  key={key}
                  className="relative p-4 rounded-ds-lg border border-ds-hairline bg-ds-surface overflow-hidden transition-all hover:bg-ds-overlay"
                >
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ backgroundColor: hex }} />
                  <div className="flex items-center gap-1.5 mb-2 pl-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: hex }} />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.05em]" style={{ color: hex }}>{meta.label}</p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-ds-primary pl-2">
                    <AnimNum value={balance} prefix="$" duration={600} />
                  </p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-ds-hairline" />

        {/* Paycheck History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-3">Paychecks</h2>
          <div className="space-y-2">
            {paychecks.length === 0 ? (
              <p className="text-[13px] text-ds-tertiary py-4">No paychecks yet</p>
            ) : (
              paychecks.map(paycheck => {
                const totalXp = (paycheck.xp_mon || 0) + (paycheck.xp_tue || 0) + (paycheck.xp_wed || 0) + (paycheck.xp_thu || 0) + (paycheck.xp_fri || 0)
                const epicCount = [paycheck.epic_mon, paycheck.epic_tue, paycheck.epic_wed, paycheck.epic_thu, paycheck.epic_fri].filter(Boolean).length

                return (
                  <div
                    key={paycheck.id}
                    className="p-4 rounded-ds-lg border border-ds-hairline bg-ds-surface space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[13px] font-semibold text-ds-primary">
                            {paycheck.week_label || new Date(paycheck.created_at).toLocaleDateString()}
                          </p>
                          <Tag color={getStatusColor(paycheck.status)}>
                            {getStatusLabel(paycheck.status)}
                          </Tag>
                        </div>
                        <p className="text-xl font-bold tabular-nums text-ds-primary">{formatCurrency(paycheck.total_earnings || 0)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                          {totalXp > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary">XP: {totalXp}</span>}
                          {epicCount > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary">{epicCount} epic</span>}
                          {paycheck.base_pay > 0 && <span className="px-2 py-0.5 bg-ds-accent-soft rounded-ds-md text-ds-positive tabular-nums">Base ${paycheck.base_pay}</span>}
                          {paycheck.epic_bonus > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary tabular-nums">Epic ${paycheck.epic_bonus}</span>}
                          {paycheck.xp_bonus > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary tabular-nums">XP Bonus ${paycheck.xp_bonus}</span>}
                          {paycheck.mastery_pay > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary tabular-nums">Mastery ${paycheck.mastery_pay}</span>}
                          {paycheck.job_pay > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary tabular-nums">Job ${paycheck.job_pay}</span>}
                          {paycheck.smart_goal > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary tabular-nums">SMART ${paycheck.smart_goal}</span>}
                          {paycheck.other_pay > 0 && <span className="px-2 py-0.5 bg-ds-inset rounded-ds-md text-ds-secondary tabular-nums">Other ${paycheck.other_pay}</span>}
                        </div>
                      </div>
                    </div>

                    {paycheck.status === 'submitted' && (
                      <div className="border-t border-ds-hairline pt-3 space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmPaycheck({ id: paycheck.id, amount: paycheck.total_earnings })}
                            disabled={verifyingPaycheck === paycheck.id}
                            className="flex items-center gap-1 px-3 py-2 rounded-ds-md bg-ds-accent text-ds-on-accent text-[12px] font-semibold hover:bg-ds-accent-hover transition-colors disabled:opacity-50 tabular-nums"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve {formatCurrency(paycheck.total_earnings || 0)}
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="number"
                              value={verifiedAmounts[paycheck.id] || ''}
                              onChange={(e) => setVerifiedAmounts(prev => ({
                                ...prev,
                                [paycheck.id]: e.target.value
                              }))}
                              placeholder="Adjust..."
                              className="flex-1 px-3 py-2 text-[12px] rounded-ds-md border border-ds-hairline bg-ds-inset text-ds-primary focus:outline-none focus:border-ds-border tabular-nums"
                            />
                            {verifiedAmounts[paycheck.id] && (
                              <button
                                onClick={() => setConfirmPaycheck({ id: paycheck.id, amount: parseFloat(verifiedAmounts[paycheck.id]) })}
                                disabled={verifyingPaycheck === paycheck.id}
                                className="px-3 py-2 rounded-ds-md border border-ds-hairline text-[12px] font-semibold text-ds-secondary hover:bg-ds-overlay transition-colors"
                              >
                                Approve Adjusted
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => returnPaycheck(paycheck.id)}
                            className="text-[11px] font-semibold text-ds-negative hover:underline"
                          >
                            Send Back
                          </button>
                          <button
                            onClick={() => startEditPaycheck(paycheck)}
                            className="text-[11px] font-semibold text-ds-tertiary hover:underline"
                          >
                            Edit Amounts
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit mode */}
                    {editingPaycheck === paycheck.id && (
                      <div className="border-t border-ds-hairline pt-3 space-y-2">
                        <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em]">Edit Earnings</p>
                        <div className="grid grid-cols-3 gap-2">
                          {['base_pay', 'epic_bonus', 'xp_bonus', 'mastery_pay', 'job_pay', 'other_pay'].map(field => (
                            <div key={field}>
                              <label className="text-[10px] text-ds-tertiary capitalize">{field.replace('_', ' ')}</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editFields[field] || ''}
                                onChange={(e) => setEditFields(prev => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-2 py-1.5 text-[12px] rounded-ds-md border border-ds-hairline bg-ds-inset text-ds-primary focus:outline-none focus:border-ds-border tabular-nums"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEditPaycheck(paycheck.id)}
                            className="px-3 py-2 rounded-ds-md bg-ds-accent text-ds-on-accent text-[12px] font-semibold hover:bg-ds-accent-hover transition-colors"
                          >
                            Save Changes
                          </button>
                          <button onClick={() => setEditingPaycheck(null)} className="text-[11px] text-ds-tertiary hover:underline">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Verified/Allocated footer */}
                    {(paycheck.status === 'verified' || paycheck.status === 'allocated') && editingPaycheck !== paycheck.id && (
                      <div className="border-t border-ds-hairline pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-ds-positive text-[12px] font-semibold tabular-nums">
                          <Check className="w-3.5 h-3.5" />
                          Approved: {formatCurrency(paycheck.verified_amount || paycheck.total_earnings)}
                        </div>
                        <button
                          onClick={() => startEditPaycheck(paycheck)}
                          className="text-[11px] font-semibold text-ds-tertiary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )
              }))
            }
          </div>
        </motion.div>

        {/* Add Bonus */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7"
        >
          <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-4">Add Manual Bonus</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] block mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 text-[13px] rounded-ds-md border border-ds-hairline bg-ds-inset text-ds-primary focus:outline-none focus:border-ds-border tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] block mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={bonusDescription}
                  onChange={(e) => setBonusDescription(e.target.value)}
                  placeholder="e.g., Extra credit"
                  className="w-full px-3 py-2.5 text-[13px] rounded-ds-md border border-ds-hairline bg-ds-inset text-ds-primary focus:outline-none focus:border-ds-border"
                />
              </div>
            </div>
            <button
              onClick={addManualBonus}
              disabled={addingBonus || !bonusAmount}
              className="w-full py-2.5 rounded-ds-md bg-ds-accent text-ds-on-accent text-[13px] font-semibold hover:bg-ds-accent-hover transition-colors disabled:opacity-50"
            >
              Add Bonus
            </button>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-3">Transactions</h2>
          <div className="space-y-1">
            {transactions.length === 0 ? (
              <p className="text-[13px] text-ds-tertiary py-4">No transactions yet</p>
            ) : (
              transactions.map(trans => (
                <div
                  key={trans.id}
                  className="flex items-center justify-between p-3 rounded-ds-lg hover:bg-ds-overlay transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-ds-primary">{trans.description}</p>
                    <p className="text-[10px] text-ds-tertiary mt-0.5">
                      {new Date(trans.created_at).toLocaleDateString()}
                      {trans.category && <span className="ml-2 capitalize">{trans.category}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[13px] font-semibold tabular-nums ${trans.amount >= 0 ? 'text-ds-positive' : 'text-ds-negative'}`}>
                      {trans.amount >= 0 ? '+' : ''}{formatCurrency(trans.amount)}
                    </p>
                    {trans.balance_after != null && (
                      <p className="text-[10px] text-ds-tertiary tabular-nums">Bal: {formatCurrency(trans.balance_after)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <ConfirmDialog
          open={confirmPaycheck !== null}
          title="Verify paycheck?"
          message={confirmPaycheck ? `Amount: ${formatCurrency(confirmPaycheck.amount)}` : ''}
          confirmLabel="Verify"
          loading={verifyingPaycheck === confirmPaycheck?.id}
          onConfirm={async () => {
            if (confirmPaycheck) {
              await verifyPaycheck(confirmPaycheck.id, confirmPaycheck.amount)
            }
            setConfirmPaycheck(null)
          }}
          onCancel={() => setConfirmPaycheck(null)}
        />
      </div>
    </div>
  )
}
