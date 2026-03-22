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

  // Calculate fee
  const hasFee =
    fromAccount &&
    ['sp500', 'nasdaq'].includes(fromAccount) &&
    ['checking'].includes(toAccount)
  const feeAmount = hasFee ? Math.round(amount * 0.1 * 100) / 100 : 0
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
      const { error } = await supabase.rpc('transfer_funds', {
        from_account_type: fromAccount,
        to_account_type: toAccount,
        amount: amount,
        student_id: profile.id,
      })

      if (error) throw error

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
        text: 'Transfer failed. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (accountsLoading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray to-white p-6 pb-20">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Transfer Funds
        </h1>
        <p className="text-slate-600">
          Move money between your accounts
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        <FinTip
          icon="💸"
          title="How Transfers Work"
          color="from-blue-50 to-cyan-50"
        >
          You can move money between your accounts to manage your finances. Moving
          money from investments (S&P 500, NASDAQ) to Checking has a 10% withdrawal
          fee to encourage long-term investing. Keep these fees in mind when
          planning your transfers!
        </FinTip>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          {/* From Account Picker */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage-400 to-green-400 flex items-center justify-center text-white shadow-lg">
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
              <h2 className="text-lg font-bold text-slate-900 mb-4">
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
                <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
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
                <h2 className="text-lg font-bold text-slate-900 mb-4">
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
                    className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Transfer Amount</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>

                    {hasFee && (
                      <>
                        <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                          <span className="text-amber-600 font-semibold">
                            10% Withdrawal Fee
                          </span>
                          <span className="font-semibold text-amber-600">
                            -{formatCurrency(feeAmount)}
                          </span>
                        </div>

                        <div className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded">
                          Transferring from an investment account to Checking incurs
                          a 10% fee to encourage long-term investing.
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-300">
                      <span className="text-slate-900">You'll receive</span>
                      <span className="text-sage-600">
                        {formatCurrency(amountAfterFee)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {amount > (accounts[fromAccount] || 0) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-rose-50 border-2 border-rose-200 rounded-lg flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-800">
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
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="font-bold text-blue-900 mb-2">Current Balances</h3>
            <div className="space-y-1 text-sm">
              {Object.entries(accounts)
                .filter(([key]) => key !== 'bonus')
                .map(([key, balance]) => (
                  <div
                    key={key}
                    className="flex justify-between text-blue-800"
                  >
                    <span>{ACCOUNT_META[key]?.label}</span>
                    <span className="font-semibold">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h3 className="font-bold text-green-900 mb-2">Transfer Rules</h3>
            <div className="space-y-1 text-xs text-green-800">
              <p>• Checking → All accounts</p>
              <p>• Savings → Checking, S&P, NASDAQ</p>
              <p>• S&P, NASDAQ → Checking, Savings</p>
              <p>• Bonus → All accounts</p>
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
