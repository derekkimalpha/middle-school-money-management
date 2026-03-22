import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AnimNum, Toast } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { supabase } from '../../lib/supabase'
import {
  ACCOUNT_META,
  formatCurrency,
  getLevel,
  getNextLevel,
} from '../../lib/constants'
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  DollarSign,
  ArrowLeftRight,
  ShoppingBag,
} from 'lucide-react'

// ── Account config ──────────────────────────────────
const ACCOUNTS = {
  checking: { hex: '#10b981', icon: Wallet },
  savings: { hex: '#06b6d4', icon: PiggyBank },
  sp500: { hex: '#f59e0b', icon: TrendingUp },
  nasdaq: { hex: '#3b82f6', icon: BarChart3 },
}

// ── Transaction icon helper ─────────────────────────
const txIcon = (type) => {
  if (type === 'paycheck' || type === 'bonus') return DollarSign
  if (type === 'transfer') return ArrowLeftRight
  if (type === 'purchase') return ShoppingBag
  return ArrowDownLeft
}
const txColor = (amount) => (amount >= 0 ? '#10b981' : '#ef4444')

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts, loading } = useAccounts(profile?.id)
  const [recentTx, setRecentTx] = useState([])
  const [toast, setToast] = useState(null)

  // Fetch recent transactions
  useEffect(() => {
    if (!profile?.id) return
    const fetchRecent = async () => {
      try {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (data) setRecentTx(data)
      } catch (e) {
        console.error('Error fetching transactions:', e)
      }
    }
    fetchRecent()
  }, [profile?.id])

  // ── Loading state ─────────────────────────────────
  if (loading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <motion.div
          className="w-10 h-10 border-[3px] border-gray-200 dark:border-white/10 border-t-gray-900 dark:border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  // ── Derived data ──────────────────────────────────
  const totalBalance = Object.entries(accounts)
    .filter(([key]) => key !== 'bonus')
    .reduce((sum, [, bal]) => sum + bal, 0)

  const currentLevel = getLevel(totalBalance)
  const nextLevel = getNextLevel(totalBalance)
  const levelProgress = nextLevel
    ? Math.min(
        ((totalBalance - currentLevel.min) /
          (nextLevel.min - currentLevel.min)) *
          100,
        100,
      )
    : 100

  const firstName = profile?.full_name?.split(' ')[0] || 'Friend'

  // ── Render ────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <Toast message={toast} />

      {/* ─── 1. BALANCE HERO ─────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2"
      >
        <p className="text-sm text-gray-500 dark:text-white/50 font-medium mb-1">
          Hey {firstName}
        </p>
        <h1 className="text-[56px] leading-none font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
          <AnimNum value={totalBalance} prefix="$" />
        </h1>
        <p className="text-sm text-gray-400 dark:text-white/30 mt-2">Total balance</p>

        {/* Level pill */}
        <motion.div
          className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-base">{currentLevel?.icon}</span>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
            {currentLevel?.name}
          </span>
        </motion.div>
      </motion.section>

      {/* ─── 2. ACCOUNT CARDS (horizontal scroll) ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x">
          {Object.entries(ACCOUNTS).map(([key, config], i) => {
            const balance = accounts[key] || 0
            const Icon = config.icon
            const label = ACCOUNT_META[key]?.label || key

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex-shrink-0 w-[160px] snap-start"
              >
                <div
                  className="rounded-2xl p-4 border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] hover:shadow-md dark:hover:bg-white/[0.05] transition-all cursor-pointer"
                  style={{ borderTop: `3px solid ${config.hex}` }}
                  onClick={() => navigate('/history')}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${config.hex}12` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: config.hex }} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                  <p className="text-xl font-black tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(balance)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ─── 3. ACTION BUTTONS ───────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          {
            label: 'Paycheck',
            icon: DollarSign,
            route: '/paycheck',
            color: '#10b981',
          },
          {
            label: 'Transfer',
            icon: ArrowLeftRight,
            route: '/transfer',
            color: '#06b6d4',
          },
          {
            label: 'Buy',
            icon: ShoppingBag,
            route: '/purchase',
            color: '#f59e0b',
          },
        ].map((action) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.label}
              onClick={() => navigate(action.route)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] hover:shadow-md dark:hover:bg-white/[0.05] transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${action.color}12` }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-white/70">
                {action.label}
              </span>
            </motion.button>
          )
        })}
      </motion.section>

      {/* ─── 4. RECENT ACTIVITY ──────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          {recentTx.length > 0 && (
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-semibold text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 flex items-center gap-0.5 transition-colors"
            >
              See all <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] overflow-hidden">
          {recentTx.length === 0 ? (
            /* Empty state */
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <ArrowDownLeft className="w-5 h-5 text-gray-400 dark:text-white/30" />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-white/40">
                No activity yet
              </p>
              <p className="text-xs text-gray-400 dark:text-white/25 mt-1">
                Log your first paycheck to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {recentTx.map((tx) => {
                const Icon = txIcon(tx.transaction_type)
                const isPositive = tx.amount >= 0
                const dateStr = new Date(tx.created_at).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' },
                )

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${txColor(tx.amount)}10`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: txColor(tx.amount) }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {tx.description || tx.transaction_type}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-white/30">
                        {dateStr} · {ACCOUNT_META[tx.account_type]?.label || tx.account_type}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── 5. LEVEL PROGRESS (subtle) ──────────── */}
      {nextLevel && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="rounded-2xl p-4 border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{currentLevel?.icon}</span>
              <span className="text-xs font-bold text-gray-700 dark:text-white/70">
                {currentLevel?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 dark:text-white/70">
                {nextLevel.name}
              </span>
              <span className="text-base">{nextLevel?.icon}</span>
            </div>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/[0.06]">
            <motion.div
              className="h-2 rounded-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>

          <p className="text-[11px] text-gray-400 dark:text-white/30 mt-2 text-center">
            {formatCurrency(nextLevel.min - totalBalance)} to{' '}
            <span className="font-semibold">{nextLevel.name}</span>
          </p>
        </motion.section>
      )}
    </div>
  )
}
