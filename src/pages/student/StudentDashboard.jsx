import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, Send, DollarSign,
  CreditCard, Phone, BookOpen, Wallet, PiggyBank, TrendingUp, BarChart3,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { useGrowthLog } from '../../hooks/useGrowthLog'
import { useNetWorthHistory } from '../../hooks/useNetWorthHistory'
import { NetWorthChart } from '../../components/student/NetWorthChart'
import { PaycheckCard } from '../../components/student/PaycheckCard'
import { UnfilledPaychecksList } from '../../components/student/UnfilledPaychecksList'
import { SplitBalance } from '../../components/student/SplitBalance'
import { HowXpWorks } from '../../components/student/HowXpWorks'
import { EarningsBreakdown } from '../../components/student/EarningsBreakdown'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { formatTxLabel } from '../../lib/txLabels'

const CASH_ROWS = [
  { key: 'checking', label: 'Checking', subtitle: 'Spending account',          icon: Wallet,    accent: '#1F6FEB' },
  { key: 'savings',  label: 'Savings',  subtitle: '4.00% APY · paid daily',    icon: PiggyBank, accent: '#114290' },
]

const INVEST_ROWS = [
  { key: 'sp500',  label: 'S&P 500', subtitle: '500 U.S. companies · updates daily', icon: TrendingUp, accent: '#1856B7' },
  { key: 'nasdaq', label: 'NASDAQ',  subtitle: 'Tech & growth · updates daily',      icon: BarChart3,  accent: '#0B3068' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts, loading } = useAccounts(profile?.id)
  const { history } = useNetWorthHistory(profile?.id, 90)
  const growth = useGrowthLog(profile?.id)

  const [todaysReturns, setTodaysReturns] = useState({})
  const [recent, setRecent] = useState([])
  const [monthInterest, setMonthInterest] = useState({ thisMonth: 0, ytd: 0 })
  const [currentSession, setCurrentSession] = useState(null)
  const [currentWeek, setCurrentWeek] = useState(1)

  // Get current session info
  useEffect(() => {
    supabase
      .from('sessions')
      .select('id, name, start_date')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCurrentSession(data)
          // Calculate current week number (1-indexed) from start_date
          const startDate = new Date(data.start_date)
          const now = new Date()
          const weekDiff = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
          setCurrentWeek(Math.max(1, weekDiff))
        }
      })
  }, [])

  // Today's market %
  useEffect(() => {
    supabase
      .from('market_prices')
      .select('sp500_pct, nasdaq_pct, date')
      .order('date', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) setTodaysReturns({ sp500: Number(data.sp500_pct || 0), nasdaq: Number(data.nasdaq_pct || 0) })
      })
  }, [])

  // Recent activity
  useEffect(() => {
    if (!profile?.id) return
    supabase.from('transactions')
      .select('id, amount, description, created_at, category')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setRecent(data) })
  }, [profile?.id])

  // Monthly + YTD interest summary
  useEffect(() => {
    if (!profile?.id) return
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
    supabase.from('transactions')
      .select('amount, created_at')
      .eq('student_id', profile.id)
      .eq('category', 'interest')
      .gte('created_at', yearStart)
      .then(({ data }) => {
        if (!data) return
        let thisMonth = 0, ytd = 0
        for (const t of data) {
          const amt = Number(t.amount || 0)
          ytd += amt
          if (t.created_at >= monthStart) thisMonth += amt
        }
        setMonthInterest({
          thisMonth: Math.round(thisMonth * 100) / 100,
          ytd: Math.round(ytd * 100) / 100,
        })
      })
  }, [profile?.id])

  const allRows = [...CASH_ROWS, ...INVEST_ROWS]
  const totalBalance = useMemo(
    () => accounts ? allRows.reduce((s, r) => s + (accounts[r.key] || 0), 0) : 0,
    [accounts]
  )
  const cashTotal = (accounts?.checking || 0) + (accounts?.savings || 0)
  const investTotal = (accounts?.sp500 || 0) + (accounts?.nasdaq || 0)

  const todayDelta = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return recent
      .filter((t) => (t.created_at || '').slice(0, 10) === today &&
                     (t.category === 'market_return' || t.category === 'interest'))
      .reduce((s, t) => s + Number(t.amount || 0), 0)
  }, [recent])

  if (loading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-alpha-blue-50">
        <motion.div
          className="w-10 h-10 border-[3px] border-alpha-blue-500 border-t-alpha-blue-300 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-alpha-blue-50 dark:bg-[#0c100c]">
      <div className="pb-16 max-w-6xl mx-auto px-5 md:px-8 pt-7">

        {/* ── Welcome hero card: Big bold modern style ── */}
        <motion.div
          {...fadeUp(0)}
          className="rounded-3xl p-6 md:p-8 bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft-lg"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] uppercase tracking-[0.15em] text-alpha-blue-600 dark:text-alpha-blue-400 font-black mb-3">
                Welcome, {profile?.first_name || 'Student'}
              </p>
              <SplitBalance
                value={totalBalance}
                className="text-[56px] md:text-[72px] font-black leading-[1] tracking-[-0.02em] text-alpha-navy-800 dark:text-white"
                centsClassName=""
              />
              <p className="text-[13px] mt-2 text-alpha-blue-700 dark:text-alpha-blue-300 font-semibold">Total net worth</p>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {todayDelta !== 0 && (
                  <span className={`flex items-center gap-1 text-[13px] font-bold px-3 py-1.5 rounded-full ${todayDelta >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                    {todayDelta >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {todayDelta >= 0 ? '+' : ''}{formatCurrency(todayDelta)} today
                  </span>
                )}
                {growth.total > 0 && (
                  <span className="text-[12px] font-bold text-alpha-blue-700 dark:text-alpha-blue-300">
                    <span className="text-emerald-700 dark:text-emerald-400">+{formatCurrency(growth.total)}</span> earned all-time
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:max-w-md md:flex-shrink-0">
              <button
                onClick={() => navigate('/transfer')}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-alpha-blue-500 text-white shadow-soft text-[14px] font-bold hover:bg-alpha-blue-600 transition-all"
              >
                <Send className="w-4 h-4" strokeWidth={2.6} />
                Transfer
              </button>
              <button
                onClick={() => navigate('/cash-out')}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-alpha-blue-100 text-alpha-blue-700 hover:bg-alpha-blue-200 shadow-soft text-[14px] font-bold transition-all"
              >
                <DollarSign className="w-4 h-4" strokeWidth={2.6} />
                Cash Out
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Account Cards: Debit-card style (2 wide on desktop, stacked on mobile) ── */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Cash Card - Alpha Blue Gradient */}
          <motion.div
            {...fadeUp(0.06)}
            className="rounded-2xl p-6 bg-gradient-to-br from-alpha-blue-500 to-alpha-blue-700 text-white shadow-soft-lg relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
            </div>
            <div className="relative z-10">
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/70 font-bold mb-12">Cash</p>
              <p className="text-[14px] font-semibold text-white/80 mb-2">Checking & Savings</p>
              <SplitBalance
                value={cashTotal}
                className="text-[40px] font-black leading-tight"
                centsClassName="text-[24px]"
              />
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-[11px] text-white/70 font-semibold">
                <span>${(accounts?.checking || 0).toFixed(2)} Checking</span>
                <span>${(accounts?.savings || 0).toFixed(2)} Savings</span>
              </div>
            </div>
          </motion.div>

          {/* Invest Card - Accent Purple Gradient */}
          <motion.div
            {...fadeUp(0.10)}
            className="rounded-2xl p-6 bg-gradient-to-br from-accent-purple to-purple-700 text-white shadow-soft-lg relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
            </div>
            <div className="relative z-10">
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/70 font-bold mb-12">Invest</p>
              <p className="text-[14px] font-semibold text-white/80 mb-2">S&P 500 & NASDAQ</p>
              <SplitBalance
                value={investTotal}
                className="text-[40px] font-black leading-tight"
                centsClassName="text-[24px]"
              />
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-[11px] text-white/70 font-semibold">
                <span>${(accounts?.sp500 || 0).toFixed(2)} S&P 500</span>
                <span>${(accounts?.nasdaq || 0).toFixed(2)} NASDAQ</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Two-column body (single col on mobile) ── */}
        <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ─── LEFT: Chart + Earnings Breakdown ─── */}
        <div className="lg:col-span-2 space-y-5">

        {/* Chart card */}
        <motion.div
          {...fadeUp(0.14)}
          className="rounded-2xl p-6 bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft text-alpha-blue-600 dark:text-alpha-blue-300"
        >
          <p className="text-[12px] uppercase tracking-[0.15em] text-alpha-blue-700 dark:text-alpha-blue-400 font-bold mb-4">
            Net worth over time
          </p>
          <NetWorthChart history={history} currentTotal={totalBalance} height={240} />
        </motion.div>

        {/* Earnings breakdown */}
        <motion.div {...fadeUp(0.18)}>
          <EarningsBreakdown studentId={profile.id} />
        </motion.div>

        {/* Recent activity (lives on left col, more vertical room) */}
        {recent.length > 0 && (
          <motion.div
            {...fadeUp(0.42)}
            className="rounded-2xl bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft overflow-hidden"
          >
            <p className="text-[12px] uppercase tracking-[0.15em] text-alpha-blue-700 dark:text-alpha-blue-400 px-6 pt-5 pb-3 font-bold">
              Recent activity
            </p>
            {recent.map((tx, i) => {
              const amount = Number(tx.amount || 0)
              const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
              const isPositive = amount >= 0
              const date = tx.created_at
                ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''
              return (
                <div
                  key={tx.id}
                  className={`flex justify-between items-center px-6 py-3.5 ${i < recent.length - 1 ? 'border-b border-alpha-blue-100 dark:border-white/[0.06]' : ''}`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-[13px] font-semibold text-alpha-navy-800 dark:text-white truncate">{formatTxLabel(tx)}</p>
                    <p className="text-[11px] text-alpha-blue-600 dark:text-alpha-blue-400 mt-0.5">{date}</p>
                  </div>
                  <p className={`text-[13px] font-black tabular-nums ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {sign}{formatCurrency(Math.abs(amount))}
                  </p>
                </div>
              )
            })}
          </motion.div>
        )}

        </div>{/* end LEFT col */}

        {/* ─── RIGHT: Accounts + Paycheck + How XP + MAP + Cash Card ─── */}
        <div className="space-y-5">

        {/* ── Cash section ── */}
        <Section title="Cash" total={cashTotal} delay={0.21}>
          {CASH_ROWS.map((row) => (
            <AccountRow
              key={row.key}
              row={row}
              balance={accounts[row.key] || 0}
              earned={row.key === 'savings' ? growth.savings : 0}
              monthEarned={row.key === 'savings' ? monthInterest.thisMonth : 0}
              ytdEarned={row.key === 'savings' ? monthInterest.ytd : 0}
            />
          ))}
        </Section>

        {/* ── Investments section ── */}
        <Section title="Investments" total={investTotal} delay={0.28}>
          {INVEST_ROWS.map((row) => {
            const todayPct = row.key === 'sp500' ? todaysReturns.sp500
                            : row.key === 'nasdaq' ? todaysReturns.nasdaq
                            : null
            const earned = row.key === 'sp500' ? growth.sp500
                         : row.key === 'nasdaq' ? growth.nasdaq
                         : 0
            return (
              <AccountRow
                key={row.key}
                row={row}
                balance={accounts[row.key] || 0}
                todayPct={todayPct}
                earned={earned}
              />
            )
          })}
        </Section>

        {/* ── Unfilled Paychecks List ── */}
        {currentSession && (
          <UnfilledPaychecksList
            studentId={profile.id}
            currentSessionNumber={parseInt(currentSession.name.match(/\d+/)?.[0] || 5)}
            currentWeekNumber={currentWeek}
          />
        )}

        {/* ── This week's paycheck ── */}
        <motion.div {...fadeUp(0.35)} className="mt-5">
          <PaycheckCard studentId={profile.id} />
        </motion.div>

        {/* ── How XP earns money (collapsible) ── */}
        <motion.div {...fadeUp(0.39)} className="mt-3">
          <HowXpWorks />
        </motion.div>

        {/* ── MAP Testing / Roth IRA Card ── */}
        <motion.div
          {...fadeUp(0.43)}
          className="mt-3 rounded-2xl p-6 bg-alpha-blue-100 dark:bg-alpha-blue-900/30 border border-alpha-blue-300 shadow-soft"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-alpha-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg">🔒</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-[14px] font-bold text-alpha-navy-800 dark:text-white">Roth IRA</p>
                <span className="px-2.5 py-0.5 rounded-full bg-alpha-blue-400 text-white text-[10px] font-bold uppercase tracking-wider">Coming soon</span>
              </div>
              <p className="text-[12px] text-alpha-blue-800 dark:text-alpha-blue-200 font-semibold leading-snug">
                MAP testing payouts will land here — money that grows tax-free and stays locked until you graduate. Big assessments, big rewards.
              </p>
            </div>
          </div>
        </motion.div>

        </div>{/* end RIGHT col */}
        </div>{/* end body grid */}

        {/* ── Physical Cash Card Info Panel ── */}
        <motion.div
          {...fadeUp(0.49)}
          className="mt-7 rounded-2xl p-6 bg-accent-pink/10 dark:bg-accent-pink/5 border border-accent-pink/30 shadow-soft"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-lg bg-accent-pink flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wider text-accent-pink mb-0.5">Your Physical Cash Card</p>
              <p className="text-[13px] leading-relaxed text-alpha-navy-800 dark:text-alpha-blue-100 font-semibold">
                Separate card for money from earlier sessions. Check the balance when you need to spend it:
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white dark:bg-white/[0.05] p-4 space-y-2.5 text-[12px]">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-accent-pink flex-shrink-0" strokeWidth={2.4} />
              <span className="text-alpha-blue-700 dark:text-alpha-blue-300 font-semibold">Call</span>
              <a href="tel:18668820410" className="font-bold tabular-nums text-alpha-blue-600 dark:text-alpha-blue-300 hover:text-accent-pink">
                1-866-882-0410
              </a>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-accent-pink flex-shrink-0" strokeWidth={2.4} />
              <span className="text-alpha-blue-700 dark:text-alpha-blue-300 font-semibold">Visit</span>
              <a
                href="https://cardholder.virtualrewardcenter.com/home/activate"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] font-bold text-alpha-blue-600 dark:text-alpha-blue-300 hover:text-accent-pink underline-offset-2 hover:underline"
              >
                cardholder.virtualrewardcenter.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────

