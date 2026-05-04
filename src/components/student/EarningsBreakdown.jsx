import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BarChart3 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/constants'
import { formatTxLabel } from '../../lib/txLabels'

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
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft h-[140px] animate-pulse" />
    )
  }

  const isUp = data.totalGains >= 0

  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-alpha-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <p className="text-base font-semibold text-alpha-navy-800 dark:text-white">
            Total gains
          </p>
        </div>
        <p className={`text-[28px] font-bold tabular-nums ${isUp ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
          {isUp ? '+' : ''}{formatCurrency(data.totalGains)}
        </p>
        <p className="text-[12px] text-alpha-blue-700 dark:text-alpha-blue-300 mt-2 font-semibold leading-snug">
          Growth from interest payments and market changes.
        </p>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-alpha-blue-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[13px] font-bold text-alpha-blue-600 dark:text-alpha-blue-400">View breakdown</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-alpha-blue-600 dark:text-alpha-blue-400" strokeWidth={3} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-alpha-blue-100"
          >
            <div className="px-6 py-4 space-y-2.5 text-[14px] font-semibold">
              <Line label="Starting balance" value={data.starting} muted />
              <Line label="Money in (paychecks + deposits)" value={data.deposits} positive />
              <Line label="Interest earned" value={data.interest} positive />
              <Line label="Market gains/losses" value={data.market} signed />
              {data.cashOut !== 0 && <Line label="Cash outs" value={data.cashOut} signed />}
              <div className="pt-3 border-t border-alpha-blue-100 flex items-center justify-between">
                <span className="text-[14px] font-bold text-alpha-navy-800 dark:text-white">Current balance</span>
                <span className="text-[16px] font-bold tabular-nums text-alpha-navy-800 dark:text-white">{formatCurrency(data.ending)}</span>
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
    cls = 'text-alpha-blue-600 dark:text-alpha-blue-400'
  } else if (positive) {
    display = `+${formatCurrency(Math.abs(value))}`
    cls = 'text-emerald-700 dark:text-emerald-400'
  } else if (signed) {
    const sign = value >= 0 ? '+' : '−'
    display = `${sign}${formatCurrency(Math.abs(value))}`
    cls = value >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
  } else {
    display = formatCurrency(value)
    cls = 'text-alpha-navy-800 dark:text-white'
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-alpha-blue-700 dark:text-alpha-blue-300">{label}</span>
      <span className={`tabular-nums font-bold ${cls}`}>{display}</span>
    </div>
  )
}
