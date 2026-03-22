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
import { TrendingUp, Send, ShoppingCart, Wallet, PiggyBank, BarChart3, DollarSign, ChevronRight, BookOpen } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

// Refined account color system
const ACCOUNT_COLORS = {
  checking: { hex: '#10b981', bg: 'bg-white dark:bg-[#111118]', border: 'border-black/[0.06] dark:border-white/[0.06]', accent: 'bg-emerald-500' },
  savings: { hex: '#06b6d4', bg: 'bg-white dark:bg-[#111118]', border: 'border-black/[0.06] dark:border-white/[0.06]', accent: 'bg-cyan-500' },
  sp500: { hex: '#f59e0b', bg: 'bg-white dark:bg-[#111118]', border: 'border-black/[0.06] dark:border-white/[0.06]', accent: 'bg-amber-500' },
  nasdaq: { hex: '#8b5cf6', bg: 'bg-white dark:bg-[#111118]', border: 'border-black/[0.06] dark:border-white/[0.06]', accent: 'bg-violet-500' },
}

const ACCOUNT_ICONS = {
  checking: Wallet,
  savings: PiggyBank,
  sp500: TrendingUp,
  nasdaq: BarChart3,
}

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [badges, setBadges] = useState([])
  const [toast, setToast] = useState(null)
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
      <div className="flex items-center justify-center h-screen bg-[#f8f9fb] dark:bg-[#0a0a0f]">
        <motion.div
          className="w-10 h-10 border-[3px] border-black/[0.08] dark:border-white/[0.08] border-t-black/20 dark:border-t-white/20 rounded-full"
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
    <div className="min-h-screen pb-24 transition-colors duration-300">
      <Toast message={toast} />

      {/* ── Header Section ────────────────────────────── */}
      <div className="px-8 pt-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-black/50 dark:text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                Welcome back
              </p>
              <h1 className="text-3xl font-semibold text-[#1a1a2e] dark:text-white/90">
                {firstName}
              </h1>
            </div>
            <div className="flex items-center gap-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg px-3.5 py-2">
              <span className="text-base">{currentLevel?.icon}</span>
              <span className="text-xs font-semibold text-[#1a1a2e] dark:text-white/90">
                {currentLevel?.name}
              </span>
            </div>
          </div>

          {/* Balance Display */}
          <div>
            <p className="text-black/40 dark:text-white/30 text-xs font-semibold uppercase tracking-widest mb-2.5">
              Total Balance
            </p>
            <h2 className="text-5xl font-semibold text-[#1a1a2e] dark:text-white/90 tracking-tight tabular-nums">
              <AnimNum value={totalBalance} prefix="$" />
            </h2>
          </div>

          {/* Level Progress */}
          {nextLevel && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-black/50 dark:text-white/40">
                  {currentLevel?.name}
                </span>
                <span className="text-xs font-medium text-black/50 dark:text-white/40">
                  {nextLevel.name} · {formatCurrency(nextLevelThreshold - totalBalance)} to go
                </span>
              </div>
              <div className="w-full bg-black/[0.06] dark:bg-white/[0.06] rounded-full h-1">
                <motion.div
                  className="h-1 rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Portfolio Breakdown Card ────────────────────── */}
      <div className="px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="bg-white dark:bg-[#111118] rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-8 transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-7">
            <h3 className="text-xs font-semibold text-[#1a1a2e] dark:text-white/90 uppercase tracking-widest">
              Portfolio
            </h3>
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              {donutData.length} accounts
            </span>
          </div>

          <div className="flex items-center gap-12">
            {/* Donut Chart */}
            <div className="flex-shrink-0">
              {donutData.length > 0 ? (
                <DonutChart
                  data={donutData}
                  size={140}
                  stroke={16}
                  centerValue={formatCurrency(totalBalance)}
                  centerLabel="Total"
                />
              ) : (
                <div className="w-[140px] h-[140px] rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                  <span className="text-xs font-medium text-black/40 dark:text-white/30">No funds</span>
                </div>
              )}
            </div>

            {/* Account Legend */}
            <div className="flex-1 space-y-4">
              {Object.entries(ACCOUNT_COLORS).map(([key, colors]) => {
                const balance = accounts[key] || 0
                const pct = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(0) : 0

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors.hex }}
                        />
                        <span className="text-sm font-medium text-[#1a1a2e] dark:text-white/90">
                          {ACCOUNT_META[key]?.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white/90 tabular-nums">
                        {formatCurrency(balance)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-full h-1.5">
                        <motion.div
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: colors.hex }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-black/50 dark:text-white/40 tabular-nums w-6 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Account Cards ──────────────────────────────── */}
      <div className="px-8 mb-8">
        <h3 className="text-xs font-semibold text-[#1a1a2e] dark:text-white/90 uppercase tracking-widest mb-4">
          Accounts
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(ACCOUNT_COLORS).map(([key, colors], index) => {
            const balance = accounts[key] || 0
            const Icon = ACCOUNT_ICONS[key]

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + index * 0.06, duration: 0.5 }}
                className="group"
              >
                <button
                  onClick={() => navigate(`/account/${key}`)}
                  className="w-full bg-white dark:bg-[#111118] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-6 transition-all duration-200 hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colors.hex + '15' }}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color: colors.hex }} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-black/50 dark:text-white/40 uppercase tracking-widest mb-1.5">
                    {ACCOUNT_META[key]?.label}
                  </p>
                  <p className="text-xl font-semibold text-[#1a1a2e] dark:text-white/90 tabular-nums">
                    <AnimNum value={balance} prefix="$" />
                  </p>
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────── */}
      <div className="px-8 mb-8">
        <h3 className="text-xs font-semibold text-[#1a1a2e] dark:text-white/90 uppercase tracking-widest mb-4">
          Quick Actions
        </h3>

        <div className="space-y-3">
          {[
            { label: 'Log Paycheck', desc: 'Submit your weekly earnings', icon: DollarSign, color: '#10b981', route: '/paycheck' },
            { label: 'Transfer Funds', desc: 'Move money between accounts', icon: Send, color: '#1a1a2e', route: '/transfer' },
            { label: 'Purchase Request', desc: 'Ask to buy something', icon: ShoppingCart, color: '#f59e0b', route: '/purchase' },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.36 + index * 0.06, duration: 0.5 }}
              onClick={() => navigate(action.route)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white dark:bg-[#111118] rounded-xl border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all text-left group active:scale-[0.98]"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: action.color + '20' }}
              >
                <action.icon className="w-4.5 h-4.5" style={{ color: action.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white/90">
                  {action.label}
                </p>
                <p className="text-xs text-black/50 dark:text-white/40">
                  {action.desc}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-black/30 dark:text-white/20 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Achievements ────────────────────────────────── */}
      {badges.length > 0 && (
        <div className="px-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#1a1a2e] dark:text-white/90 uppercase tracking-widest">
              Achievements
            </h3>
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              {badges.length} earned
            </span>
          </div>
          <div className="overflow-x-auto pb-2 -mx-8 px-8">
            <div className="flex gap-4 min-w-max">
              {badges.slice(0, 8).map((badge, index) => (
                <Badge key={badge.id} badge={badge} delay={index * 0.06} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Learn Section ────────────────────────────── */}
      <div className="px-8">
        <h3 className="text-xs font-semibold text-[#1a1a2e] dark:text-white/90 uppercase tracking-widest mb-4">
          Learn
        </h3>
        <div className="space-y-3">
          {[
            { icon: '🏦', title: 'Why diversify?', body: 'Different accounts serve different purposes — checking for daily use, savings for safety, investments for growth.' },
            { icon: '📈', title: 'S&P 500 vs NASDAQ', body: 'S&P 500 tracks 500 large companies for steady growth. NASDAQ focuses on tech for higher risk and reward.' },
            { icon: '💡', title: '50/30/20 Rule', body: '50% needs, 30% wants, 20% savings. A simple framework real adults use to budget their paychecks.' },
          ].map((tip, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.48 + i * 0.06, duration: 0.5 }}
              className="group bg-white dark:bg-[#111118] rounded-xl border border-black/[0.06] dark:border-white/[0.06]"
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-xl">
                <span className="text-base">{tip.icon}</span>
                <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white/90 flex-1">
                  {tip.title}
                </span>
                <ChevronRight className="w-4 h-4 text-black/30 dark:text-white/20 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-5 pb-4 text-sm text-black/50 dark:text-white/40 leading-relaxed border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
                {tip.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
