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

// Vibrant account colors for the game feel
const ACCOUNT_COLORS = {
  checking: { hex: '#10b981', gradient: 'from-emerald-400 to-teal-500', darkGradient: 'from-emerald-500/20 to-teal-500/20', label: 'text-emerald-600 dark:text-emerald-400' },
  savings: { hex: '#06b6d4', gradient: 'from-cyan-400 to-blue-500', darkGradient: 'from-cyan-500/20 to-blue-500/20', label: 'text-cyan-600 dark:text-cyan-400' },
  sp500: { hex: '#f59e0b', gradient: 'from-amber-400 to-orange-500', darkGradient: 'from-amber-500/20 to-orange-500/20', label: 'text-amber-600 dark:text-amber-400' },
  nasdaq: { hex: '#8b5cf6', gradient: 'from-violet-400 to-purple-500', darkGradient: 'from-violet-500/20 to-purple-500/20', label: 'text-violet-600 dark:text-violet-400' },
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
          className="w-12 h-12 border-4 border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-400 rounded-full"
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

      {/* ── Hero Section ──────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Gradient hero background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-900/50 dark:via-purple-900/40 dark:to-indigo-900/30" />
        {/* Animated blobs */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-pink-400/20 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-cyan-400/15 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative z-10 px-8 pt-8 pb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Greeting + Level */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/60 text-sm font-medium">Welcome back</p>
                <h1 className="text-3xl font-extrabold text-white mt-1">{firstName} 👋</h1>
              </div>
              <motion.div
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg shadow-purple-900/20"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-lg">{currentLevel?.icon}</span>
                <span className="text-sm font-bold text-white">{currentLevel?.name}</span>
              </motion.div>
            </div>

            {/* Total Balance — big and bold */}
            <div className="mb-2">
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
              <h2 className="text-5xl font-extrabold text-white tracking-tight tabular-nums">
                <AnimNum value={totalBalance} prefix="$" />
              </h2>
            </div>

            {/* Level Progress */}
            {nextLevel && (
              <div className="mt-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-white/60">{currentLevel?.name}</span>
                  <span className="text-xs font-bold text-white/60">{nextLevel.name} · {formatCurrency(nextLevelThreshold - totalBalance)} to go</span>
                </div>
                <div className="w-full bg-white/15 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-3 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 shadow-sm shadow-amber-400/30"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Portfolio Breakdown ────────────────── */}
      <div className="px-8 -mt-5 relative z-10 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white dark:bg-[#1a1625] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6 shadow-xl shadow-purple-500/5 dark:shadow-purple-500/10"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Portfolio</h3>
            <span className="text-xs font-medium text-gray-500 dark:text-white/40">{donutData.length} accounts</span>
          </div>

          <div className="flex items-center gap-8">
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
                <div className="w-[140px] h-[140px] rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No funds</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {Object.entries(ACCOUNT_COLORS).map(([key, colors]) => {
                const balance = accounts[key] || 0
                const pct = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(0) : 0

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.hex }} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-white/80">{ACCOUNT_META[key]?.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(balance)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
                        <motion.div
                          className={`h-2 rounded-full bg-gradient-to-r ${colors.gradient}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 tabular-nums w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Account Cards — Colorful gradient cards ─── */}
      <div className="px-8 mb-8">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
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
                transition={{ delay: 0.18 + index * 0.06 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${colors.gradient} shadow-lg`}
                  style={{ boxShadow: `0 8px 24px ${colors.hex}30` }}
                >
                  {/* Decorative circle */}
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                  <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/5 rounded-full" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-white/80" />
                      <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                        {ACCOUNT_META[key]?.label}
                      </span>
                    </div>
                    <p className="text-2xl font-extrabold text-white tabular-nums">
                      <AnimNum value={balance} prefix="$" />
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Quick Actions — Bold and inviting ────── */}
      <div className="px-8 mb-8">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
          Quick Actions
        </h3>

        <div className="space-y-3">
          {[
            { label: 'Log Paycheck', desc: 'Submit your weekly earnings', icon: '💵', color: 'from-emerald-500 to-teal-500', route: '/paycheck' },
            { label: 'Transfer Funds', desc: 'Move money between accounts', icon: '🔄', color: 'from-violet-500 to-purple-500', route: '/transfer' },
            { label: 'Purchase Request', desc: 'Ask to buy something', icon: '🛒', color: 'from-amber-500 to-orange-500', route: '/purchase' },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.36 + index * 0.08 }}
              onClick={() => navigate(action.route)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white dark:bg-[#1a1625] rounded-2xl border border-gray-200 dark:border-white/[0.08] hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-xl shadow-md`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{action.label}</p>
                <p className="text-xs text-gray-500 dark:text-white/40 font-medium">{action.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-white/20 group-hover:text-violet-500 dark:group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Achievements ──────────────────────── */}
      {badges.length > 0 && (
        <div className="px-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Achievements 🏆
            </h3>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{badges.length} earned</span>
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

      {/* ── Learn Section — Fun expandable tips ── */}
      <div className="px-8">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
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
              transition={{ delay: 0.5 + i * 0.08 }}
              className="group bg-white dark:bg-[#1a1625] rounded-2xl border border-gray-200 dark:border-white/[0.08] hover:border-violet-300 dark:hover:border-violet-500/30 transition-colors"
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg">{tip.icon}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white flex-1">{tip.title}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-white/30 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 dark:text-white/50 leading-relaxed border-t border-gray-100 dark:border-white/[0.06] pt-4">
                {tip.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
