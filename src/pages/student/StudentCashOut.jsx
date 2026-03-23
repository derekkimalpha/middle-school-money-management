import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Field, Input, Toast, FinTip } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/constants'
import { DollarSign, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const StudentCashOut = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts, loading: accountsLoading, refreshAccounts } = useAccounts(profile?.id)
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    fetchRequests()
  }, [profile?.id])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('cash_out_requests')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setRequests(data)
  }

  const checkingBalance = accounts?.checking || 0

  const handleCashOut = async () => {
    if (amount <= 0) {
      setToast({ type: 'error', text: 'Enter an amount' })
      return
    }
    if (amount > checkingBalance) {
      setToast({ type: 'error', text: `You only have ${formatCurrency(checkingBalance)} in checking` })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('request_cash_out', {
        p_student_id: profile.id,
        p_amount: amount,
        p_note: note || null,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setSubmitted(true)
      setToast({ type: 'success', text: 'Cash out request submitted!' })
      setAmount(0)
      setNote('')
      refreshAccounts()
      fetchRequests()
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  if (accountsLoading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-400" />
      </div>
    )
  }

  const statusIcon = { pending: Clock, approved: CheckCircle, denied: XCircle, paid: DollarSign }
  const statusColor = { pending: 'text-amber', approved: 'text-sage', denied: 'text-rose', paid: 'text-teal' }
  const statusBg = { pending: 'bg-amber/10', approved: 'bg-sage/10', denied: 'bg-rose/10', paid: 'bg-teal/10' }
  const statusLabel = { pending: 'pending', approved: 'approved', denied: 'denied', paid: 'paid out' }

  return (
    <div className="space-y-6 p-8 pb-24">
      <Toast message={toast} />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-ink-muted dark:text-white/40 hover:text-ink dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-4xl font-extrabold text-ink dark:text-chalk-white tracking-[-0.02em] mb-2">
          Cash Out
        </h1>
        <p className="text-[13px] text-ink-muted dark:text-white/50">
          Request to withdraw money from your checking account
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        <FinTip icon="" title="How Cash Out Works" color="from-stone-50 to-stone-100">
          Request a cash out and your guide will hand you the money. The amount is deducted from your checking immediately. If your guide denies the request, the money goes back into your checking.
        </FinTip>

        {/* Request Form */}
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-white/[0.04] rounded-xl border border-black/[0.08] dark:border-white/[0.06] shadow-sm p-6 space-y-5"
          >
            {/* Balance Display */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-sage/[0.06] border border-sage/10">
              <span className="text-sm text-ink-muted dark:text-white/50">Available in Checking</span>
              <span className="text-xl font-black text-ink dark:text-chalk-white">{formatCurrency(checkingBalance)}</span>
            </div>

            {/* Quick Amount Buttons */}
            {checkingBalance > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-2">Quick select</p>
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 20, 50].filter(v => v <= checkingBalance).map(v => (
                    <button
                      key={v}
                      onClick={() => setAmount(v)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                        amount === v
                          ? 'bg-ink text-white dark:bg-chalk-white dark:text-ink border-ink dark:border-chalk-white'
                          : 'bg-white dark:bg-white/[0.04] text-ink dark:text-chalk-white border-black/[0.08] dark:border-white/[0.08] hover:border-ink/30'
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(checkingBalance)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                      amount === checkingBalance
                        ? 'bg-ink text-white dark:bg-chalk-white dark:text-ink border-ink dark:border-chalk-white'
                        : 'bg-white dark:bg-white/[0.04] text-ink dark:text-chalk-white border-black/[0.08] dark:border-white/[0.08] hover:border-ink/30'
                    }`}
                  >
                    All ({formatCurrency(checkingBalance)})
                  </button>
                </div>
              </div>
            )}

            {/* Custom Amount */}
            <Field label="Amount to cash out">
              <Input
                type="number"
                min="0"
                max={checkingBalance}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                prefix="$"
                big
              />
            </Field>

            {/* Optional Note */}
            <Field label="Note for your guide (optional)">
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Need cash for lunch"
              />
            </Field>

            {amount > checkingBalance && (
              <div className="p-3 rounded-lg bg-rose/10 border border-rose/20 text-sm text-rose font-medium">
                Not enough in checking. You have {formatCurrency(checkingBalance)}.
              </div>
            )}

            <Button
              full
              size="lg"
              disabled={amount <= 0 || amount > checkingBalance || loading}
              onClick={handleCashOut}
            >
              {loading ? 'Submitting...' : `Request ${amount > 0 ? formatCurrency(amount) : ''} Cash Out`}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-white/[0.04] rounded-xl border border-sage/20 p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-sage" />
            </div>
            <h2 className="text-xl font-bold text-ink dark:text-chalk-white">Request Submitted!</h2>
            <p className="text-sm text-ink-muted dark:text-white/50">
              Your guide will review this and hand you the cash. Check back here for the status.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm font-semibold text-sage hover:underline"
            >
              Submit another request
            </button>
          </motion.div>
        )}

        {/* Past Requests */}
        {requests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-white/[0.04] rounded-xl border border-black/[0.08] dark:border-white/[0.06] shadow-sm p-5"
          >
            <h3 className="text-[11px] font-semibold text-ink-muted dark:text-white/40 uppercase tracking-wider mb-3">
              Your Requests
            </h3>
            <div className="space-y-2">
              {requests.map(req => {
                const StatusIcon = statusIcon[req.status]
                return (
                  <div key={req.id} className={`flex items-center justify-between p-3 rounded-lg ${statusBg[req.status]}`}>
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`w-4 h-4 ${statusColor[req.status]}`} />
                      <div>
                        <p className="text-sm font-bold text-ink dark:text-chalk-white">{formatCurrency(req.amount)}</p>
                        <p className="text-[10px] text-ink-muted dark:text-white/40">
                          {new Date(req.created_at).toLocaleDateString()}
                          {req.note && ` — ${req.note}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${statusColor[req.status]}`}>
                      {statusLabel[req.status] || req.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
