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
import { TrendingUp, Send, ShoppingCart, Wallet, PiggyBank, BarChart3, DollarSign, ChevronRight } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

// Clean account colors — no gradients on the cards themselves
const ACCOUNT_COLORS = {
  checking: { hex: '#10b981', label: 'text-emerald-600 dark:text-emerald-400' },
  savings: { hex: '#06b6d4', label: 'text-cyan-600 dark:text-cyan-400' },
  sp500: { hex: '#f59e0b', label: 'text-amber-600 dark:text-amber-400' },
  nasdaq: { hex: '#3b82f6', label: 'text-blue-600 dark:text-blue-400' },
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
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="w-12 h-12 border-4 border-gray-200 dark:border-white/[0.12] border-t-teal-600 dark:border-t-teal-400 rounded-full"
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
    <div className={`pb-24 ${isDark ? 'bg-[#09090b]' : 'bg-[#f5f5f7]'}`}>
      <Toast message={toast} />

      {/* ── Clean Status Bar ─────────────────────── */}
      <div className={`${isDark ? 'bg-[#09090b]' : 'bg-[#f5f5f7]'} px-8 pt-8 pb-6`}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          {/* Greeting left */}
          <div>
            <p className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Welcome back
            </p>
            <h1 className={`text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {firstName} 👋
            </h1>
          </div>

          {/* Level badge right */}
          <motion.div
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              isDark
                ? 'bg-white/[0.04] border border-white/[0.06]'
                : 'bg-white border border-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-lg">{currentLevel?.icon}</span>
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentLevel?.name}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Glass Balance Card ──────────────────── */}
      <div className="px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`rounded-3xl p-8 ${
            isDark
              ? 'bg-white/[0.04] border border-white/[0.06]'
              : 'bg-white border border-gray-200'
          }`}
        >
          {/* Large balance number */}
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            Total Balance
          </p>
          <h2 className={`text-5xl font-black tabular-nums mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AnimNum value={totalBalance} prefix="$" />
          </h2>

          {/* Subtle donut chart inside the card */}
          {donutData.length > 0 && (
            <div className="flex items-center justify-center">
              <DonutChart
                data={donutData}
                size={160}
                stroke={14}
                centerValue={formatCurrency(totalBalance)}
                centerLabel="Total"
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* ── XP Progress Section ─────────────────── */}
      {nextLevel && (
        <div className="px-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={`rounded-2xl p-6 ${
              isDark
                ? 'bg-white/[0.04] border border-white/[0.06]'
                : 'bg-white border border-gray-200'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Progress to Next Level
            </p>

            {/* Icons left and right with bar in middle */}
            <div className="flex items-center gap-4 mb-3">
              <span className="text-2xl flex-shrink-0">{currentLevel?.icon}</span>
              <div className="flex-1">
                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                  <motion.div
                    className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </div>
              <span className="text-2xl flex-shrink-0">{nextLevel?.icon}</span>
            </div>

            {/* Progress text */}
            <div className="flex justify-between items-center">
              <span className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {currentLevel?.name}
              </span>
              <span className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {nextLevel.name} · {formatCurrency(nextLevelThreshold - totalBalance)} to go
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Credit-Card Style Account Cards ────── */}
      <div className="px-8 mb-8">
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your Accounts
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
                transition={{ delay: 0.16 + index * 0.06 }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer group"
              >
                <div
                  className={`relative rounded-2xl p-5 overflow-hidden border transition-all ${
                    isDark
                      ? 'bg-white/[0.04] border-white/[0.06] hover:border-white/[0.12]'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderLeft: `4px solid ${colors.hex}`,
                  }}
                >
                  {/* Icon + Label */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${colors.hex}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: colors.hex }} />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      {ACCOUNT_META[key]?.label}
                    </span>
                  </div>

                  {/* Balance */}
                  <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <AnimNum value={balance} prefix="$" />
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Quick Action Pills ──────────────────── */}
      <div className="px-8 mb-8">
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h3>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-8 px-8">
          {[
            { label: 'Paycheck', icon: '💵', color: '#10b981', route: '/paycheck' },
            { label: 'Transfer', icon: '🔄', color: '#06b6d4', route: '/transfer' },
            { label: 'Purchase', icon: '🛒', color: '#f59e0b', route: '/purchase' },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.32 + index * 0.08 }}
              onClick={() => navigate(action.route)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm whitespace-nowrap flex-shrink-0 border transition-all ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.06] text-white hover:bg-white/[0.08]'
                  : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{action.icon}</span>
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Achievements ──────────────────────── */}
      {badges.length > 0 && (
        <div className="px-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Achievements 🏆
            </h3>
            <span className={`text-xs font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
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

      {/* ── Portfolio Breakdown Details ────────── */}
      <div className="px-8 mb-8">
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Portfolio Breakdown
        </h3>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.20 }}
          className={`rounded-2xl p-6 ${
            isDark
              ? 'bg-white/[0.04] border border-white/[0.06]'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="space-y-4">
            {Object.entries(ACCOUNT_COLORS).map(([key, colors]) => {
              const balance = accounts[key] || 0
              const pct = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(0) : 0

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.hex }}
                      />
                      <span className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        {ACCOUNT_META[key]?.label}
                      </span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: colors.hex }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                    <span className={`text-xs font-bold tabular-nums w-8 text-right ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Learn Section ──────────────────────── */}
      <div className="px-8">
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Level Up Your Knowledge 📚
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
              transition={{ delay: 0.48 + i * 0.08 }}
              className={`group rounded-2xl border transition-colors ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.06] hover:border-white/[0.12]'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <summary className={`flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
                isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
              }`}>
                <span className="text-lg">{tip.icon}</span>
                <span className={`text-sm font-bold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tip.title}
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform group-open:rotate-90 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              </summary>
              <div className={`px-5 pb-4 text-sm leading-relaxed border-t transition-colors ${
                isDark
                  ? 'text-white/60 border-white/[0.06]'
                  : 'text-gray-600 border-gray-100'
              } pt-4`}>
                {tip.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
