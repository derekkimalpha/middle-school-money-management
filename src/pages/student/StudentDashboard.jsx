import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AnimNum,
  DonutChart,
  Badge,
  Toast,
} from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { supabase } from '../../lib/supabase'
import {
  ACCOUNT_META,
  formatCurrency,
  getLevel,
  getNextLevel,
} from '../../lib/constants'
import { TrendingUp, Send, ShoppingCart, Wallet, PiggyBank, BarChart3, DollarSign, ChevronRight, Banknote, Zap, Star, ArrowUpRight } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

const ACCOUNT_COLORS = {
  checking: { hex: '#22c55e', gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  savings: { hex: '#3b82f6', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  sp500: { hex: '#f59e0b', gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  nasdaq: { hex: '#8b5cf6', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-600 dark:text-violet-400' },
}

const ACCOUNT_ICONS = {
  checking: Wallet,
  savings: PiggyBank,
  sp500: TrendingUp,
  nasdaq: BarChart3,
}

const ACCOUNT_TIPS = {
  checking: {
    Icon: Wallet,
    title: 'Checking Account',
    definition: 'A bank account designed for frequent transactions — deposits, withdrawals, and purchases. Money is available instantly.',
    example: 'When you buy lunch or pay for a subscription, the money comes out of checking.',
  },
  savings: {
    Icon: PiggyBank,
    title: 'Savings Account',
    definition: 'A bank account that earns interest over time. Designed for money you want to keep and grow, not spend right away.',
    example: 'If you deposit $100 at 4% annual interest, you earn $4 that year — without doing anything.',
  },
  sp500: {
    Icon: TrendingUp,
    title: 'S&P 500 Index Fund',
    definition: 'An investment that tracks the 500 largest U.S. companies (Apple, Amazon, Nike, etc.). Instead of picking one stock, you own a piece of all 500.',
    example: 'The S&P 500 has averaged ~10% annual returns since 1957 — $100 invested becomes ~$110 after one year.',
  },
  nasdaq: {
    Icon: BarChart3,
    title: 'NASDAQ Index Fund',
    definition: 'An investment focused on technology and growth companies (Google, Tesla, Netflix). Higher potential returns, but also bigger swings up and down.',
    example: 'NASDAQ rose 43% in 2023 but dropped 33% in 2022 — that volatility is the trade-off for higher growth.',
  },
}

const AccountTooltip = ({ tip, isVisible }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.95 }}
    animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.95 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 pointer-events-none"
    style={{ display: isVisible ? 'block' : 'none' }}
  >
    <div className="relative bg-gray-900 dark:bg-white rounded-xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <tip.Icon className="w-4 h-4 text-amber-400 dark:text-amber-500" />
        <span className="text-sm font-bold text-white dark:text-gray-900">{tip.title}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-gray-300 dark:text-gray-600">{tip.definition}</p>
      <div className="mt-2 pt-2 border-t border-white/10 dark:border-gray-200">
        <p className="text-[10px] font-bold text-amber-400 dark:text-amber-600 uppercase tracking-wider mb-0.5">Example</p>
        <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">{tip.example}</p>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 rotate-45 bg-gray-900 dark:bg-white" />
    </div>
  </motion.div>
)

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [badges, setBadges] = useState([])
  const [toast, setToast] = useState(null)
  const [hoveredAccount, setHoveredAccount] = useState(null)
  const { accounts, loading } = useAccounts(profile?.id)
  const { isDark } = useTheme()

  useEffect(() => {
    if (!profile?.id) return
    const fetchBadges = async () => {
      try {
        const { data: badgeData } = await supabase
          .from('student_badges')
          .select('badge_id, badges:badge_definitions(*)')
          .eq('student_id', profile.id)
        if (badgeData) {
          setBadges(badgeData.map((sb) => ({
            id: sb.badge_id,
            title: sb.badges?.title || '',
            icon: sb.badges?.icon || '',
            description: sb.badges?.description || '',
            earned: true,
          })))
        }
      } catch (error) {
        console.error('Error fetching badges:', error)
      }
    }
    fetchBadges()
  }, [profile?.id])

  if (loading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="w-12 h-12 border-4 border-gray-200 dark:border-white/[0.12] border-t-amber-500 dark:border-t-amber-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  const totalBalance = Object.entries(accounts)
    .filter(([key]) => key !== 'bonus')
    .reduce((sum, [, bal]) => sum + bal, 0)
  const currentLevel = getLevel(totalBalance)
  const nextLevel = getNextLevel(totalBalance)
  const nextLevelThreshold = nextLevel?.min || totalBalance
  const levelProgress = nextLevel ? Math.min((totalBalance / nextLevelThreshold) * 100, 100) : 100

  const donutData = Object.entries(ACCOUNT_COLORS)
    .filter(([key]) => (accounts[key] || 0) > 0)
    .map(([key, colors]) => ({
      value: accounts[key],
      color: colors.hex,
    }))

  const firstName = profile?.full_name?.split(' ')[0] || 'Friend'

  return (
    <div className="pb-24">
      <Toast message={toast} />

      {/* ── Hero Balance Card ── */}
      <div className="px-6 pt-6 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-900 dark:to-black p-6"
        >
          {/* Decorative gradient orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-emerald-400/10 blur-2xl" />

          {/* Header row */}
          <div className="relative flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-white/50 mb-0.5">Welcome back</p>
              <h1 className="text-2xl font-black text-white">{firstName}</h1>
            </div>
            <motion.div
              whileHover={{ scale: 1.08, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">{currentLevel?.name}</span>
            </motion.div>
          </div>

          {/* Big balance */}
          <div className="relative mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">Total Balance</p>
            <h2 className="text-5xl font-black tabular-nums text-white tracking-tight">
              <AnimNum value={totalBalance} prefix="$" />
            </h2>
          </div>

          {/* Donut + Legend row */}
          {donutData.length > 0 && (
            <div className="relative flex items-center gap-6">
              <div className="flex-shrink-0">
                <DonutChart
                  data={donutData}
                  size={120}
                  stroke={14}
                  centerValue={formatCurrency(totalBalance)}
                  centerLabel="Total"
                />
              </div>
              <div className="flex-1 space-y-2.5">
                {Object.entries(ACCOUNT_COLORS).map(([key, colors]) => {
                  const balance = accounts[key] || 0
                  const pct = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(0) : 0
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10"
                          style={{ backgroundColor: colors.hex }}
                        />
                        <span className="text-xs font-medium text-white/60">
                          {ACCOUNT_META[key]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tabular-nums text-white">
                          {formatCurrency(balance)}
                        </span>
                        <span className="text-[10px] tabular-nums text-white/30 w-7 text-right font-medium">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Level progress bar */}
          {nextLevel && (
            <div className="relative mt-5 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{currentLevel?.name}</span>
                <span className="text-[10px] font-bold text-amber-400/80">{formatCurrency(nextLevelThreshold - totalBalance)} to {nextLevel.name}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-white/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-6 py-4">
        <div className="flex gap-2">
          {[
            { label: 'Log Pay', Icon: Banknote, route: '/paycheck', color: 'from-emerald-500 to-green-600' },
            { label: 'Transfer', Icon: Send, route: '/transfer', color: 'from-blue-500 to-indigo-600' },
            { label: 'Buy', Icon: ShoppingCart, route: '/purchase', color: 'from-violet-500 to-purple-600' },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              onClick={() => navigate(action.route)}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shadow-sm hover:shadow-md transition-all"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm`}>
                <action.Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[11px] font-bold text-ink dark:text-white/80">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Account Cards ── */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink dark:text-chalk-white">Your Accounts</h3>
          <span className="text-[10px] font-semibold text-ink-muted dark:text-white/40 uppercase tracking-wider">Tap for details</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ACCOUNT_COLORS).map(([key, colors], index) => {
            const balance = accounts[key] || 0
            const Icon = ACCOUNT_ICONS[key]
            const pct = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(0) : 0

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.06 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="cursor-pointer relative"
                onMouseEnter={() => setHoveredAccount(key)}
                onMouseLeave={() => setHoveredAccount(null)}
              >
                <AccountTooltip tip={ACCOUNT_TIPS[key]} isVisible={hoveredAccount === key} />
                <div className={`relative rounded-xl p-4 bg-white dark:bg-white/[0.04] border ${colors.border} dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all overflow-hidden`}>
                  {/* Subtle gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-[0.03] dark:opacity-[0.06]`} />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <span className={`text-[10px] font-bold ${colors.text} bg-white/80 dark:bg-white/5 px-1.5 py-0.5 rounded-md`}>{pct}%</span>
                    </div>

                    <p className="text-[11px] font-semibold text-ink-muted dark:text-white/50 mb-0.5">
                      {ACCOUNT_META[key]?.label}
                    </p>
                    <p className="text-xl font-black tabular-nums text-ink dark:text-chalk-white">
                      <AnimNum value={balance} prefix="$" />
                    </p>

                    {key === 'sp500' && <span className="text-[9px] text-ink-faint dark:text-white/30 mt-0.5 block">Top 500 companies</span>}
                    {key === 'nasdaq' && <span className="text-[9px] text-ink-faint dark:text-white/30 mt-0.5 block">Tech-heavy index</span>}
                    {key === 'savings' && <span className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-0.5"><ArrowUpRight className="w-2.5 h-2.5" />Earning interest</span>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Achievements ── */}
      {badges.length > 0 && (
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-ink dark:text-chalk-white">Achievements</h3>
            </div>
            <span className="text-xs font-bold text-amber-500">
              {badges.length} earned
            </span>
          </div>
          <div className="overflow-x-auto pb-2 -mx-6 px-6">
            <div className="flex gap-3 min-w-max">
              {badges.slice(0, 8).map((badge, index) => (
                <Badge key={badge.id} badge={badge} delay={index * 0.06} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Learn Section ── */}
      <div className="px-6">
        <h3 className="text-sm font-bold text-ink dark:text-chalk-white mb-3">
          Level Up Your Knowledge
        </h3>
        <div className="space-y-2">
          {[
            { Icon: PiggyBank, title: 'Why spread your money around?', body: 'Diversifying means spreading your money across different account types for different goals — checking for daily use, savings for safety, investments for growth.', color: 'from-blue-500 to-indigo-600' },
            { Icon: TrendingUp, title: 'S&P 500 vs NASDAQ', body: 'S&P 500 tracks 500 large companies for steady growth — think of it like owning a tiny piece of Apple, Microsoft, and hundreds of other stable businesses. NASDAQ focuses on tech companies, which can grow faster but are riskier. Both are great for long-term investing!', color: 'from-amber-400 to-orange-500' },
            { Icon: DollarSign, title: '50/30/20 Rule', body: '50% needs, 30% wants, 20% savings. A simple framework real adults use to budget their paychecks.', color: 'from-emerald-500 to-green-600' },
          ].map((tip, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.48 + i * 0.08 }}
              className="group rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.04] shadow-sm overflow-hidden"
            >
              <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tip.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <tip.Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold flex-1 text-ink dark:text-chalk-white">
                  {tip.title}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-ink-faint dark:text-white/30" />
              </summary>
              <div className="px-4 pb-4 text-sm leading-relaxed border-t border-black/[0.04] dark:border-white/[0.04] pt-3 text-ink-light dark:text-white/60">
                {tip.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
