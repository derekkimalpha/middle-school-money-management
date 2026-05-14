import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AccountPicker,
  Button,
  Field,
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

  const validTargets = fromAccount ? TRANSFER_RULES[fromAccount] || [] : []

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

      setFromAccount(null)
      setToAccount(null)
      setAmount(0)

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
      <div className="flex items-center justify-center h-screen bg-ds-canvas">
        <motion.div
          className="w-9 h-9 border-[2.5px] border-ds-hairline border-t-ds-accent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
      <Toast message={toast} />

      <div className="max-w-2xl mx-auto px-6 md:px-10 pt-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-[11px] font-semibold text-ds-tertiary tracking-[0.06em] uppercase mb-2">
            Move money
          </p>
          <h1 className="text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">
            Transfer
          </h1>
          <p className="text-[13px] text-ds-secondary mt-1.5">
            Move money between any of your accounts — no fees, instant.
          </p>
        </motion.div>

        <div className="space-y-5">
          {/* Learn callout */}
          <div className="rounded-ds-xl p-5 bg-ds-inset border border-ds-hairline">
            <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.06em] mb-1.5">Tip</p>
            <p className="text-[13px] text-ds-secondary leading-relaxed">
              Modern brokerages let you move freely between cash and investments — $0 fees, instant. Investments can swing up and down, so think long-term before selling.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7 space-y-6"
          >
            {/* From */}
            <div>
              <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-3">
                From account
              </h2>
              <AccountPicker
                accounts={Object.fromEntries(
                  Object.entries(accounts).filter(([key]) => ['checking', 'savings', 'sp500', 'nasdaq'].includes(key))
                )}
                selected={fromAccount}
                onSelect={setFromAccount}
                showBalance={true}
              />
            </div>

            {/* Arrow */}
            {fromAccount && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-ds-inset text-ds-secondary flex items-center justify-center">
                  <ArrowDownUp className="w-4 h-4" strokeWidth={2} />
                </div>
              </motion.div>
            )}

            {/* To */}
            {fromAccount && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <h2 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-3">
                  To account
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
                  <div className="mt-4 p-4 rounded-ds-md bg-ds-negative-soft border border-ds-negative/30 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-ds-negative flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                    <p className="text-[13px] text-ds-negative font-medium">
                      Cannot transfer from this account
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Amount */}
            {fromAccount && toAccount && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="space-y-5"
              >
                <Field label="How much?">
                  <Input
                    type="number"
                    min="0"
                    max={accounts[fromAccount] || 0}
                    step="0.01"
                    value={amount || ''}
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
                    className="rounded-ds-md bg-ds-inset p-4 space-y-1.5"
                  >
                    <div className="flex justify-between text-[12px]">
                      <span className="text-ds-secondary">Transfer amount</span>
                      <span className="font-semibold text-ds-primary tabular-nums">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between text-[14px] font-semibold pt-2 border-t border-ds-hairline">
                      <span className="text-ds-primary">Lands in {ACCOUNT_META[toAccount]?.label}</span>
                      <span className="text-ds-positive tabular-nums">+{formatCurrency(amount)}</span>
                    </div>
                  </motion.div>
                )}

                {amount > (accounts[fromAccount] || 0) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-ds-md bg-ds-negative-soft border border-ds-negative/30 p-4 flex gap-3"
                  >
                    <AlertCircle className="w-4 h-4 text-ds-negative flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                    <p className="text-[13px] text-ds-negative font-medium">
                      Insufficient balance. You have {formatCurrency(accounts[fromAccount] || 0)}.
                    </p>
                  </motion.div>
                )}

                <Button
                  full
                  size="lg"
                  disabled={!isValid || loading}
                  onClick={handleTransfer}
                >
                  {loading ? 'Transferring…' : 'Confirm transfer'}
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Current balances */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7"
          >
            <h3 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-4">Current balances</h3>
            <div className="space-y-2.5 text-[13px]">
              {Object.entries(accounts)
                .filter(([key]) => key !== 'bonus')
                .map(([key, balance]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-ds-secondary">{ACCOUNT_META[key]?.label}</span>
                    <span className="font-semibold tabular-nums text-ds-primary">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Investing tip */}
          <div className="rounded-ds-xl p-5 bg-ds-inset border border-ds-hairline">
            <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.06em] mb-1.5">Long-term lens</p>
            <p className="text-[13px] text-ds-secondary leading-relaxed">
              Selling investments when they're down locks in a loss. The S&P 500 has dropped 20%+ about once every 4 years — and recovered every single time. The smartest investors hold through dips.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
