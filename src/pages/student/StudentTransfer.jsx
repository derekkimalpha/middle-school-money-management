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
import { usePaycheckSettings } from '../../hooks/usePaycheckSettings'
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
  const { settings } = usePaycheckSettings()

  // Get valid transfer targets
  const validTargets = fromAccount ? TRANSFER_RULES[fromAccount] || [] : []

  // Calculate fee based on transfer type and settings
  const getFeePct = () => {
    if (!fromAccount || !toAccount) return 0
    if (['sp500', 'nasdaq'].includes(fromAccount) && toAccount === 'checking') {
      return settings?.transfer_fee_invest_pct ?? 10
    }
    if (fromAccount === 'savings' && toAccount === 'checking') {
      return settings?.transfer_fee_savings_pct ?? 0
    }
    return 0
  }

  const feePct = getFeePct()
  const hasFee = feePct > 0
  const feeAmount = hasFee ? Math.round(amount * (feePct / 100) * 100) / 100 : 0
  const amountAfterFee = amount - feeAmount

  // Validate form
  const isValid =
    fromAccount &&
    toAccount &&
    amount > 0 &&
    amount <= (accounts?.[fromAccount] || 0) &&
    fromAccount !== toAccount &&
    validTargets.includes(toAccount)

  const handleTransfer = async () => {
    if (!isValid) {
      setToast({
        type: 'error',
        text: 'Please check your transfer details',
      })
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
        text: `Transferred ${formatCurrency(amountAfterFee)} to ${ACCOUNT_META[toAccount]?.label}`,
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-400"></div>
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
          Transfer Funds
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-white/50">
          Move money between your accounts
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        <FinTip
          icon="💸"
          title="How Transfers Work"
          color="from-blue-50 to-cyan-50"
        >
          You can move money between your accounts to manage your finances.
          {settings?.transfer_fee_invest_pct > 0 && (
            <> Moving money from investments (S&P 500, NASDAQ) to Checking has a {settings.transfer_fee_invest_pct}% withdrawal fee to encourage long-term investing.</>
          )}
          {settings?.transfer_fee_savings_pct > 0 && (
            <> Savings to Checking transfers have a {settings.transfer_fee_savings_pct}% fee.</>
          )}
          {' '}Keep these fees in mind when planning your transfers!
        </FinTip>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1a1625] rounded-xl border border-gray-200 dark:border-white/[0.08] dark:border-white/[0.06] p-6 space-y-6"
        >
          {/* From Account Picker */}
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center text-white">
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
              <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
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
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Cannot transfer from this account
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Amount and Fee */}
          {fromAccount && toAccount && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
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
                    placeholder="0.00"
                    prefix="$"
                    big
                  />
                </Field>

                {amount > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.04] rounded-xl space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-white/50">Transfer Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(amount)}
                      </span>
                    </div>

                    {hasFee && (
                      <>
                        <div className="flex justify-between text-sm border-t border-gray-200 dark:border-white/[0.08] dark:border-white/[0.06] pt-2">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {feePct}% Transfer Fee
                          </span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            -{formatCurrency(feeAmount)}
                          </span>
                        </div>

                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded">
                          {['sp500', 'nasdaq'].includes(fromAccount)
                            ? `Transferring from an investment account to Checking incurs a ${feePct}% fee to encourage long-term investing.`
                            : `Transferring from Savings to Checking incurs a ${feePct}% fee.`
                          }
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-white/[0.08] dark:border-white/[0.06]">
                      <span className="text-gray-900 dark:text-white">You'll receive</span>
                      <span className="text-violet-600 dark:text-violet-400">
                        {formatCurrency(amountAfterFee)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {amount > (accounts[fromAccount] || 0) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-800 rounded-lg flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-800 dark:text-rose-300">
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
                {loading ? 'Transferring...' : 'Complete Transfer'}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="bg-white dark:bg-[#1a1625] border border-gray-200 dark:border-white/[0.08] dark:border-white/[0.06] rounded-xl p-4">
            <h3 className="font-semibold text-[13px] text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Current Balances</h3>
            <div className="space-y-1 text-sm">
              {Object.entries(accounts)
                .filter(([key]) => key !== 'bonus')
                .map(([key, balance]) => (
                  <div
                    key={key}
                    className="flex justify-between text-gray-600 dark:text-white/50"
                  >
                    <span>{ACCOUNT_META[key]?.label}</span>
                    <span className="font-semibold">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1625] border border-gray-200 dark:border-white/[0.08] dark:border-white/[0.06] rounded-xl p-4">
            <h3 className="font-semibold text-[13px] text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Transfer Fees</h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-white/50">
              <p>• Investment → Checking: {settings?.transfer_fee_invest_pct ?? 10}% fee</p>
              <p>• Savings → Checking: {settings?.transfer_fee_savings_pct ?? 0}% fee</p>
              <p>• All other transfers: No fee</p>
            </div>
          </div>
        </motion.div>

        <FinTip icon="🧠" title="Real-World Connection: Early Withdrawal Penalties" color="from-purple-50 to-pink-50">
          In real life, retirement accounts like 401(k)s and IRAs charge a 10% penalty if you withdraw money before age 59½. That's why our investment accounts have a transfer fee — it teaches you that taking money out of investments early costs you. The best investors think long-term!
        </FinTip>
      </div>
    </div>
  )
}
