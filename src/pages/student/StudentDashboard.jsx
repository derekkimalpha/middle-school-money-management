import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, Send, DollarSign,
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

const CASH_ROWS = [
  { key: 'checking', label: 'Checking', subtitle: 'Spending account', icon: Wallet,    accent: '#7c8c78' },
  { key: 'savings',  label: 'Savings',  subtitle: '4.00% APY',         icon: PiggyBank, accent: '#6b8a87' },
]

const INVEST_ROWS = [
  { key: 'sp500',  label: 'S&P 500', subtitle: '500 U.S. companies', icon: TrendingUp, accent: '#a68b5b' },
  { key: 'nasdaq', label: 'NASDAQ',  subtitle: 'Tech & growth',      icon: BarChart3,  accent: '#78716c' },
]

const containerV = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const itemV = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts, loading } = useAccounts(profile?.id)
  const { history } = useNetWorthHistory(profile?.id, 90)

  const [todaysReturns, setTodaysReturns] = useState({})
  const [recent, setRecent] = useState([])

  useEffect(() => {
    supabase
      .from('market_prices')
      .select('sp500_pct, nasdaq_pct, date')
      .order('date', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) setTodaysReturns({ sp500: Number(data.sp500_pct || 0), nasdaq: Number(data.nasdaq_pct || 0) })
      })
  }, [])

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('transactions')
      .select('id, amount, description, created_at, category')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setRecent(data) })
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
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="w-10 h-10 border-3 border-stone-200 dark:border-white/10 border-t-plum rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerV}
      initial="hidden"
      animate="show"
      className="pb-12 max-w-2xl mx-auto px-5 md:px-7"
    >
      {/* ── Net worth headline ── */}
      <motion.div variants={itemV} className="pt-8 pb-2">
        <SplitBalance
          value={totalBalance}
          className="text-[44px] md:text-[54px] font-black leading-[1.05] tracking-tight text-ink dark:text-chalk-white"
          centsClassName=""
        />
        {todayDelta !== 0 && (
          <div className={`flex items-center gap-1 mt-2 text-[13px] font-semibold ${todayDelta >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose'}`}>
            {todayDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {todayDelta >= 0 ? '+' : ''}{formatCurrency(todayDelta)} today
          </div>
        )}
      </motion.div>

      {/* ── Chart (no card chrome) ── */}
      <motion.div
        variants={itemV}
        className="mt-3 mb-8 text-ink-muted dark:text-white/55"
      >
        <NetWorthChart history={history} currentTotal={totalBalance} height={220} />
      </motion.div>

      {/* ── Cash section ── */}
      <Section title="Cash" total={cashTotal}>
        {CASH_ROWS.map((row) => (
          <AccountRow
            key={row.key}
            row={row}
            balance={accounts[row.key] || 0}
          />
        ))}
      </Section>

      {/* ── Investments section ── */}
      <Section title="Investments" total={investTotal}>
        {INVEST_ROWS.map((row) => {
          const todayPct = row.key === 'sp500' ? todaysReturns.sp500
                          : row.key === 'nasdaq' ? todaysReturns.nasdaq
                          : null
          return (
            <AccountRow
              key={row.key}
              row={row}
              balance={accounts[row.key] || 0}
              todayPct={todayPct}
            />
          )
        })}
      </Section>

      {/* ── Action buttons ── */}
      <motion.div variants={itemV} className="grid grid-cols-2 gap-3 mt-6 mb-8">
        <button
          onClick={() => navigate('/transfer')}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[14px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          Transfer
        </button>
        <button
          onClick={() => navigate('/cash-out')}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-transparent border border-black/[0.12] dark:border-white/[0.16] text-ink dark:text-chalk-white text-[14px] font-semibold hover:bg-paper-warm dark:hover:bg-white/[0.04] transition-all active:scale-[0.98]"
        >
          <DollarSign className="w-4 h-4" />
          Cash Out
        </button>
      </motion.div>

      {/* ── This week's paycheck ── */}
      <motion.div variants={itemV} className="mb-6">
        <PaycheckCard studentId={profile.id} />
      </motion.div>

      {/* ── Recent activity ── */}
      {recent.length > 0 && (
        <motion.div variants={itemV} className="mb-8">
          <p className="text-[13px] font-semibold text-ink dark:text-chalk-white mb-2 mt-2">
            Recent activity
          </p>
          {recent.map((tx, i) => {
            const amount = Number(tx.amount || 0)
            const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
            const color = amount >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose'
            const date = tx.created_at
              ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''
            return (
              <div
                key={tx.id}
                className={`flex justify-between items-center py-3 ${i < recent.length - 1 ? 'border-b border-black/[0.05] dark:border-white/[0.06]' : ''}`}
              >
                <div className="min-w-0 flex-1 pr-3">
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

      {/* ── Cash Card panel (informational) ── */}
      <motion.div
        variants={itemV}
        className="rounded-2xl p-5 bg-amber-bg/60 dark:bg-amber/[0.05] border border-amber/30 dark:border-amber/20"
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

// ─────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────

const Section = ({ title, total, children }) => (
  <motion.div variants={itemV} className="mb-2">
    <div className="flex items-baseline justify-between pt-3 pb-2 border-b border-black/[0.08] dark:border-white/[0.08]">
      <h2 className="text-[18px] font-semibold text-ink dark:text-chalk-white">{title}</h2>
      <SplitBalance
        value={total}
        className="text-[15px] font-semibold text-ink dark:text-chalk-white"
      />
    </div>
    <div>{children}</div>
  </motion.div>
)

const AccountRow = ({ row, balance, todayPct = null }) => {
  const Icon = row.icon
  const showPct = todayPct != null && todayPct !== 0
  return (
    <motion.div
      whileTap={{ scale: 0.995 }}
      className="flex items-center gap-3 py-3.5"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${row.accent}20` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: row.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-ink dark:text-chalk-white">{row.label}</p>
        <p className={`text-[12px] mt-0.5 ${
          showPct
            ? (todayPct >= 0 ? 'text-sage-dark dark:text-sage-300' : 'text-rose')
            : 'text-ink-faint dark:text-white/35'
        }`}>
          {showPct
            ? `${todayPct >= 0 ? '+' : ''}${(todayPct * 100).toFixed(2)}% today`
            : row.subtitle}
        </p>
      </div>
      <SplitBalance
        value={balance}
        className="text-[15px] font-semibold text-ink dark:text-chalk-white"
      />
    </motion.div>
  )
}
