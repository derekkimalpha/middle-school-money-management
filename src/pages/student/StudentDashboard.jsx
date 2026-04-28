import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, Send, DollarSign, CreditCard, Phone, BookOpen,
  Wallet, PiggyBank, TrendingUp, BarChart3, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { useNetWorthHistory } from '../../hooks/useNetWorthHistory'
import { NetWorthChart } from '../../components/student/NetWorthChart'
import { PaycheckCard } from '../../components/student/PaycheckCard'
import { AnimNum } from '../../components/shared'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

const ACCOUNT_ROWS = [
  { key: 'checking', label: 'Checking', subtitle: 'Spending account', icon: Wallet,     accent: '#7c8c78' },
  { key: 'savings',  label: 'Savings',  subtitle: '4.00% APY',         icon: PiggyBank,  accent: '#6b8a87' },
  { key: 'sp500',    label: 'S&P 500',  subtitle: '500 U.S. companies', icon: TrendingUp, accent: '#a68b5b' },
  { key: 'nasdaq',   label: 'NASDAQ',   subtitle: 'Tech & growth',      icon: BarChart3,  accent: '#78716c' },
]

const TIME_RANGES = ['1W', '1M', '3M', 'ALL']

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts, loading: accountsLoading } = useAccounts(profile?.id)
  const { history } = useNetWorthHistory(profile?.id, 365)

  const [range, setRange] = useState('ALL')
  const [todaysReturns, setTodaysReturns] = useState({})
  const [recent, setRecent] = useState([])

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

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('transactions')
      .select('id, amount, description, created_at, category')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setRecent(data)
      })
  }, [profile?.id])

  const totalBalance = useMemo(() => {
    if (!accounts) return 0
    return ACCOUNT_ROWS.reduce((sum, row) => sum + (accounts[row.key] || 0), 0)
  }, [accounts])

  // Today's delta = today's market_return + interest transactions.
  const todayDelta = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return recent
      .filter((t) => (t.created_at || '').slice(0, 10) === today &&
                     (t.category === 'market_return' || t.category === 'interest'))
      .reduce((s, t) => s + Number(t.amount || 0), 0)
  }, [recent])

  const todayPct = totalBalance > 0 && totalBalance - todayDelta > 0
    ? (todayDelta / (totalBalance - todayDelta)) * 100
    : 0

  // Range delta = (current total) − (first point in selected range).
  const rangeDelta = useMemo(() => {
    if (!history || history.length === 0) return 0
    let series = history
    if (range !== 'ALL') {
      const days = range === '1W' ? 7 : range === '1M' ? 30 : 90
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      const cutoffStr = cutoff.toISOString().slice(0, 10)
      series = history.filter((h) => h.date >= cutoffStr)
    }
    if (series.length === 0) return 0
    const start = series[0].total
    return totalBalance - start
  }, [history, range, totalBalance])

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

  const firstName = profile?.full_name?.split(' ')[0] || 'Friend'
  const isUp = rangeDelta >= 0

  return (
    <div className="pb-12 max-w-3xl mx-auto px-6 md:px-8">
      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="pt-7 pb-2"
      >
        <p className="text-[14px] text-ink-muted dark:text-white/45">Hi {firstName}</p>
      </motion.div>

      {/* ── Hero card: Net worth + chart + time toggle ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="rounded-2xl p-6 md:p-7 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted dark:text-white/40 mb-2 font-semibold">
          Net worth
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[44px] md:text-5xl font-black tabular-nums tracking-tight text-ink dark:text-chalk-white leading-none">
            <AnimNum value={totalBalance} prefix="$" />
          </h1>
          {todayDelta !== 0 && (
            <span className={`text-[13px] font-semibold flex items-center gap-1 ${todayDelta >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose'}`}>
              {todayDelta >= 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
              {todayDelta >= 0 ? '+' : ''}{formatCurrency(todayDelta)} today
              {!Number.isNaN(todayPct) && todayPct !== 0 && (
                <span className="text-ink-muted dark:text-white/45 font-normal ml-0.5">
                  ({todayPct >= 0 ? '+' : ''}{todayPct.toFixed(2)}%)
                </span>
              )}
            </span>
          )}
        </div>

        {/* Range delta */}
        {rangeDelta !== 0 && (
          <p className={`text-[12px] mt-1 ${isUp ? 'text-sage-dark dark:text-sage-300' : 'text-rose'}`}>
            {isUp ? '+' : ''}{formatCurrency(rangeDelta)} <span className="text-ink-faint dark:text-white/30">over {range === 'ALL' ? 'all time' : `last ${range}`}</span>
          </p>
        )}

        {/* Chart */}
        <div className="my-5 -mx-2">
          <NetWorthChart history={history} currentTotal={totalBalance} range={range} height={150} />
        </div>

        {/* Time-range toggle */}
        <div className="flex items-center justify-between gap-2">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                range === r
                  ? 'bg-ink text-white dark:bg-pencil dark:text-ink'
                  : 'text-ink-muted dark:text-white/40 hover:bg-paper-warm dark:hover:bg-white/[0.04]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Asset allocation bar ── */}
      {totalBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-5 rounded-2xl p-5 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]"
        >
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 mb-3 font-semibold">
            Allocation
          </p>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-paper-warm dark:bg-white/[0.05]">
            {ACCOUNT_ROWS.map((row) => {
              const pct = ((accounts[row.key] || 0) / totalBalance) * 100
              if (pct === 0) return null
              return (
                <div
                  key={row.key}
                  style={{ width: `${pct}%`, backgroundColor: row.accent }}
                  title={`${row.label} · ${pct.toFixed(0)}%`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {ACCOUNT_ROWS.map((row) => {
              const pct = ((accounts[row.key] || 0) / totalBalance) * 100
              if (pct === 0) return null
              return (
                <div key={row.key} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.accent }} />
                  <span className="text-[11px] text-ink-light dark:text-white/55">
                    {row.label} <span className="text-ink-faint dark:text-white/30">{pct.toFixed(0)}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── This week's paycheck ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-5"
      >
        <PaycheckCard studentId={profile.id} />
      </motion.div>

      {/* ── Accounts card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] overflow-hidden"
      >
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 px-5 pt-4 pb-2 font-semibold">
          Accounts
        </p>
        {ACCOUNT_ROWS.map((row, i) => {
          const balance = accounts[row.key] || 0
          const Icon = row.icon
          const todayPctVal = row.key === 'sp500' ? todaysReturns.sp500
                            : row.key === 'nasdaq' ? todaysReturns.nasdaq
                            : null
          const showPct = todayPctVal != null && todayPctVal !== 0
          const pctDisplay = showPct
            ? `${todayPctVal >= 0 ? '+' : ''}${(todayPctVal * 100).toFixed(2)}% today`
            : null
          return (
            <div
              key={row.key}
              className={`flex items-center gap-3 px-5 py-4 ${i < ACCOUNT_ROWS.length - 1 ? 'border-b border-black/[0.05] dark:border-white/[0.04]' : ''}`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${row.accent}1a` }}
              >
                <Icon className="w-4 h-4" style={{ color: row.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-ink dark:text-chalk-white">{row.label}</p>
                <p className={`text-[12px] mt-0.5 ${
                  showPct
                    ? (todayPctVal >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose')
                    : 'text-ink-faint dark:text-white/35'
                }`}>
                  {pctDisplay || row.subtitle}
                </p>
              </div>
              <p className="text-[15px] font-bold tabular-nums text-ink dark:text-chalk-white">
                {formatCurrency(balance)}
              </p>
            </div>
          )
        })}
      </motion.div>

      {/* ── Action buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-2 gap-3 mt-5"
      >
        <button
          onClick={() => navigate('/transfer')}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-ink dark:bg-pencil text-white dark:text-ink text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          Transfer
        </button>
        <button
          onClick={() => navigate('/cash-out')}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.1] dark:border-white/[0.1] text-ink dark:text-chalk-white text-[13px] font-bold hover:border-black/[0.2] dark:hover:border-white/[0.2] transition-all active:scale-[0.98]"
        >
          <DollarSign className="w-4 h-4" />
          Cash Out
        </button>
      </motion.div>

      {/* ── Recent activity card ── */}
      {recent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] overflow-hidden"
        >
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 px-5 pt-4 pb-2 font-semibold">
            Recent activity
          </p>
          {recent.map((tx, i) => {
            const amount = Number(tx.amount || 0)
            const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
            const color = amount >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose dark:text-rose'
            const date = tx.created_at
              ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''
            return (
              <div
                key={tx.id}
                className={`flex justify-between items-center px-5 py-3.5 ${i < recent.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-ink dark:text-chalk-white truncate">{tx.description || tx.category}</p>
                  <p className="text-[11px] text-ink-faint dark:text-white/30 mt-0.5">{date}</p>
                </div>
                <p className={`text-[13px] font-bold tabular-nums ${color}`}>
                  {sign}{formatCurrency(Math.abs(amount))}
                </p>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* ── Cash Card panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-5 rounded-2xl p-5 bg-amber-bg/60 dark:bg-amber/[0.05] border border-amber/30 dark:border-amber/20"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber/15 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber/80 mb-0.5">Your Cash Card</p>
            <p className="text-[12px] leading-relaxed text-ink-light dark:text-white/60">
              Physical card with money from earlier sessions. Separate from My Money and yours forever. Check the balance whenever you need to spend it:
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white/70 dark:bg-white/[0.04] p-3 mt-3 border border-amber/15 dark:border-amber/10 space-y-1.5 text-[12px]">
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
