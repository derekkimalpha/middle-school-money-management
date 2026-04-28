import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, Send, DollarSign, Banknote,
  CreditCard, Phone, BookOpen, Wallet, PiggyBank, TrendingUp, BarChart3,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { useNetWorthHistory } from '../../hooks/useNetWorthHistory'
import { NetWorthChart } from '../../components/student/NetWorthChart'
import { PaycheckCard } from '../../components/student/PaycheckCard'
import { SplitBalance } from '../../components/student/SplitBalance'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

const ACCOUNT_ROWS = [
  { key: 'checking', label: 'Checking', icon: Wallet,     accent: '#7c8c78' },
  { key: 'savings',  label: 'Savings',  icon: PiggyBank,  accent: '#6b8a87' },
  { key: 'sp500',    label: 'S&P 500',  icon: TrendingUp, accent: '#a68b5b' },
  { key: 'nasdaq',   label: 'NASDAQ',   icon: BarChart3,  accent: '#78716c' },
]

const TIME_RANGES = ['1W', '1M', '3M', 'ALL']

// Stagger entrance variants
const containerV = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}
const itemV = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts, loading: accountsLoading } = useAccounts(profile?.id)
  const { history } = useNetWorthHistory(profile?.id, 365)

  const [range, setRange] = useState('1M')
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

  // Today's delta from market_return + interest categories.
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

  if (accountsLoading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="w-10 h-10 border-3 border-stone-200 dark:border-white/10 border-t-pencil rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Friend'

  return (
    <motion.div
      variants={containerV}
      initial="hidden"
      animate="show"
      className="pb-12 max-w-3xl mx-auto px-5 md:px-8"
    >
      {/* ── Greeting ── */}
      <motion.div variants={itemV} className="pt-7 pb-3">
        <p className="text-[14px] text-ink-muted dark:text-white/45">Hi {firstName}</p>
      </motion.div>

      {/* ── Hero card: yellow pencil accent, big balance, action pills ── */}
      <motion.div
        variants={itemV}
        className="rounded-3xl p-6 md:p-7 bg-pencil/95 dark:bg-pencil/90 text-ink shadow-[0_2px_0_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-start justify-between mb-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/60 font-bold">
            Net worth
          </p>
          {todayDelta !== 0 && (
            <span className={`flex items-center gap-1 text-[12px] font-semibold ${todayDelta >= 0 ? 'text-ink' : 'text-ink'}`}>
              {todayDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {todayDelta >= 0 ? '+' : ''}{formatCurrency(todayDelta)} today
            </span>
          )}
        </div>

        <SplitBalance
          value={totalBalance}
          className="text-[44px] md:text-[56px] font-black leading-[1.05] tracking-tight text-ink"
          centsClassName="text-ink"
        />

        {todayDelta !== 0 && !Number.isNaN(todayPct) && todayPct !== 0 && (
          <p className="text-[12px] mt-1 text-ink/55">
            {todayPct >= 0 ? '+' : ''}{todayPct.toFixed(2)}% today
          </p>
        )}

        {/* Action pills */}
        <div className="flex items-center gap-2 mt-5">
          <ActionPill label="Paycheck" icon={Banknote} onClick={() => navigate('/paycheck')} />
          <ActionPill label="Transfer" icon={Send}     onClick={() => navigate('/transfer')} />
          <ActionPill label="Cash Out" icon={DollarSign} onClick={() => navigate('/cash-out')} />
        </div>
      </motion.div>

      {/* ── Account mini-cards (4 in a row) ── */}
      <motion.div variants={itemV} className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {ACCOUNT_ROWS.map((row) => {
          const Icon = row.icon
          const balance = accounts[row.key] || 0
          const todayPctVal = row.key === 'sp500' ? todaysReturns.sp500
                            : row.key === 'nasdaq' ? todaysReturns.nasdaq
                            : null
          const showPct = todayPctVal != null && todayPctVal !== 0
          return (
            <motion.div
              key={row.key}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="rounded-2xl p-4 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${row.accent}1f` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: row.accent }} />
                </div>
                {showPct && (
                  <span className={`text-[11px] font-semibold ${todayPctVal >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose'}`}>
                    {todayPctVal >= 0 ? '+' : ''}{(todayPctVal * 100).toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-muted dark:text-white/45 mb-0.5">{row.label}</p>
              <SplitBalance
                value={balance}
                duration={700}
                className="text-[18px] font-bold text-ink dark:text-chalk-white"
              />
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Allocation bar ── */}
      {totalBalance > 0 && (
        <motion.div
          variants={itemV}
          className="mt-5 rounded-2xl p-5 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]"
        >
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 font-bold">Allocation</p>
            <p className="text-[11px] text-ink-muted dark:text-white/40">
              Cash <span className="font-semibold text-ink dark:text-chalk-white tabular-nums">
                {(((accounts.checking + accounts.savings) / totalBalance) * 100).toFixed(0)}%
              </span>
              {' '}·{' '}
              Invested <span className="font-semibold text-ink dark:text-chalk-white tabular-nums">
                {(((accounts.sp500 + accounts.nasdaq) / totalBalance) * 100).toFixed(0)}%
              </span>
            </p>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-paper-warm dark:bg-white/[0.05]">
            {ACCOUNT_ROWS.map((row) => {
              const pct = ((accounts[row.key] || 0) / totalBalance) * 100
              if (pct === 0) return null
              return (
                <motion.div
                  key={row.key}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  style={{ backgroundColor: row.accent }}
                  title={`${row.label} · ${pct.toFixed(0)}%`}
                />
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── Net worth histogram ── */}
      <motion.div
        variants={itemV}
        className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 font-bold">
            Net worth over time
          </p>
          <div className="flex gap-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  range === r
                    ? 'bg-ink text-white dark:bg-pencil dark:text-ink'
                    : 'text-ink-muted dark:text-white/40 hover:bg-paper-warm dark:hover:bg-white/[0.04]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="px-3 pb-4">
          <NetWorthChart history={history} currentTotal={totalBalance} range={range} height={170} />
        </div>
      </motion.div>

      {/* ── This week's paycheck ── */}
      <motion.div variants={itemV} className="mt-5">
        <PaycheckCard studentId={profile.id} />
      </motion.div>

      {/* ── Recent activity ── */}
      {recent.length > 0 && (
        <motion.div
          variants={itemV}
          className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] overflow-hidden"
        >
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 px-5 pt-4 pb-2 font-bold">
            Recent activity
          </p>
          <motion.div variants={containerV} initial="hidden" animate="show">
            {recent.map((tx, i) => {
              const amount = Number(tx.amount || 0)
              const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
              const color = amount >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose'
              const date = tx.created_at
                ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''
              return (
                <motion.div
                  key={tx.id}
                  variants={itemV}
                  className={`flex justify-between items-center px-5 py-3.5 ${i < recent.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : ''}`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-[13px] text-ink dark:text-chalk-white truncate">{tx.description || tx.category}</p>
                    <p className="text-[11px] text-ink-faint dark:text-white/30 mt-0.5">{date}</p>
                  </div>
                  <p className={`text-[13px] font-bold tabular-nums ${color}`}>
                    {sign}{formatCurrency(Math.abs(amount))}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      )}

      {/* ── Cash Card panel ── */}
      <motion.div
        variants={itemV}
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
    </motion.div>
  )
}

const ActionPill = ({ label, icon: Icon, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    whileHover={{ y: -1 }}
    onClick={onClick}
    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl bg-ink/[0.06] hover:bg-ink/[0.12] text-ink transition-colors"
  >
    <Icon className="w-4 h-4" strokeWidth={2.4} />
    <span className="text-[11px] font-semibold">{label}</span>
  </motion.button>
)
