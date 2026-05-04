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
    <div className="min-h-screen bg-alpha-blue-50 dark:bg-[#0c100c]">
      <Toast message={toast} />

      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-7 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold text-alpha-navy-800 dark:text-white tracking-[-0.02em] mb-2">
            Transfer Funds
          </h1>
          <p className="text-[13px] text-alpha-blue-600 dark:text-alpha-blue-300 font-semibold">
            Move money between any of your accounts — no fees, instant
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="rounded-2xl p-5 border border-alpha-blue-200 bg-alpha-blue-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-alpha-blue-700 dark:text-alpha-blue-400 uppercase tracking-[0.18em]">Learn</span>
            </div>
            <p className="text-[12px] text-alpha-blue-700 dark:text-alpha-blue-300 leading-relaxed font-medium">
              Move money between any of your accounts in either direction — no fees, instant. Just like a real brokerage (Robinhood, Fidelity, Schwab). Investments can swing up and down, so think long-term before selling.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-white/[0.03] rounded-2xl border border-alpha-blue-200 shadow-soft p-6 space-y-6"
          >
            {/* From Account Picker */}
            <div>
              <h2 className="text-[11px] font-bold text-alpha-navy/60 dark:text-alpha-blue-300 uppercase tracking-[0.18em] mb-4">
                From Account
              </h2>
            <AccountPicker
              accounts={Object.fromEntries(
                Object.entries(accounts).filter(([key]) => ['checking', 'savings', 'sp500', 'nasdaq'].includes(key))
              )}
              selected={fromAccount}
              onSelect={setFromAccount}
              showBalance={true}
            />
            <p className="text-[11px] text-ink-faint dark:text-white/25 mt-2">
              Move money in any direction — no fees, instant.
            </p>
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
              <h2 className="text-[11px] font-bold text-alpha-navy/60 dark:text-alpha-blue-300 uppercase tracking-[0.18em] mb-4">
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
                <h2 className="text-[11px] font-bold text-alpha-navy/60 dark:text-alpha-blue-300 uppercase tracking-[0.18em] mb-4">
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
          <div className="bg-white dark:bg-white/[0.03] border border-alpha-blue-200 rounded-2xl p-6 shadow-soft">
            <h3 className="text-[11px] font-bold text-alpha-navy/60 dark:text-alpha-blue-300 mb-4 uppercase tracking-[0.18em]">Current Balances</h3>
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

          <div className="rounded-2xl p-5 border border-alpha-blue-200 bg-alpha-blue-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-alpha-blue-700 dark:text-alpha-blue-400 uppercase tracking-[0.18em]">Learn</span>
            </div>
            <p className="text-[12px] text-alpha-blue-700 dark:text-alpha-blue-300 leading-relaxed font-medium">
              Selling investments when they're down locks in a loss. The S&P 500 has dropped 20%+ about once every 4 years — and recovered every single time. The smartest investors hold through dips.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
