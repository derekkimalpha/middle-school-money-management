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

const ACCOUNT_COLORS = {
  checking: { hex: '#7c8c78', label: 'text-sage-600 dark:text-sage-300' },
  savings: { hex: '#6b8a87', label: 'text-stone-600 dark:text-stone-400' },
  sp500: { hex: '#a68b5b', label: 'text-amber dark:text-amber' },
  nasdaq: { hex: '#78716c', label: 'text-stone-600 dark:text-stone-400' },
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
          className="w-12 h-12 border-4 border-gray-200 dark:border-white/[0.12] border-t-pencil dark:border-t-pencil rounded-full"
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

      {/* ── Notebook Header with ruled lines ── */}
      <div className="notebook-ruled notebook-margin px-8 pt-8 pb-6 ml-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-ink-muted dark:text-white/50">
              Welcome back
            </p>
            <h1 className="text-4xl font-hand font-bold text-ink dark:text-chalk-white mt-1">
              {firstName} 👋
            </h1>
          </div>

          {/* Level badge — looks like a sticker */}
          <motion.div
            className="flex items-center gap-2 rounded-lg px-4 py-2 bg-pencil/10 border-2 border-pencil/30 dark:bg-pencil/10 dark:border-pencil/20"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <span className="text-lg">{currentLevel?.icon}</span>
            <span className="text-sm font-hand font-bold text-pencil-dark dark:text-pencil">
              {currentLevel?.name}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Balance Card — like a check or banknote ── */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-sm p-8 bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] shadow-[3px_3px_0px_rgba(0,0,0,0.08)] dark:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] notebook-grid"
        >
          <p className="text-[11px] font-hand font-bold uppercase tracking-widest mb-2 text-ink-muted dark:text-white/50">
            Total Balance
          </p>
          <h2 className="text-5xl font-black tabular-nums text-ink dark:text-chalk-white">
            <AnimNum value={totalBalance} prefix="$" />
          </h2>

          {donutData.length > 0 && (
            <div className="flex items-center justify-center mt-6">
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

      {/* ── Progress — pencil-filled progress bar ── */}
      {nextLevel && (
        <div className="px-8 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-sm p-6 bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] shadow-[2px_2px_0px_rgba(0,0,0,0.06)]"
          >
            <p className="text-[11px] font-hand font-bold uppercase tracking-widest mb-4 text-ink-muted dark:text-white/50">
              Progress to Next Level
            </p>

            <div className="flex items-center gap-4 mb-3">
              <span className="text-2xl flex-shrink-0">{currentLevel?.icon}</span>
              <div className="flex-1">
                <div className="h-4 rounded-sm overflow-hidden bg-paper-warm dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06]">
                  <motion.div
                    className="h-full rounded-sm"
                    style={{
                      background: 'repeating-linear-gradient(45deg, #e8c840, #e8c840 4px, #d4b84c 4px, #d4b84c 8px)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </div>
              <span className="text-2xl flex-shrink-0">{nextLevel?.icon}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-hand font-bold text-ink-muted dark:text-white/50">
                {currentLevel?.name}
              </span>
              <span className="text-xs font-hand font-bold text-ink-muted dark:text-white/50">
                {nextLevel.name} · {formatCurrency(nextLevelThreshold - totalBalance)} to go
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Account Cards — paper cards with colored tape ── */}
      <div className="px-8 mb-6">
        <h3 className="text-[13px] font-hand font-bold text-ink dark:text-chalk-white mb-4 pencil-underline inline-block">
          Your Accounts
        </h3>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {Object.entries(ACCOUNT_COLORS).map(([key, colors], index) => {
            const balance = accounts[key] || 0
            const Icon = ACCOUNT_ICONS[key]

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + index * 0.06 }}
                whileHover={{ y: -4, rotate: index % 2 === 0 ? -0.5 : 0.5 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <div className="relative rounded-sm p-5 bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] shadow-[2px_2px_0px_rgba(0,0,0,0.06)] dark:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] overflow-hidden">
                  {/* Colored tape strip at top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: colors.hex }}
                  />

                  <div className="flex items-center gap-2 mb-4 mt-1">
                    <Icon className="w-4 h-4 text-ink-muted dark:text-white/50" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-white/50">
                      {ACCOUNT_META[key]?.label}
                    </span>
                  </div>

                  <p className="text-2xl font-black tabular-nums text-ink dark:text-chalk-white">
                    <AnimNum value={balance} prefix="$" />
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Quick Actions — like sticky notes ── */}
      <div className="px-8 mb-6">
        <h3 className="text-[13px] font-hand font-bold text-ink dark:text-chalk-white mb-4 pencil-underline inline-block">
          Quick Actions
        </h3>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-8 px-8 mt-4">
          {[
            { label: 'Paycheck', icon: '💵', route: '/paycheck' },
            { label: 'Transfer', icon: '🔄', route: '/transfer' },
            { label: 'Purchase', icon: '🛒', route: '/purchase' },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.32 + index * 0.08 }}
              onClick={() => navigate(action.route)}
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-3 rounded-sm font-hand font-bold text-[15px] whitespace-nowrap flex-shrink-0 bg-pencil/10 border-2 border-pencil/30 text-pencil-dark dark:bg-pencil/10 dark:border-pencil/20 dark:text-pencil hover:bg-pencil/20 transition-colors"
            >
              <span>{action.icon}</span>
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Achievements ── */}
      {badges.length > 0 && (
        <div className="px-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-hand font-bold text-ink dark:text-chalk-white pencil-underline inline-block">
              Achievements
            </h3>
            <span className="text-xs font-hand font-bold text-pencil-dark dark:text-pencil">
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

      {/* ── Portfolio Breakdown — graph paper style ── */}
      <div className="px-8 mb-6">
        <h3 className="text-[13px] font-hand font-bold text-ink dark:text-chalk-white mb-4 pencil-underline inline-block">
          Portfolio Breakdown
        </h3>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.20 }}
          className="rounded-sm p-6 bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] shadow-[2px_2px_0px_rgba(0,0,0,0.06)] notebook-grid mt-4"
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
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: colors.hex }}
                      />
                      <span className="text-sm font-semibold text-ink-light dark:text-white/70">
                        {ACCOUNT_META[key]?.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-ink dark:text-chalk-white">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 rounded-sm overflow-hidden bg-paper-warm dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04]">
                      <motion.div
                        className="h-full rounded-sm"
                        style={{ backgroundColor: colors.hex }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                    <span className="text-xs font-hand font-bold tabular-nums w-8 text-right text-ink-muted dark:text-white/50">
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Learn Section — notebook tips ── */}
      <div className="px-8">
        <h3 className="text-[13px] font-hand font-bold text-ink dark:text-chalk-white mb-4 pencil-underline inline-block">
          Level Up Your Knowledge
        </h3>
        <div className="space-y-3 mt-4">
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
              className="group rounded-sm border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.04] shadow-[2px_2px_0px_rgba(0,0,0,0.04)]"
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-paper-warm dark:hover:bg-white/[0.02]">
                <span className="text-lg">{tip.icon}</span>
                <span className="text-sm font-bold flex-1 text-ink dark:text-chalk-white">
                  {tip.title}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-ink-faint dark:text-white/30" />
              </summary>
              <div className="px-5 pb-4 text-sm leading-relaxed border-t border-black/[0.06] dark:border-white/[0.06] pt-4 text-ink-light dark:text-white/60 notebook-ruled notebook-margin ml-2">
                {tip.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
