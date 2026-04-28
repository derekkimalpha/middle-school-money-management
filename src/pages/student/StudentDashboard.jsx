import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Send, DollarSign, CreditCard, Phone, BookOpen } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { useNetWorthHistory } from '../../hooks/useNetWorthHistory'
import { NetWorthChart } from '../../components/student/NetWorthChart'
import { PaycheckCard } from '../../components/student/PaycheckCard'
import { AnimNum } from '../../components/shared'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

// Account display order + labels for the simplified dashboard.
// Roth IRA and "bonus" intentionally excluded — see simplification spec.
const ACCOUNT_ROWS = [
  { key: 'checking', label: 'Checking', subtitle: 'Spending account' },
  { key: 'savings',  label: 'Savings',  subtitle: '4.00% APY' },
  { key: 'sp500',    label: 'S&P 500',  subtitle: 'Top 500 U.S. companies' },
  { key: 'nasdaq',   label: 'NASDAQ',   subtitle: 'Tech & growth' },
]

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts, loading: accountsLoading } = useAccounts(profile?.id)
  const { history, loading: historyLoading } = useNetWorthHistory(profile?.id, 60)

  const [todaysReturns, setTodaysReturns] = useState({}) // { sp500: 0.0043, nasdaq: 0.0062 }
  const [recent, setRecent] = useState([])

  // Pull today's market percentages so we can label the rows.
  useEffect(() => {
    supabase
      .from('market_prices')
      .select('sp500_pct, nasdaq_pct, date')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTodaysReturns({ sp500: Number(data.sp500_pct || 0), nasdaq: Number(data.nasdaq_pct || 0) })
      })
  }, [])

  // Last 5 transactions for the activity feed.
  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('transactions')
      .select('id, amount, description, created_at, category')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecent(data)
      })
  }, [profile?.id])

  if (accountsLoading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="w-10 h-10 border-3 border-stone-200 dark:border-white/10 border-t-sage dark:border-t-sage rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  const totalBalance = ACCOUNT_ROWS.reduce((sum, row) => sum + (accounts[row.key] || 0), 0)
  const firstName = profile?.full_name?.split(' ')[0] || 'Friend'

  // Today's delta = sum of today's market_return + interest transactions.
  const today = new Date().toISOString().slice(0, 10)
  const todayDelta = recent
    .filter((t) => (t.created_at || '').slice(0, 10) === today &&
                   (t.category === 'market_return' || t.category === 'interest'))
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const todayPct = totalBalance > 0 ? (todayDelta / (totalBalance - todayDelta)) * 100 : 0

  return (
    <div className="pb-12 max-w-3xl mx-auto px-8">
      {/* ── Header: greeting + net worth + today's delta ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-6 pb-2"
      >
        <p className="text-[13px] text-ink-muted dark:text-white/45 mb-1">Hi {firstName}</p>
        <p className="text-[12px] uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 mb-2">Net worth</p>
        <h1 className="text-5xl font-black tabular-nums tracking-tight text-ink dark:text-chalk-white">
          <AnimNum value={totalBalance} prefix="$" />
        </h1>
        {todayDelta !== 0 && (
          <p className={`mt-2 text-[13px] font-semibold flex items-center gap-1 ${todayDelta >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose'}`}>
            {todayDelta >= 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
            {todayDelta >= 0 ? '+' : ''}{formatCurrency(todayDelta)} today
            {!Number.isNaN(todayPct) && (
              <span className="text-ink-muted dark:text-white/45 font-normal ml-1">
                ({todayPct >= 0 ? '+' : ''}{todayPct.toFixed(2)}%)
              </span>
            )}
          </p>
        )}
      </motion.div>

      {/* ── Performance chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="my-6"
      >
        <NetWorthChart history={history} currentTotal={totalBalance} height={110} />
      </motion.div>

      {/* ── This week's paycheck ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-6"
      >
        <PaycheckCard studentId={profile.id} />
      </motion.div>

      {/* ── Accounts (4 rows) ── */}
      <div className="mb-6">
        {ACCOUNT_ROWS.map((row, i) => {
          const balance = accounts[row.key] || 0
          const todayPct = row.key === 'sp500' ? todaysReturns.sp500
                         : row.key === 'nasdaq' ? todaysReturns.nasdaq
                         : null
          const todayPctDisplay = todayPct != null && todayPct !== 0
            ? `${todayPct >= 0 ? '+' : ''}${(todayPct * 100).toFixed(2)}% today`
            : null
          return (
            <motion.div
              key={row.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className={`flex items-center justify-between py-3.5 ${i < ACCOUNT_ROWS.length - 1 ? 'border-b border-black/[0.06] dark:border-white/[0.06]' : ''}`}
            >
              <div>
                <p className="text-[14px] text-ink dark:text-chalk-white">{row.label}</p>
                <p className={`text-[12px] mt-0.5 ${todayPctDisplay ? (todayPct >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose') : 'text-ink-faint dark:text-white/30'}`}>
                  {todayPctDisplay || row.subtitle}
                </p>
              </div>
              <p className="text-[14px] font-bold tabular-nums text-ink dark:text-chalk-white">
                {formatCurrency(balance)}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/transfer')}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold transition-colors hover:bg-ink/90 dark:hover:bg-chalk-white/90"
        >
          <Send className="w-4 h-4" />
          Transfer
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/cash-out')}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white dark:bg-white/[0.03] border border-black/[0.1] dark:border-white/[0.1] text-ink dark:text-chalk-white text-[13px] font-bold hover:border-black/[0.2] dark:hover:border-white/[0.2] transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          Cash Out
        </motion.button>
      </div>

      {/* ── Recent activity ── */}
      {recent.length > 0 && (
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted dark:text-white/40 pb-2 border-b border-black/[0.06] dark:border-white/[0.06] mb-1">
            Recent activity
          </p>
          {recent.map((tx, i) => {
            const amount = Number(tx.amount || 0)
            const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
            const color = amount >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-ink dark:text-chalk-white'
            const date = tx.created_at
              ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''
            return (
              <div key={tx.id} className={`flex justify-between items-center py-3 ${i < recent.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : ''}`}>
                <div>
                  <p className="text-[13px] text-ink dark:text-chalk-white">{tx.description || tx.category}</p>
                  <p className="text-[11px] text-ink-faint dark:text-white/30 mt-0.5">{date}</p>
                </div>
                <p className={`text-[13px] font-bold tabular-nums ${color}`}>
                  {sign}{formatCurrency(Math.abs(amount))}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Cash Card panel (instructions only) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="rounded-xl p-5 bg-amber-bg/60 dark:bg-amber/[0.04] border border-amber/30 dark:border-amber/20"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-amber/15 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber/80 mb-0.5">Your Cash Card</p>
            <p className="text-[12px] leading-relaxed text-ink-light dark:text-white/60">
              You have a physical Cash Card with money loaded from earlier sessions. It's separate from My Money and yours forever. Check the balance whenever you need to spend it:
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-white/[0.04] p-3 mt-3 border border-amber/15 dark:border-amber/10 space-y-1.5 text-[12px]">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-amber flex-shrink-0" />
            <span className="text-ink-light dark:text-white/60">Call</span>
            <a href="tel:18668820410" className="font-bold tabular-nums text-ink dark:text-chalk-white hover:text-amber">
              1-866-882-0410
            </a>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber flex-shrink-0" />
            <span className="text-ink-light dark:text-white/60">Visit</span>
            <a
              href="https://cardholder.virtualrewardcenter.com/home/activate"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-ink dark:text-chalk-white hover:text-amber underline-offset-2 hover:underline"
            >
              cardholder.virtualrewardcenter.com
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
