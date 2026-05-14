import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button, Field, Input, Toast } from '../../components/shared'
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
      <div className="flex items-center justify-center h-screen bg-ds-canvas">
        <motion.div
          className="w-9 h-9 border-[2.5px] border-ds-hairline border-t-ds-accent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  const statusIcon = { pending: Clock, approved: CheckCircle, denied: XCircle, paid: DollarSign }
  const statusLabel = { pending: 'Pending', approved: 'Approved', denied: 'Denied', paid: 'Paid out' }

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
      <Toast message={toast} />

      <div className="max-w-2xl mx-auto px-6 md:px-10 pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[13px] text-ds-tertiary hover:text-ds-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back
          </button>
          <p className="text-[11px] font-semibold text-ds-tertiary tracking-[0.06em] uppercase mb-2">
            Withdraw money
          </p>
          <h1 className="text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">
            Cash out
          </h1>
          <p className="text-[13px] text-ds-secondary mt-1.5">
            Request to withdraw money from your checking account.
          </p>
        </motion.div>

        <div className="space-y-5">
          {/* How it works */}
          <div className="rounded-ds-xl p-5 bg-ds-inset border border-ds-hairline">
            <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.06em] mb-1.5">How cash out works</p>
            <p className="text-[13px] text-ds-secondary leading-relaxed">
              Request a cash out and your guide will hand you the money. The amount is deducted from your checking immediately. If your guide denies the request, the money goes back into your checking.
            </p>
          </div>

          {/* Form or submitted state */}
          {!submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7 space-y-5"
            >
              {/* Balance display */}
              <div className="flex items-center justify-between p-4 rounded-ds-md bg-ds-inset">
                <span className="text-[12px] font-semibold text-ds-tertiary uppercase tracking-[0.05em]">Available in checking</span>
                <span className="text-[20px] font-semibold tabular-nums text-ds-primary">{formatCurrency(checkingBalance)}</span>
              </div>

              {/* Quick amounts */}
              {checkingBalance > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-2">Quick select</p>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 10, 20, 50].filter(v => v <= checkingBalance).map(v => (
                      <button
                        key={v}
                        onClick={() => setAmount(v)}
                        className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                          amount === v
                            ? 'bg-ds-accent text-ds-on-accent border-ds-accent'
                            : 'bg-ds-surface text-ds-secondary border-ds-hairline hover:border-ds-border'
                        }`}
                      >
                        ${v}
                      </button>
                    ))}
                    <button
                      onClick={() => setAmount(checkingBalance)}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                        amount === checkingBalance
                          ? 'bg-ds-accent text-ds-on-accent border-ds-accent'
                          : 'bg-ds-surface text-ds-secondary border-ds-hairline hover:border-ds-border'
                      }`}
                    >
                      All ({formatCurrency(checkingBalance)})
                    </button>
                  </div>
                </div>
              )}

              {/* Custom amount */}
              <Field label="Amount to cash out">
                <Input
                  type="number"
                  min="0"
                  max={checkingBalance}
                  step="0.01"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  prefix="$"
                  big
                />
              </Field>

              {/* Note */}
              <Field label="Note for your guide (optional)">
                <Input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., need cash for lunch"
                />
              </Field>

              {amount > checkingBalance && (
                <div className="p-3 rounded-ds-md bg-ds-negative-soft border border-ds-negative/30 text-[13px] text-ds-negative font-medium">
                  Not enough in checking. You have {formatCurrency(checkingBalance)}.
                </div>
              )}

              <Button
                full
                size="lg"
                disabled={amount <= 0 || amount > checkingBalance || loading}
                onClick={handleCashOut}
              >
                {loading ? 'Submitting…' : `Request ${amount > 0 ? formatCurrency(amount) : ''} cash out`}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-8 text-center space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-ds-accent-soft text-ds-accent flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" strokeWidth={2} />
              </div>
              <h2 className="text-[18px] font-semibold text-ds-primary">Request submitted</h2>
              <p className="text-[13px] text-ds-secondary">
                Your guide will review this and hand you the cash. Check back here for the status.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-[12px] font-semibold text-ds-accent hover:underline mt-2"
              >
                Submit another request
              </button>
            </motion.div>
          )}

          {/* Past requests */}
          {requests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7"
            >
              <h3 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-4">
                Your requests
              </h3>
              <div>
                {requests.map((req, idx) => {
                  const StatusIcon = statusIcon[req.status] || Clock
                  const isLast = idx === requests.length - 1
                  return (
                    <div key={req.id} className={`flex items-center justify-between py-3 ${!isLast ? 'border-b border-ds-hairline' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-ds-md bg-ds-inset text-ds-secondary flex items-center justify-center flex-shrink-0">
                          <StatusIcon className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold tabular-nums text-ds-primary">{formatCurrency(req.amount)}</p>
                          <p className="text-[11px] text-ds-tertiary truncate">
                            {new Date(req.created_at).toLocaleDateString()}
                            {req.note && ` — ${req.note}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ds-secondary flex-shrink-0 ml-3">
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
    </div>
  )
}
