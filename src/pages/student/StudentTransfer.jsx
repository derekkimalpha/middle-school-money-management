import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AccountPicker,
  Button,
  Field,
  FinTip,
  Input,
  Toast,
} from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { supabase } from '../../lib/supabase'
import { ACCOUNT_META, TRANSFER_RULES, formatCurrency } from '../../lib/constants'
import { ArrowDownUp, AlertCircle } from 'lucide-react'

export const StudentTransfer = () => {
  const { profile } = useAuth()
  const [fromAccount, setFromAccount] = useState(null)
  const [toAccount, setToAccount] = useState(null)
  const [amount, setAmount] = useState(0)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const { accounts, loading: accountsLoading, refreshAccounts } = useAccounts(
    profile?.id
  )

  // Get valid transfer targets
  const validTargets = fromAccount ? TRANSFER_RULES[fromAccount] || [] : []

  // Validate form
  const isValid =
    fromAccount &&
    toAccount &&
    amount > 0 &&
    amount <= (accounts?.[fromAccount] || 0) &&
    fromAccount !== toAccount &&
    validTargets.includes(toAccount)

  const handleTransfer = async () => {
    if (!fromAccount) {
      setToast({ type: 'error', text: 'Pick an account to transfer from' })
      return
    }
    if (!toAccount) {
      setToast({ type: 'error', text: 'Pick an account to transfer to' })
      return
    }
    if (amount <= 0) {
      setToast({ type: 'error', text: 'Enter an amount to transfer' })
      return
    }
    if (!isValid) {
      setToast({ type: 'error', text: 'Please check your transfer details' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('transfer_funds', {
        p_student_id: profile.id,
        p_from_type: fromAccount,
        p_to_type: toAccount,
        p_amount: amount,
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setToast({
        type: 'success',
        text: `Transferred ${formatCurrency(amount)} to ${ACCOUNT_META[toAccount]?.label}`,
      })

      // Reset form
      setFromAccount(null)
      setToAccount(null)
      setAmount(0)

      // Refresh accounts
      refreshAccounts()
    } catch (error) {
      console.error('Error transferring funds:', error)
      setToast({
        type: 'error',
        text: error.message || 'Transfer failed. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (accountsLoading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-400"></div>
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
        <h1 className="text-4xl font-extrabold text-ink dark:text-chalk-white tracking-[-0.02em] mb-2">
          Transfer Funds
        </h1>
        <p className="text-[13px] text-ink-muted dark:text-white/50">
          Move money between your accounts — no fees
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        <FinTip
          icon=""
          title="How Transfers Work"
          color="from-stone-50 to-stone-100"
        >
          Move money freely between your accounts to manage your finances. There are no fees — transfer as much as you want, whenever you want!
        </FinTip>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/[0.04] rounded-sm border border-black/[0.08] dark:border-white/[0.06] shadow-[2px_2px_0px_rgba(0,0,0,0.06)] p-6 space-y-6"
        >
          {/* From Account Picker */}
          <div>
            <h2 className="text-[13px] font-semibold text-ink dark:text-chalk-white font-hand uppercase tracking-wider mb-4">
              From Account
            </h2>
            <AccountPicker
              accounts={accounts}
              selected={fromAccount}
              onSelect={setFromAccount}
              exclude={['bonus']}
              showBalance={true}
            />
          </div>

          {/* Arrow Indicator */}
          {fromAccount && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center"
            >
              <div className="w-10 h-10 rounded-sm bg-ink dark:bg-chalk-white flex items-center justify-center text-white dark:text-ink">
                <ArrowDownUp className="w-6 h-6" />
              </div>
            </motion.div>
          )}

          {/* To Account Picker */}
          {fromAccount && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-[13px] font-semibold text-ink dark:text-chalk-white font-hand uppercase tracking-wider mb-4">
                To Account
              </h2>
              <AccountPicker
                accounts={Object.fromEntries(
                  Object.entries(accounts).filter(([key]) =>
                    validTargets.includes(key)
                  )
                )}
                selected={toAccount}
                onSelect={setToAccount}
                showBalance={true}
              />

              {validTargets.length === 0 && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Cannot transfer from this account
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Amount */}
          {fromAccount && toAccount && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-[13px] font-semibold text-ink dark:text-chalk-white font-hand uppercase tracking-wider mb-4">
                  Amount
                </h2>
                <Field label="How much would you like to transfer?">
                  <Input
                    type="number"
                    min="0"
                    max={accounts[fromAccount] || 0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                    prefix="$"
                    big
                  />
                </Field>

                {amount > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.04] rounded-sm space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-muted dark:text-white/50">Transfer Amount</span>
                      <span className="font-semibold text-ink dark:text-chalk-white">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-black/[0.08] dark:border-white/[0.06]">
                      <span className="text-ink dark:text-chalk-white">They'll receive</span>
                      <span className="text-ink dark:text-chalk-white">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {amount > (accounts[fromAccount] || 0) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-300">
                      Insufficient balance. You have{' '}
                      {formatCurrency(accounts[fromAccount] || 0)}.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Transfer Button */}
              <Button
                full
                size="lg"
                disabled={!isValid || loading}
                onClick={handleTransfer}
              >
                {loading ? 'Transferring...' : 'Confirm Transfer'}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Current Balances Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] rounded-sm p-4 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
            <h3 className="font-semibold text-[13px] text-ink dark:text-chalk-white font-hand mb-2 uppercase tracking-wider">Current Balances</h3>
            <div className="space-y-1 text-sm">
              {Object.entries(accounts)
                .filter(([key]) => key !== 'bonus')
                .map(([key, balance]) => (
                  <div
                    key={key}
                    className="flex justify-between text-ink-muted dark:text-white/50"
                  >
                    <span>{ACCOUNT_META[key]?.label}</span>
                    <span className="font-semibold">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        <FinTip icon="" title="Think Before You Transfer" color="from-stone-50 to-stone-100">
          In real life, moving money between accounts is easy — but having a plan matters. Think about your goals: savings for safety, investments for growth, and checking for spending. The best money managers are intentional about every move!
        </FinTip>
      </div>
    </div>
  )
}
