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
      submitted: 'bg-stone-100 dark:bg-white/[0.08] text-stone-700 dark:text-white/80',
      verified: 'bg-sage-bg dark:bg-white/[0.08] text-sage-700 dark:text-white/80',
      allocated: 'bg-sage-bg dark:bg-white/[0.08] text-sage-700 dark:text-white/80'
    }
    return colors[status] || 'bg-gray-100 dark:bg-white/[0.08] text-gray-700 dark:text-white/80'
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
    <div className="space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-4xl font-extrabold text-ink dark:text-chalk-white font-hand">Review Paychecks</h1>
        <p className="text-lg text-ink-muted dark:text-white/50">
          {pendingPaychecks.length > 0
            ? `${pendingPaychecks.length} paycheck${pendingPaychecks.length === 1 ? '' : 's'} waiting for you`
            : 'You\u2019re all caught up!'}
        </p>
      </motion.div>

      {pendingPaychecks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-pencil/10 dark:bg-white/[0.08] border border-pencil-dark/20 dark:border-pencil/20"
        >
          <Clock className="w-5 h-5 text-pencil-dark dark:text-pencil" />
          <span className="font-semibold font-hand text-pencil-dark dark:text-pencil">
            {pendingPaychecks.length} pending review
          </span>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : pendingPaychecks.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink dark:text-chalk-white font-hand">Needs Your Approval</h2>
          <div className="space-y-4">
            {pendingPaychecks.map((paycheck, index) => (
              <motion.div
                key={paycheck.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:border-black/[0.12] dark:hover:border-white/[0.10] transition-colors shadow-[2px_2px_0px_rgba(0,0,0,0.06)]"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ink dark:bg-chalk-white flex items-center justify-center text-white dark:text-ink font-semibold text-sm">
                        {initials(paycheck.profiles.full_name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink dark:text-chalk-white font-hand">{paycheck.profiles.full_name}</p>
                        <p className="text-sm text-ink-muted dark:text-white/50">
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

                  <div className="border-t border-black/[0.08] dark:border-white/[0.06] pt-4">
                    <p className="text-sm text-ink-muted dark:text-white/50">Total Pay</p>
                    <p className="text-3xl font-extrabold text-pencil-dark dark:text-pencil mt-1">
                      {formatCurrency(paycheck.total_earnings || 0)}
                    </p>
                  </div>

                  <div className="border-t border-black/[0.08] dark:border-white/[0.06] pt-4 flex gap-3">
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
          <FileCheck className="w-12 h-12 mx-auto mb-3 text-pencil-dark/20 dark:text-pencil/20" />
          <p className="text-sm font-semibold text-ink-muted dark:text-white/40">Nothing to review</p>
          <p className="text-xs text-ink-faint dark:text-white/25 mt-1">
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
          <h2 className="text-lg font-semibold text-ink dark:text-chalk-white font-hand">Recent Activity</h2>
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
                className="p-4 rounded-sm border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:border-black/[0.12] dark:hover:border-white/[0.10] transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-stone-700 dark:text-white/50 font-semibold text-xs">
                    {initials(paycheck.profiles.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink dark:text-chalk-white text-sm">{paycheck.profiles.full_name}</p>
                    <p className="text-xs text-ink-muted dark:text-white/50">
                      {paycheck.week_label || new Date(paycheck.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-ink dark:text-chalk-white">
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
  )
}
