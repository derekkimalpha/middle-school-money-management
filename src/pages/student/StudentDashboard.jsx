import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, Send, DollarSign,
  CreditCard, Phone, BookOpen, Wallet, PiggyBank, TrendingUp, BarChart3,
  Lock,
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

const ACCOUNT_ROWS = [
  { key: 'checking', label: 'Checking', subtitle: 'Spending',                       icon: Wallet },
  { key: 'savings',  label: 'Savings',  subtitle: '4.00% APY · paid daily',         icon: PiggyBank },
  { key: 'sp500',    label: 'S&P 500',  subtitle: '500 U.S. companies',             icon: TrendingUp },
  { key: 'nasdaq',   label: 'NASDAQ',   subtitle: 'Tech & growth',                  icon: BarChart3 },
  { key: 'roth',     label: 'Roth IRA', subtitle: 'MAP earnings · locked',          icon: Lock, locked: true },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

const greeting = () => {
  const h = new Date().getHours()
  if (h < 5)  return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

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

  const totalBalance = useMemo(
    () => accounts ? ACCOUNT_ROWS.reduce((s, r) => s + (accounts[r.key] || 0), 0) : 0,
    [accounts]
  )

  const todayDelta = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return recent
      .filter((t) => (t.created_at || '').slice(0, 10) === today &&
                     (t.category === 'market_return' || t.category === 'interest'))
      .reduce((s, t) => s + Number(t.amount || 0), 0)
  }, [recent])

  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  if (loading || !accounts || !profile) {
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
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-10 pb-20">

        {/* ─── HERO — welcome + huge number + quick actions ─── */}
        <motion.section
          {...fadeUp(0)}
          className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6 md:items-end mb-12"
        >
          <div>
            <p className="text-[11px] font-semibold text-ds-tertiary tracking-[0.06em] uppercase mb-2">
              Total net worth
            </p>
            <p className="text-[18px] md:text-[22px] font-semibold text-ds-secondary mb-4">
              {greeting()}, <span className="text-ds-primary">{firstName}</span>
            </p>
            <div className="text-[64px] md:text-[76px] font-bold leading-[0.95] tracking-[-0.04em] text-ds-primary">
              <SplitBalance value={totalBalance} />
            </div>
            <div className="flex items-center gap-2.5 mt-4 flex-wrap">
              {todayDelta !== 0 && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                  todayDelta >= 0
                    ? 'bg-ds-accent-soft text-ds-accent'
                    : 'bg-ds-negative-soft text-ds-negative'
                }`}>
                  {todayDelta >= 0 ? <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} /> : <ArrowDownRight className="w-3 h-3" strokeWidth={2.5} />}
                  {todayDelta >= 0 ? '+' : ''}{formatCurrency(todayDelta)} today
                </span>
              )}
              {growth.total > 0 && (
                <span className="text-[12px] text-ds-tertiary font-medium">
                  <span className="text-ds-positive font-semibold">+{formatCurrency(growth.total)}</span> earned all-time
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/cash-out')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-ds-surface border border-ds-border text-ds-primary text-[13px] font-semibold hover:bg-ds-inset transition-all"
            >
              <DollarSign className="w-3.5 h-3.5" strokeWidth={2.4} />
              Cash out
            </button>
            <button
              onClick={() => navigate('/transfer')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-ds-accent hover:bg-ds-accent-hover text-ds-on-accent text-[13px] font-semibold transition-all"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={2.4} />
              Transfer
            </button>
          </div>
        </motion.section>

        {/* ─── CHART + ACCOUNTS GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-6 mb-6">

          {/* Chart panel */}
          <motion.div {...fadeUp(0.08)} className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7">
            <p className="text-[12px] font-semibold text-ds-tertiary tracking-[0.05em] uppercase mb-5">Net worth</p>
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-[26px] md:text-[28px] font-bold tracking-[-0.02em] tabular-nums text-ds-primary">
                {formatCurrency(totalBalance)}
              </p>
              {growth.total > 0 && (
                <p className="text-[13px] font-semibold text-ds-positive">
                  +{formatCurrency(growth.total)}
                </p>
              )}
            </div>
            <NetWorthChart history={history} currentTotal={totalBalance} height={220} />
          </motion.div>

          {/* Accounts panel */}
          <motion.div {...fadeUp(0.12)} className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7">
            <p className="text-[12px] font-semibold text-ds-tertiary tracking-[0.05em] uppercase mb-4">Accounts</p>
            <div className="flex flex-col">
              {ACCOUNT_ROWS.map((row, idx) => {
                const balance = accounts[row.key] || 0
                const todayPct = row.key === 'sp500' ? todaysReturns.sp500
                              : row.key === 'nasdaq' ? todaysReturns.nasdaq
                              : null
                const isLast = idx === ACCOUNT_ROWS.length - 1
                const earnedThisMonth = row.key === 'savings' ? monthInterest.thisMonth : 0
                const Icon = row.icon
                return (
                  <div key={row.key} className={`flex items-center gap-3 py-3.5 ${!isLast ? 'border-b border-ds-hairline' : ''}`}>
                    <div className={`w-9 h-9 rounded-ds-md flex items-center justify-center flex-shrink-0 ${
                      row.locked ? 'bg-ds-accent-soft text-ds-accent' : 'bg-ds-inset text-ds-primary'
                    }`}>
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[14px] font-semibold text-ds-primary">{row.label}</p>
                        {row.locked && (
                          <Lock className="w-3 h-3 text-ds-tertiary" strokeWidth={2.2} />
                        )}
                      </div>
                      <p className="text-[11px] text-ds-tertiary font-medium mt-0.5">{row.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold tabular-nums text-ds-primary">
                        ${balance.toFixed(2)}
                      </p>
                      {todayPct != null && todayPct !== 0 && (
                        <p className={`text-[11px] font-semibold mt-0.5 ${todayPct >= 0 ? 'text-ds-positive' : 'text-ds-negative'}`}>
                          {todayPct >= 0 ? '+' : ''}{(todayPct * 100).toFixed(2)}%
                        </p>
                      )}
                      {earnedThisMonth > 0 && (
                        <p className="text-[11px] font-semibold text-ds-positive mt-0.5">
                          +{formatCurrency(earnedThisMonth)} this month
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ─── THIS WEEK'S PAYCHECK ─── */}
        <motion.div {...fadeUp(0.16)} className="mb-6">
          <PaycheckCard studentId={profile.id} />
        </motion.div>

        {/* ─── UNFILLED PAYCHECKS ─── */}
        {currentSession && (
          <motion.div {...fadeUp(0.20)} className="mb-6">
            <UnfilledPaychecksList
              studentId={profile.id}
              currentSessionNumber={parseInt(currentSession.name.match(/\d+/)?.[0] || 5)}
              currentWeekNumber={currentWeek}
            />
          </motion.div>
        )}

        {/* ─── EARNINGS BREAKDOWN ─── */}
        <motion.div {...fadeUp(0.24)} className="mb-6">
          <EarningsBreakdown studentId={profile.id} />
        </motion.div>

        {/* ─── RECENT ACTIVITY ─── */}
        {recent.length > 0 && (
          <motion.div {...fadeUp(0.28)} className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7 mb-6">
            <p className="text-[12px] font-semibold text-ds-tertiary tracking-[0.05em] uppercase mb-4">Recent activity</p>
            <div>
              {recent.map((tx, i) => {
                const amount = Number(tx.amount || 0)
                const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
                const isPositive = amount >= 0
                const date = tx.created_at
                  ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : ''
                const isLast = i === recent.length - 1
                return (
                  <div key={tx.id} className={`flex items-center gap-3 py-3 ${!isLast ? 'border-b border-ds-hairline' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-ds-inset text-ds-secondary flex items-center justify-center flex-shrink-0">
                      {isPositive
                        ? <ArrowDownRight className="w-4 h-4 text-ds-positive" strokeWidth={2.4} />
                        : <ArrowUpRight className="w-4 h-4 text-ds-negative" strokeWidth={2.4} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ds-primary truncate">{formatTxLabel(tx)}</p>
                      <p className="text-[11px] text-ds-tertiary mt-0.5">{date}</p>
                    </div>
                    <p className={`text-[14px] font-semibold tabular-nums ${isPositive ? 'text-ds-positive' : 'text-ds-negative'}`}>
                      {sign}{formatCurrency(Math.abs(amount))}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ─── HOW XP WORKS ─── */}
        <motion.div {...fadeUp(0.36)} className="mb-6">
          <HowXpWorks />
        </motion.div>

        {/* ─── PHYSICAL CASH CARD ─── */}
        <motion.div {...fadeUp(0.40)} className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-ds-md bg-ds-inset text-ds-secondary flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ds-primary mb-1">Physical cash card</p>
              <p className="text-[12px] text-ds-secondary leading-relaxed">
                Separate card for money from earlier sessions. Check the balance when you need to spend it:
              </p>
            </div>
          </div>
          <div className="rounded-ds-md bg-ds-inset p-4 space-y-2.5 text-[12px]">
            <div className="flex items-center gap-3">
              <Phone className="w-3.5 h-3.5 text-ds-tertiary flex-shrink-0" strokeWidth={2} />
              <span className="text-ds-tertiary font-medium">Call</span>
              <a href="tel:18668820410" className="font-semibold tabular-nums text-ds-primary hover:text-ds-accent transition-colors">
                1-866-882-0410
              </a>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-3.5 h-3.5 text-ds-tertiary flex-shrink-0" strokeWidth={2} />
              <span className="text-ds-tertiary font-medium">Visit</span>
              <a
                href="https://cardholder.virtualrewardcenter.com/home/activate"
                target="_blank"
                rel="noreferrer"
                className="font-ds-mono text-[11px] font-medium text-ds-primary hover:text-ds-accent underline-offset-2 hover:underline transition-colors"
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
