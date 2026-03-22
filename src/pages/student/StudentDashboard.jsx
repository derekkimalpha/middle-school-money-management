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

// Consistent account color system
const ACCOUNT_COLORS = {
  checking: { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400' },
  savings: { hex: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-400' },
  sp500: { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400' },
  nasdaq: { hex: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-400' },
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
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <motion.div
          className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-800 rounded-full"
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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-24 transition-colors duration-300">
      <Toast message={toast} />

      {/* ── Hero Section ──────────────────────────────── */}
      <div className="bg-slate-900 dark:bg-gray-900 text-white px-6 pt-8 pb-16 relative overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-20 w-72 h-72 bg-emerald-500 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-violet-500 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-10 right-20 w-40 h-40 bg-cyan-500 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-400 text-sm font-medium">Welcome back</p>
              <h1 className="text-2xl font-bold mt-0.5">{firstName}</h1>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="text-base">{currentLevel?.icon}</span>
              <span className="text-xs font-semibold">{currentLevel?.name}</span>
            </div>
          </div>

          {/* Balance display */}
          <div className="mb-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold tracking-tight">
              <AnimNum value={totalBalance} prefix="$" />
            </h2>
          </div>

          {/* Level progress */}
          {nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-400">{currentLevel?.name}</span>
                <span className="text-xs text-slate-400">{nextLevel.name} · {formatCurrency(nextLevelThreshold - totalBalance)} to go</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div
                  className="bg-emerald-400 h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Portfolio Breakdown Card ──────────────────── */}
      <div className="px-6 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 p-6 transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Portfolio</h3>
            <span className="text-xs text-slate-500">{donutData.length} accounts</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Donut chart */}
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
                <div className="w-[140px] h-[140px] rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No funds</span>
                </div>
              )}
            </div>

            {/* Account legend */}
            <div className="flex-1 space-y-3">
              {Object.entries(ACCOUNT_COLORS).map(([key, colors]) => {
                const balance = accounts[key] || 0
                const pct = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(0) : 0

                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.hex }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{ACCOUNT_META[key]?.label}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(balance)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-slate-100 dark:bg-gray-800 rounded-full h-1">
                          <motion.div
                            className="h-1 rounded-full"
                            style={{ backgroundColor: colors.hex }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium tabular-nums w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Account Cards ─────────────────────────────── */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Accounts</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ACCOUNT_COLORS).map(([key, colors], index) => {
            const balance = accounts[key] || 0
            const Icon = ACCOUNT_ICONS[key]

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className={`${colors.bg} ${colors.border} border rounded-xl p-4 relative overflow-hidden`}
              >
                <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10 dark:opacity-20" style={{ backgroundColor: colors.hex }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}>
                      {ACCOUNT_META[key]?.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    <AnimNum value={balance} prefix="$" />
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────── */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Quick Actions</h3>
        </div>

        <div className="space-y-2.5">
          {[
            { label: 'Log Paycheck', desc: 'Submit your weekly earnings', icon: DollarSign, color: 'bg-emerald-600', route: '/paycheck' },
            { label: 'Transfer Funds', desc: 'Move money between accounts', icon: Send, color: 'bg-slate-900', route: '/transfer' },
            { label: 'Purchase Request', desc: 'Ask to buy something', icon: ShoppingCart, color: 'bg-amber-600', route: '/purchase' },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
              onClick={() => navigate(action.route)}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:shadow-sm transition-all text-left group"
            >
              <div className={`${action.color} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.label}</p>
                <p className="text-xs text-slate-500 dark:text-gray-500">{action.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-gray-600 group-hover:text-slate-600 dark:group-hover:text-gray-300 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Achievements ──────────────────────────────── */}
      {badges.length > 0 && (
        <div className="px-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Achievements</h3>
            <span className="text-xs text-slate-500">{badges.length} earned</span>
          </div>
          <div className="overflow-x-auto pb-2 -mx-6 px-6">
            <div className="flex gap-3 min-w-max">
              {badges.slice(0, 8).map((badge, index) => (
                <Badge key={badge.id} badge={badge} delay={index * 0.08} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Learn Section ─────────────────────────────── */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Learn</h3>
        </div>
        <div className="space-y-2.5">
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
              className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 group"
            >
              <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg">{tip.icon}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white flex-1">{tip.title}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4 text-sm text-slate-600 dark:text-gray-400 leading-relaxed border-t border-slate-100 dark:border-gray-800 pt-3">
                {tip.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
