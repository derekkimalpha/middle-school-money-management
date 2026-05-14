import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, FileCheck } from 'lucide-react'
import { Button, Tag, Toast, ConfirmDialog } from '../../components/shared'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

export const GuidePaychecks = () => {
  const [paychecks, setPaychecks] = useState([])
  const [pendingPaychecks, setPendingPaychecks] = useState([])
  const [recentPaychecks, setRecentPaychecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    fetchPaychecks()
  }, [])

  useEffect(() => {
    sortPaychecks()
  }, [paychecks])

  const fetchPaychecks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('weekly_paychecks')
        .select(`
          id,
          student_id,
          week_label,
          total_earnings,
          status,
          created_at,
          profiles!student_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPaychecks(data || [])
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to load paychecks' })
    } finally {
      setLoading(false)
    }
  }

  const sortPaychecks = () => {
    const pending = paychecks.filter(p => p.status === 'submitted')
    const recent = paychecks
      .filter(p => p.status === 'verified' || p.status === 'allocated')
      .slice(0, 10)

    setPendingPaychecks(pending)
    setRecentPaychecks(recent)
  }

  const approvePaycheck = async (paycheck) => {
    try {
      setProcessingId(paycheck.id)

      const { error } = await supabase
        .from('weekly_paychecks')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', paycheck.id)

      if (error) throw error

      setToast({ type: 'success', text: 'Paycheck approved' })
      await fetchPaychecks()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to approve paycheck' })
    } finally {
      setProcessingId(null)
    }
  }

  const returnPaycheck = async (paycheckId) => {
    try {
      setProcessingId(paycheckId)
      const { error } = await supabase
        .from('weekly_paychecks')
        .update({ status: 'draft' })
        .eq('id', paycheckId)

      if (error) throw error
      setToast({ type: 'success', text: 'Paycheck returned to student' })
      await fetchPaychecks()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to return paycheck' })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-ds-inset text-ds-secondary',
      verified: 'bg-ds-accent-soft text-ds-accent',
      allocated: 'bg-ds-accent-soft text-ds-accent'
    }
    return colors[status] || 'bg-ds-inset text-ds-secondary'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />
      case 'allocated':
        return <CheckCircle className="w-4 h-4" />
      case 'submitted':
        return <Clock className="w-4 h-4" />
      default:
        return <FileCheck className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      submitted: 'Pending',
      verified: 'Approved',
      allocated: 'Complete'
    }
    return labels[status] || status
  }

  const initials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.3
      }
    })
  }

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
      <div className="space-y-6 p-8">
        <Toast message={toast} />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">Review Paychecks</h1>
          <p className="text-lg text-ds-secondary">
            {pendingPaychecks.length > 0
              ? `${pendingPaychecks.length} paycheck${pendingPaychecks.length === 1 ? '' : 's'} waiting for you`
              : 'You’re all caught up!'}
          </p>
        </motion.div>

        {pendingPaychecks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-ds-md bg-ds-inset border border-ds-hairline"
          >
            <Clock className="w-5 h-5 text-ds-secondary" />
            <span className="font-semibold text-ds-secondary">
              {pendingPaychecks.length} pending review
            </span>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-ds-inset rounded-ds-md animate-pulse" />
            ))}
          </div>
        ) : pendingPaychecks.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ds-primary">Needs Your Approval</h2>
            <div className="space-y-4">
              {pendingPaychecks.map((paycheck, index) => (
                <motion.div
                  key={paycheck.id}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ds-inset flex items-center justify-center text-ds-primary font-semibold text-sm">
                          {initials(paycheck.profiles.full_name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ds-primary">{paycheck.profiles.full_name}</p>
                          <p className="text-sm text-ds-tertiary">
                            {paycheck.week_label || new Date(paycheck.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Tag color={getStatusColor(paycheck.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(paycheck.status)}
                          {getStatusLabel(paycheck.status)}
                        </div>
                      </Tag>
                    </div>

                    <div className="border-t border-ds-hairline pt-4">
                      <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em]">Total Pay</p>
                      <p className="text-3xl font-bold text-ds-primary mt-1 tabular-nums">
                        {formatCurrency(paycheck.total_earnings || 0)}
                      </p>
                    </div>

                    <div className="border-t border-ds-hairline pt-4 flex gap-3">
                      <Button
                        onClick={() => setConfirmAction({ type: 'approve', paycheck })}
                        disabled={processingId === paycheck.id}
                        size="sm"
                        full
                      >
                        <CheckCircle className="w-4 h-4 mr-2 inline" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setConfirmAction({ type: 'return', paycheck })}
                        disabled={processingId === paycheck.id}
                        variant="danger"
                        size="sm"
                        full
                      >
                        <XCircle className="w-4 h-4 mr-2 inline" />
                        Send Back
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <FileCheck className="w-12 h-12 mx-auto mb-3 text-ds-tertiary" />
            <p className="text-sm font-semibold text-ds-secondary">Nothing to review</p>
            <p className="text-xs text-ds-tertiary mt-1">
              All student paychecks are up to date
            </p>
          </motion.div>
        )}

        {recentPaychecks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-ds-primary">Recent Activity</h2>
            <div className="space-y-2">
              {recentPaychecks.map((paycheck, index) => (
                <motion.div
                  key={paycheck.id}
                  custom={index}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: (idx) => ({
                      opacity: 1,
                      x: 0,
                      transition: {
                        delay: idx * 0.03,
                        duration: 0.2
                      }
                    })
                  }}
                  initial="hidden"
                  animate="visible"
                  className="p-4 rounded-ds-lg border border-ds-hairline bg-ds-surface transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ds-inset flex items-center justify-center text-ds-secondary font-semibold text-xs">
                      {initials(paycheck.profiles.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ds-primary text-sm">{paycheck.profiles.full_name}</p>
                      <p className="text-xs text-ds-tertiary">
                        {paycheck.week_label || new Date(paycheck.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-ds-primary tabular-nums">
                        {formatCurrency(paycheck.total_earnings || 0)}
                      </p>
                      <Tag color={getStatusColor(paycheck.status)}>
                        <div className="flex items-center gap-1 text-xs">
                          {getStatusIcon(paycheck.status)}
                          {getStatusLabel(paycheck.status)}
                        </div>
                      </Tag>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <ConfirmDialog
          open={confirmAction !== null}
          title={confirmAction?.type === 'approve' ? 'Approve this paycheck?' : 'Send this back for edits?'}
          message={confirmAction ? `${confirmAction.paycheck.profiles.full_name} - ${confirmAction.paycheck.week_label || new Date(confirmAction.paycheck.created_at).toLocaleDateString()} - ${formatCurrency(confirmAction.paycheck.total_earnings || 0)}` : ''}
          confirmLabel={confirmAction?.type === 'approve' ? 'Approve' : 'Send Back'}
          variant={confirmAction?.type === 'approve' ? 'primary' : 'danger'}
          loading={processingId === confirmAction?.paycheck?.id}
          onConfirm={async () => {
            if (confirmAction?.type === 'approve') {
              await approvePaycheck(confirmAction.paycheck)
            } else {
              await returnPaycheck(confirmAction.paycheck.id)
            }
            setConfirmAction(null)
          }}
          onCancel={() => setConfirmAction(null)}
        />
      </div>
    </div>
  )
}
