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
import { SplitBalance } from '../../components/student/SplitBalance'
import { HowXpWorks } from '../../components/student/HowXpWorks'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

const CASH_ROWS = [
  { key: 'checking', label: 'Checking', subtitle: 'Spending account', icon: Wallet,    accent: '#1F6FEB' },
  { key: 'savings',  label: 'Savings',  subtitle: '4.00% APY',         icon: PiggyBank, accent: '#114290' },
]

const INVEST_ROWS = [
  { key: 'sp500',  label: 'S&P 500', subtitle: '500 U.S. companies', icon: TrendingUp, accent: '#1856B7' },
  { key: 'nasdaq', label: 'NASDAQ',  subtitle: 'Tech & growth',      icon: BarChart3,  accent: '#0B3068' },
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
      <div className="flex items-center justify-center h-screen bg-cream">
        <motion.div
          className="w-10 h-10 border-[3px] border-black border-t-cobalt-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0c100c]">
      <div className="pb-16 max-w-2xl mx-auto px-5 md:px-8 pt-7">

        {/* ── Hero card: chunky cobalt ── */}
        <motion.div
          {...fadeUp(0)}
          className="rounded-2xl p-6 md:p-7 bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-black/55 dark:text-white/50 font-black mb-2">
            Net worth
          </p>
          <SplitBalance
            value={totalBalance}
            className="text-[48px] md:text-[60px] font-black leading-[1] tracking-[-0.02em] text-black dark:text-white"
            centsClassName=""
          />
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {todayDelta !== 0 && (
              <span className={`flex items-center gap-1 text-[13px] font-bold px-2.5 py-1 rounded-full border-[2px] border-black ${todayDelta >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                {todayDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {todayDelta >= 0 ? '+' : ''}{formatCurrency(todayDelta)} today
              </span>
            )}
            {growth.total > 0 && (
              <span className="text-[12px] font-bold text-black/65 dark:text-white/55">
                <span className="text-emerald-700 dark:text-emerald-400">+{formatCurrency(growth.total)}</span> earned all-time
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Action buttons (press-in) ── */}
        <motion.div {...fadeUp(0.07)} className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={() => navigate('/transfer')}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cobalt-400 text-white border-[3px] border-black shadow-gum text-[14px] font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-gum-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-gum-pressed transition-all"
          >
            <Send className="w-4 h-4" strokeWidth={2.6} />
            Transfer
          </button>
          <button
            onClick={() => navigate('/cash-out')}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-black border-[3px] border-black shadow-gum text-[14px] font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-gum-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-gum-pressed transition-all"
          >
            <DollarSign className="w-4 h-4" strokeWidth={2.6} />
            Cash Out
          </button>
        </motion.div>

        {/* ── Chart card ── */}
        <motion.div
          {...fadeUp(0.14)}
          className="mt-5 rounded-2xl p-5 bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum text-cobalt-500 dark:text-cobalt-200"
        >
          <p className="text-[11px] uppercase tracking-[0.15em] text-black/55 dark:text-white/50 font-black mb-3">
            Net worth over time
          </p>
          <NetWorthChart history={history} currentTotal={totalBalance} height={200} />
        </motion.div>

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

        {/* ── This week's paycheck ── */}
        <motion.div {...fadeUp(0.35)} className="mt-5">
          <PaycheckCard studentId={profile.id} />
        </motion.div>

        {/* ── How XP earns money (collapsible) ── */}
        <motion.div {...fadeUp(0.39)} className="mt-3">
          <HowXpWorks />
        </motion.div>

        {/* ── Recent activity ── */}
        {recent.length > 0 && (
          <motion.div
            {...fadeUp(0.42)}
            className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum overflow-hidden"
          >
            <p className="text-[11px] uppercase tracking-[0.15em] text-black/55 dark:text-white/50 px-5 pt-4 pb-2 font-black">
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
                  className={`flex justify-between items-center px-5 py-3.5 ${i < recent.length - 1 ? 'border-b border-black/10 dark:border-white/[0.06]' : ''}`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-[13px] font-semibold text-black dark:text-white truncate">{tx.description || tx.category}</p>
                    <p className="text-[11px] text-black/45 dark:text-white/30 mt-0.5">{date}</p>
                  </div>
                  <p className={`text-[13px] font-black tabular-nums ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {sign}{formatCurrency(Math.abs(amount))}
                  </p>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ── Cash Card panel ── */}
        <motion.div
          {...fadeUp(0.49)}
          className="mt-5 rounded-2xl p-5 bg-yellow-100 dark:bg-yellow-900/30 border-[3px] border-black shadow-gum"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-white border-[3px] border-black flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-black" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-black mb-0.5">Your Cash Card</p>
              <p className="text-[12px] leading-relaxed text-black/75 font-semibold">
                Physical card with money from earlier sessions. Separate from My Money and yours forever. Check the balance whenever you need to spend it:
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 mt-3 border-[2px] border-black space-y-1.5 text-[12px]">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-black flex-shrink-0" strokeWidth={2.4} />
              <span className="text-black/70 font-semibold">Call</span>
              <a href="tel:18668820410" className="font-black tabular-nums text-black hover:text-cobalt-400">
                1-866-882-0410
              </a>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-black flex-shrink-0" strokeWidth={2.4} />
              <span className="text-black/70 font-semibold">Visit</span>
              <a
                href="https://cardholder.virtualrewardcenter.com/home/activate"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] font-bold text-black hover:text-cobalt-400 underline-offset-2 hover:underline"
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
    className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum overflow-hidden"
  >
    <div className="flex items-baseline justify-between px-5 pt-4 pb-3 border-b-[2px] border-black">
      <h2 className="text-[20px] font-black tracking-tight text-black dark:text-white">{title}</h2>
      <SplitBalance
        value={total}
        className="text-[16px] font-black text-black dark:text-white"
      />
    </div>
    <div className="px-5 py-2">{children}</div>
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
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border-[3px] border-black shadow-gum-sm"
        style={{ backgroundColor: row.accent }}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2.6} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-black tracking-tight text-black dark:text-white">{row.label}</p>
        <p className="text-[12px] mt-0.5 flex items-center gap-1.5 flex-wrap font-semibold">
          <span className={
            showPct
              ? (todayPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')
              : 'text-black/50 dark:text-white/40'
          }>
            {showPct
              ? `${todayPct >= 0 ? '+' : ''}${(todayPct * 100).toFixed(2)}% today`
              : row.subtitle}
          </span>
          {showMonthly && (
            <>
              <span className="text-black/30 dark:text-white/25">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                +{formatCurrency(monthEarned)} this month
              </span>
            </>
          )}
          {!showMonthly && showEarned && (
            <>
              <span className="text-black/30 dark:text-white/25">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                +{formatCurrency(earned)} earned
              </span>
            </>
          )}
        </p>
      </div>
      <SplitBalance
        value={balance}
        className="text-[16px] font-black text-black dark:text-white"
      />
    </motion.div>
  )
}
