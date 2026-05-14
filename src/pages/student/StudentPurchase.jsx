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
        return <Tag color="bg-ds-accent-soft text-ds-positive">Approved</Tag>
      case 'rejected':
        return <Tag color="bg-ds-negative-soft text-ds-negative">Rejected</Tag>
      default:
        return <Tag color="bg-ds-inset text-ds-secondary">Pending</Tag>
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ds-hairline"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em] mb-2">
          Purchase Request
        </h1>
        <p className="text-[13px] text-ds-tertiary">
          Ask for permission to buy something
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        <FinTip
          icon=""
          title="Needs vs Wants"
          color="from-stone-50 to-stone-100"
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
          className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1">
                Spending Money
              </p>
              <p className="text-3xl font-bold text-ds-primary tabular-nums">
                <AnimNum value={checkingBalance} prefix="$" />
              </p>
              <p className="text-[11px] text-ds-tertiary mt-1">
                from your Checking account
              </p>
            </div>
            <div className="text-4xl"></div>
          </div>
        </motion.div>

        {/* Purchase Request Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7 space-y-5"
        >
          <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em]">New Request</h2>

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
            {loading ? 'Submitting...' : 'Submit Purchase Request'}
          </Button>
        </motion.form>

        {/* Your Requests */}
        {purchases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7"
          >
            <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-4">
              Your Requests
            </h2>

            <div className="space-y-3">
              {purchases.map((purchase, index) => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-ds-hairline rounded-ds-lg hover:border-ds-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-ds-primary">
                          {purchase.item_name}
                        </h3>
                        {getStatusTag(purchase.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[13px] text-ds-tertiary mb-2">
                        <div className="font-semibold text-ds-primary tabular-nums">
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
                            className="text-ds-secondary hover:text-ds-primary flex items-center gap-1"
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
                        className="p-2 text-ds-tertiary hover:bg-ds-overlay rounded-ds-md hover:text-ds-negative transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Status Legend */}
            <div className="mt-6 pt-6 border-t border-ds-hairline text-sm text-ds-tertiary space-y-2">
              <p className="font-semibold text-ds-primary">Status Meanings:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ds-inset" aria-hidden="true" />
                  <span>Pending - Awaiting decision</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ds-accent-soft" aria-hidden="true" />
                  <span>Approved - Ready to buy!</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ds-negative-soft" aria-hidden="true" />
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
            <div className="text-4xl mb-3"></div>
            <p className="text-sm font-semibold text-ds-tertiary">No purchase requests yet</p>
            <p className="text-xs text-ds-tertiary mt-1">Fill out the form above to request a purchase</p>
          </motion.div>
        )}

        <FinTip icon="" title="The 24-Hour Rule" color="from-stone-50 to-stone-100">
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
