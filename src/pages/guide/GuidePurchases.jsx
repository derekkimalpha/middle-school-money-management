import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Button, Tag, Toast, ConfirmDialog } from '../../components/shared'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

export const GuidePurchases = () => {
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processingId, setProcessingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

  useEffect(() => {
    filterPurchases()
  }, [filter, purchases])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          id,
          student_id,
          item_name,
          price,
          status,
          created_at,
          profiles!student_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to load purchases' })
    } finally {
      setLoading(false)
    }
  }

  const filterPurchases = () => {
    let filtered = purchases
    if (filter !== 'all') {
      filtered = purchases.filter(p => p.status === filter)
    }
    setFilteredPurchases(filtered)
  }

  const approvePurchase = async (purchase) => {
    try {
      setProcessingId(purchase.id)

      const { data: checkingAccount, error: accountError } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('student_id', purchase.student_id)
        .eq('account_type', 'checking')
        .single()

      if (accountError) throw accountError

      if (checkingAccount.balance < purchase.price) {
        setToast({ type: 'error', text: 'Insufficient balance in checking account' })
        setProcessingId(null)
        return
      }

      const newBalance = checkingAccount.balance - purchase.price

      const [updateResult, statusResult] = await Promise.all([
        supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', checkingAccount.id),
        supabase
          .from('purchase_requests')
          .update({ status: 'approved' })
          .eq('id', purchase.id)
      ])

      if (updateResult.error || statusResult.error) throw new Error('Failed to update')

      const { error: logError } = await supabase
        .from('transactions')
        .insert({
          student_id: purchase.student_id,
          account_id: checkingAccount.id,
          account_type: 'checking',
          type: 'purchase',
          amount: -purchase.price,
          description: `Purchase: ${purchase.item_name}`,
          created_at: new Date().toISOString()
        })

      if (logError) throw logError

      setToast({ type: 'success', text: 'Purchase approved' })
      await fetchPurchases()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to approve purchase' })
    } finally {
      setProcessingId(null)
    }
  }

  const rejectPurchase = async (purchaseId) => {
    try {
      setProcessingId(purchaseId)
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: 'rejected' })
        .eq('id', purchaseId)

      if (error) throw error
      setToast({ type: 'success', text: 'Purchase rejected' })
      await fetchPurchases()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to reject purchase' })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-stone-100 text-stone-700',
      approved: 'bg-sage-bg text-sage-700',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
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

  const filterTabs = [
    { label: 'All', value: 'all', count: purchases.length },
    { label: 'Pending', value: 'pending', count: purchases.filter(p => p.status === 'pending').length },
    { label: 'Approved', value: 'approved', count: purchases.filter(p => p.status === 'approved').length },
    { label: 'Rejected', value: 'rejected', count: purchases.filter(p => p.status === 'rejected').length }
  ]

  return (
    <div className="space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-4xl font-extrabold text-ink dark:text-chalk-white font-hand">Purchases</h1>
        <p className="text-lg text-ink-muted dark:text-white/50">Student requests</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 border-b border-black/[0.08] dark:border-white/[0.06]"
      >
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-3 font-semibold font-hand text-sm transition-all border-b-2 ${
              filter === tab.value
                ? 'border-pencil-dark dark:border-pencil text-pencil-dark dark:text-pencil'
                : 'border-transparent text-ink-muted dark:text-white/50 hover:text-ink dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-pencil/10 dark:bg-white/[0.08] text-pencil-dark dark:text-pencil text-xs font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : filteredPurchases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <div className="text-4xl mb-3">📦</div>
          <p className="text-sm font-semibold text-ink-muted dark:text-white/40">No purchases found</p>
          <p className="text-xs text-ink-faint dark:text-white/25 mt-1">
            {filter === 'pending'
              ? 'No pending requests right now'
              : "Students haven't submitted any purchase requests yet"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map((purchase, index) => (
            <motion.div
              key={purchase.id}
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
                      {initials(purchase.profiles.full_name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink dark:text-chalk-white font-hand">{purchase.profiles.full_name}</p>
                      <p className="text-sm text-ink-muted dark:text-white/50">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Tag color={getStatusColor(purchase.status)}>
                    {purchase.status}
                  </Tag>
                </div>

                <div className="border-t border-black/[0.08] dark:border-white/[0.06] pt-4">
                  <p className="text-3xl font-extrabold text-ink dark:text-chalk-white font-hand">{purchase.item_name}</p>
                  <p className="text-2xl font-bold text-pencil-dark dark:text-pencil mt-2">
                    {formatCurrency(purchase.price)}
                  </p>
                </div>

                {purchase.status === 'pending' && (
                  <div className="border-t border-black/[0.08] dark:border-white/[0.06] pt-4 flex gap-3">
                    <Button
                      onClick={() => setConfirmAction({ type: 'approve', purchase })}
                      disabled={processingId === purchase.id}
                      size="sm"
                      full
                    >
                      <Check className="w-4 h-4 mr-2 inline" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setConfirmAction({ type: 'reject', purchase })}
                      disabled={processingId === purchase.id}
                      variant="danger"
                      size="sm"
                      full
                    >
                      <X className="w-4 h-4 mr-2 inline" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.type === 'approve' ? 'Approve this purchase?' : 'Reject this purchase?'}
        message={confirmAction ? `${confirmAction.purchase.item_name} - ${formatCurrency(confirmAction.purchase.price)}` : ''}
        confirmLabel={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmAction?.type === 'approve' ? 'primary' : 'danger'}
        loading={processingId === confirmAction?.purchase?.id}
        onConfirm={async () => {
          if (confirmAction?.type === 'approve') {
            await approvePurchase(confirmAction.purchase)
          } else {
            await rejectPurchase(confirmAction.purchase.id)
          }
          setConfirmAction(null)
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
