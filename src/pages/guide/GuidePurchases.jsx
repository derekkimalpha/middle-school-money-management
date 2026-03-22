import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Button, Tag, Toast } from '../../components/shared'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

export const GuidePurchases = () => {
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processingId, setProcessingId] = useState(null)
  const [toast, setToast] = useState(null)

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
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-rose-100 text-rose-800'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
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
    <div className="space-y-6">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-4xl font-bold text-slate-900">Purchases</h1>
        <p className="text-lg text-slate-600">Student requests</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 border-b border-slate-200"
      >
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
              filter === tab.value
                ? 'border-sage text-sage'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredPurchases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-slate-600 text-lg">No purchases found</p>
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
              className="p-6 rounded-lg border border-slate-200 hover:border-sage transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-sage to-teal flex items-center justify-center text-white font-semibold text-sm">
                      {initials(purchase.profiles.full_name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{purchase.profiles.full_name}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Tag color={getStatusColor(purchase.status)}>
                    {purchase.status}
                  </Tag>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-3xl font-bold text-slate-900">{purchase.item_name}</p>
                  <p className="text-2xl font-bold text-sage mt-2">
                    {formatCurrency(purchase.price)}
                  </p>
                </div>

                {purchase.status === 'pending' && (
                  <div className="border-t border-slate-200 pt-4 flex gap-3">
                    <Button
                      onClick={() => approvePurchase(purchase)}
                      disabled={processingId === purchase.id}
                      size="sm"
                      full
                    >
                      <Check className="w-4 h-4 mr-2 inline" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectPurchase(purchase.id)}
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
    </div>
  )
}
