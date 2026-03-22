import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button, Field, FinTip, Input, Toast, Tag, AnimNum, ConfirmDialog } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/constants'
import { ExternalLink, Trash2 } from 'lucide-react'

export const StudentPurchase = () => {
  const { profile } = useAuth()
  const [itemName, setItemName] = useState('')
  const [link, setLink] = useState('')
  const [price, setPrice] = useState(0)
  const [purchases, setPurchases] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { accounts } = useAccounts(profile?.id)

  const checkingBalance = accounts?.checking || 0

  // Fetch purchase requests
  useEffect(() => {
    if (!profile?.id) return

    const fetchPurchases = async () => {
      try {
        const { data } = await supabase
          .from('purchase_requests')
          .select('*')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })

        if (data) {
          setPurchases(data)
        }
      } catch (error) {
        console.error('Error fetching purchases:', error)
      }
    }

    fetchPurchases()
  }, [profile?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!itemName.trim()) {
      setToast({ type: 'error', text: 'Please enter an item name' })
      return
    }

    if (price <= 0) {
      setToast({ type: 'error', text: 'Please enter a valid price' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .insert({
          student_id: profile.id,
          item_name: itemName,
          link: link || null,
          price: price,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setToast({
        type: 'success',
        text: `Purchase request for ${itemName} submitted!`,
      })

      // Add to list
      setPurchases([data, ...purchases])

      // Reset form
      setItemName('')
      setLink('')
      setPrice(0)
    } catch (error) {
      console.error('Error creating purchase request:', error)
      setToast({
        type: 'error',
        text: 'Failed to submit purchase request',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPurchases(purchases.filter((p) => p.id !== id))
      setToast({ type: 'success', text: 'Purchase request deleted' })
      setConfirmDelete(null)
    } catch (error) {
      console.error('Error deleting purchase:', error)
      setToast({ type: 'error', text: 'Failed to delete request' })
    }
  }

  const getStatusTag = (status) => {
    switch (status) {
      case 'approved':
        return <Tag color="bg-emerald-100 text-emerald-700">Approved</Tag>
      case 'rejected':
        return <Tag color="bg-rose-100 text-rose-700">Rejected</Tag>
      default:
        return <Tag color="bg-amber-100 text-amber-700">Pending</Tag>
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-[-0.02em] mb-2">
          Purchase Request
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-white/50">
          Ask for permission to buy something
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        <FinTip
          icon="🛍️"
          title="Needs vs Wants"
          color="from-blue-50 to-cyan-50"
        >
          Before requesting a purchase, ask yourself: Is this a need (essential)
          or a want (nice-to-have)? Understanding the difference helps you make
          smarter spending decisions and manage your money wisely.
        </FinTip>

        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1">
                Checking Balance (For Purchases)
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                <AnimNum value={checkingBalance} prefix="$" />
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </motion.div>

        {/* Purchase Request Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-200 dark:border-white/[0.08] p-6 space-y-5"
        >
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">New Request</h2>

          <Field label="What do you want to buy?">
            <Input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Gaming Headphones, Skateboard..."
            />
          </Field>

          <Field label="Link (Optional)">
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/product"
            />
          </Field>

          <Field label="Price">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              prefix="$"
              big
            />
          </Field>

          <Button full size="lg" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </motion.form>

        {/* Your Requests */}
        {purchases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-200 dark:border-white/[0.08] p-6"
          >
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">
              Your Requests
            </h2>

            <div className="space-y-3">
              {purchases.map((purchase, index) => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-gray-200 dark:border-white/[0.08] rounded-xl hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {purchase.item_name}
                        </h3>
                        {getStatusTag(purchase.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-500 dark:text-white/50 mb-2">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(purchase.price)}
                        </div>

                        <div>
                          {new Date(purchase.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </div>

                        {purchase.link && (
                          <a
                            href={purchase.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/90 flex items-center gap-1"
                          >
                            View Link
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {purchase.status === 'pending' && (
                      <button
                        onClick={() => setConfirmDelete(purchase)}
                        className="p-2 text-gray-300 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.08] rounded-lg hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Status Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/[0.08] text-sm text-gray-500 dark:text-white/50 space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">Status Meanings:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>Pending - Awaiting decision</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span>Approved - Ready to buy!</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <span>Rejected - Not approved</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {purchases.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="py-16 text-center"
          >
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-sm font-semibold text-gray-500 dark:text-white/40">No purchase requests</p>
            <p className="text-xs text-gray-400 dark:text-white/25 mt-1">Submit a request above to buy something</p>
          </motion.div>
        )}

        <FinTip icon="💡" title="The 24-Hour Rule" color="from-amber-50 to-orange-50">
          Before making a big purchase, wait 24 hours. This is a real strategy that millionaires use! If you still want it after a day, it might be worth buying. But often, the urge passes and you save your money for something better.
        </FinTip>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete purchase request?"
        message={confirmDelete ? `${confirmDelete.item_name} - ${formatCurrency(confirmDelete.price)}` : ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