const Section = ({ title, total, delay = 0, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft overflow-hidden"
  >
    <div className="flex items-baseline justify-between px-6 pt-5 pb-4 border-b border-alpha-blue-100">
      <h2 className="text-[18px] font-bold tracking-tight text-alpha-navy-800 dark:text-white">{title}</h2>
      <SplitBalance
        value={total}
        className="text-[16px] font-bold text-alpha-navy-800 dark:text-white"
      />
    </div>
    <div className="px-6 py-3">{children}</div>
  </motion.div>
)

const AccountRow = ({ row, balance, todayPct = null, earned = 0, monthEarned = 0, ytdEarned = 0 }) => {
  const Icon = row.icon
  const showPct = todayPct != null && todayPct !== 0
  const showEarned = earned > 0
  const showMonthly = monthEarned > 0
  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="flex items-center gap-3 py-3.5 cursor-default group"
    >
      <motion.div
        whileHover={{ rotate: -3, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-soft-sm"
        style={{ backgroundColor: row.accent }}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2.6} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold tracking-tight text-alpha-navy-800 dark:text-white">{row.label}</p>
        <p className="text-[12px] mt-0.5 flex items-center gap-1.5 flex-wrap font-semibold">
          <span className={
            showPct
              ? (todayPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')
              : 'text-alpha-blue-700 dark:text-alpha-blue-400'
          }>
            {showPct
              ? `${todayPct >= 0 ? '+' : ''}${(todayPct * 100).toFixed(2)}% today`
              : row.subtitle}
          </span>
          {showMonthly && (
            <>
              <span className="text-alpha-blue-300 dark:text-alpha-blue-600">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                +{formatCurrency(monthEarned)} this month
              </span>
            </>
          )}
          {!showMonthly && showEarned && (
            <>
              <span className="text-alpha-blue-300 dark:text-alpha-blue-600">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                +{formatCurrency(earned)} earned
              </span>
            </>
          )}
        </p>
      </div>
      <SplitBalance
        value={balance}
        className="text-[16px] font-bold text-alpha-navy-800 dark:text-white"
      />
    </motion.div>
  )
}
