import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BarChart3 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/constants'

/**
 * Wealthfront-style "Total gains/losses" breakdown card.
 *
 * Pulls from the transactions table and groups by category:
 *   - Net deposits  = baseline + paycheck_allocation + transfers IN
 *   - Interest      = sum of category='interest'
 *   - Market change = sum of category='market_return'
 *   - Cash outs     = sum of category='cash_out' (negative)
 *
 * Net = ending balance - net_deposits
 */
export const EarningsBreakdown = ({ studentId }) => {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!studentId) return
    supabase
      .from('transactions')
      .select('amount, category')
      .eq('student_id', studentId)
      .then(({ data: rows }) => {
        if (!rows) return
        let deposits = 0, interest = 0, market = 0, cashOut = 0, ending = 0
        for (const t of rows) {
          const amt = Number(t.amount || 0)
          ending += amt
          if (t.category === 'interest') interest += amt
          else if (t.category === 'market_return') market += amt
          else if (t.category === 'cash_out') cashOut += amt
          else deposits += amt
        }
        const totalGains = interest + market
        setData({
          totalGains: Math.round(totalGains * 100) / 100,
          starting: 0,
          deposits: Math.round(deposits * 100) / 100,
          interest: Math.round(interest * 100) / 100,
          market: Math.round(market * 100) / 100,
          cashOut: Math.round(cashOut * 100) / 100,
          ending: Math.round(ending * 100) / 100,
        })
      })
  }, [studentId])

  if (!data) {
    return (
      <div className="bg-ds-surface border border-ds-hairline rounded-ds-xl h-[140px] animate-pulse" />
    )
  }

  const isUp = data.totalGains >= 0

  return (
    <div className="bg-ds-surface border border-ds-hairline rounded-ds-xl overflow-hidden">
      <div className="px-6 md:px-7 pt-6 pb-5 border-b border-ds-hairline">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-ds-md bg-ds-inset text-ds-secondary flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-4 h-4" strokeWidth={2} />
          </div>
          <p className="text-[15px] font-semibold text-ds-primary">
            Total gains
          </p>
        </div>
        <p className={`text-[28px] font-bold tracking-[-0.02em] tabular-nums ${isUp ? 'text-ds-positive' : 'text-ds-negative'}`}>
          {isUp ? '+' : ''}{formatCurrency(data.totalGains)}
        </p>
        <p className="text-[12px] text-ds-tertiary mt-2 leading-snug">
          Growth from interest payments and market changes.
        </p>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 md:px-7 py-3.5 hover:bg-ds-overlay transition-colors"
      >
        <span className="text-[12px] font-semibold text-ds-secondary uppercase tracking-[0.05em]">
          {open ? 'Hide breakdown' : 'View breakdown'}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-ds-tertiary" strokeWidth={2.4} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-ds-hairline"
          >
            <div className="px-6 md:px-7 py-4 space-y-2.5 text-[13px]">
              <Line label="Starting balance" value={data.starting} muted />
              <Line label="Money in (paychecks + deposits)" value={data.deposits} positive />
              <Line label="Interest earned" value={data.interest} positive />
              <Line label="Market gains/losses" value={data.market} signed />
              {data.cashOut !== 0 && <Line label="Cash outs" value={data.cashOut} signed />}
              <div className="pt-3 border-t border-ds-hairline flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ds-primary">Current balance</span>
                <span className="text-[15px] font-semibold tabular-nums text-ds-primary">{formatCurrency(data.ending)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Line = ({ label, value, muted, positive, signed }) => {
  let display
  let cls
  if (muted) {
    display = formatCurrency(value)
    cls = 'text-ds-tertiary'
  } else if (positive) {
    display = `+${formatCurrency(Math.abs(value))}`
    cls = 'text-ds-positive'
  } else if (signed) {
    const sign = value >= 0 ? '+' : '−'
    display = `${sign}${formatCurrency(Math.abs(value))}`
    cls = value >= 0 ? 'text-ds-positive' : 'text-ds-negative'
  } else {
    display = formatCurrency(value)
    cls = 'text-ds-primary'
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-ds-secondary">{label}</span>
      <span className={`tabular-nums font-semibold ${cls}`}>{display}</span>
    </div>
  )
}
