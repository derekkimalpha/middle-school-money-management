import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AnimNum,
  DonutChart,
  Toast,
  Confetti,
} from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { usePaycheckSettings } from '../../hooks/usePaycheckSettings'
import { useGrowthLog } from '../../hooks/useGrowthLog'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useStreak } from '../../hooks/useStreak'
import {
  ACCOUNT_META,
  formatCurrency,
  getLevel,
  getNextLevel,
  LEVELS,
} from '../../lib/constants'
import {
  TrendingUp, Send, ShoppingCart, Wallet, PiggyBank,
  BarChart3, ChevronRight, Banknote, ArrowUpRight,
  Sprout, Trophy, Flame, Target, Sparkles, BookOpen,
  Clock, Star,
} from 'lucide-react'

const ACCOUNT_COLORS = {
  checking: { hex: '#7c8c78', light: 'rgba(124,140,120,0.08)', accent: 'text-sage dark:text-sage-300' },
  savings:  { hex: '#6b8a87', light: 'rgba(107,138,135,0.08)', accent: 'text-teal dark:text-teal' },
  sp500:    { hex: '#a68b5b', light: 'rgba(166,139,91,0.08)', accent: 'text-amber dark:text-amber' },
  nasdaq:   { hex: '#78716c', light: 'rgba(120,113,108,0.08)', accent: 'text-stone-500 dark:text-stone-400' },
}

const ACCOUNT_ICONS = {
  checking: Wallet,
  savings: PiggyBank,
  sp500: TrendingUp,
  nasdaq: BarChart3,
}

const ACCOUNT_SUBTITLES = {
  checking: 'Everyday spending',
  savings: 'Growing with interest',
  sp500: 'Top 500 U.S. companies',
  nasdaq: 'Tech & growth companies',
}

const DAILY_TIPS = [
  { tip: 'Saving $5 a week for a year = $260. That\'s a PS5 controller, AirPods, or 52 boba teas.', icon: '💰' },
  { tip: 'Jeff Bezos made his first investment at age 12. You\'re literally on track.', icon: '🚀' },
  { tip: 'The S&P 500 has turned $100 into $30,000+ over 50 years. Patience pays.', icon: '📈' },
  { tip: 'Warren Buffett started investing at age 11 and regretted not starting earlier.', icon: '🧓' },
  { tip: 'Compound interest is the 8th wonder of the world — Einstein said it (probably).', icon: '✨' },
  { tip: 'The earlier you invest, the more time compound interest has to grow your money.', icon: '⏰' },
  { tip: 'A budget isn\'t a restriction — it\'s a plan for your money.', icon: '📋' },
  { tip: 'Diversifying means not putting all your eggs in one basket.', icon: '🥚' },
  { tip: 'An emergency fund should cover 3-6 months of expenses. Future you will thank present you.', icon: '🛡️' },
  { tip: 'The 50/30/20 rule: 50% needs, 30% wants, 20% savings. Adults use this too.', icon: '✂️' },
  { tip: 'Dollar-cost averaging means investing the same amount regularly, regardless of price.', icon: '💳' },
  { tip: 'Tech stocks can grow fast, but they can also fall fast. That\'s volatility, baby.', icon: '🎢' },
  { tip: 'A stock is a tiny piece of a company. You\'re literally an owner.', icon: '🏢' },
  { tip: 'Time in the market beats timing the market. Start now, not later.', icon: '🕐' },
  { tip: 'Inflation means your money loses buying power over time — investing fights back.', icon: '🔥' },
]

const MILESTONES = [100, 250, 500, 1000, 2000, 5000]

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [toast, setToast] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const { accounts, loading } = useAccounts(profile?.id)
  const { settings } = usePaycheckSettings()
  const growthLog = useGrowthLog(profile?.id)
  const { leaderboard, myRank } = useLeaderboard(profile?.id, false)
  const { streak } = useStreak(profile?.id)

  // Get daily tip based on day of year
  const dailyTip = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
    const dayNumber = dayOfYear % DAILY_TIPS.length
    return { ...DAILY_TIPS[dayNumber], dayNumber: dayNumber + 1 }
  }, [])

  // Calculate estimated monthly earnings
  const earningsEstimate = useMemo(() => {
    if (!accounts) return { monthly: 0, savingsRate: 0, breakdown: {} }
    const savingsBalance = accounts.savings || 0
    const savingsApy = settings?.savings_interest_rate ?? 4.5
    const monthlyInterest = savingsBalance * (savingsApy / 100 / 12)
    const sp500Monthly = (accounts.sp500 || 0) * 0.008
    const nasdaqMonthly = (accounts.nasdaq || 0) * 0.01
    const total = monthlyInterest + sp500Monthly + nasdaqMonthly
    return {
      monthly: Math.round(total * 100) / 100,
      savingsRate: savingsApy,
      breakdown: {
        savings: Math.round(monthlyInterest * 100) / 100,
        sp500: Math.round(sp500Monthly * 100) / 100,
        nasdaq: Math.round(nasdaqMonthly * 100) / 100,
      }
    }
  }, [accounts, settings])

  // Check for milestone celebrations
  useEffect(() => {
    if (!accounts) return
    const total = Object.entries(accounts)
      .filter(([key]) => key !== 'bonus')
      .reduce((sum, [, bal]) => sum + bal, 0)

    const lastMilestone = localStorage.getItem('lastMilestone') || '0'
    const currentMilestone = MILESTONES.filter(m => total >= m).pop() || 0

    if (currentMilestone > parseInt(lastMilestone)) {
      localStorage.setItem('lastMilestone', String(currentMilestone))
      if (parseInt(lastMilestone) > 0) {
        setShowConfetti(true)
        setToast({ type: 'success', text: `Milestone reached: $${currentMilestone}!` })
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }
  }, [accounts])

  if (loading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="w-10 h-10 border-3 border-stone-200 dark:border-white/10 border-t-sage dark:border-t-sage rounded-full"
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
  const levelProgress = nextLevel
    ? Math.min(((totalBalance - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100, 100)
    : 100

  const donutData = Object.entries(ACCOUNT_COLORS)
    .filter(([key]) => (accounts[key] || 0) > 0)
    .map(([key, colors]) => ({
      value: accounts[key],
      color: colors.hex,
    }))

  const firstName = profile?.full_name?.split(' ')[0] || 'Friend'

  return (
    <div className="pb-24 max-w-3xl mx-auto">
      <Toast message={toast} />
      {showConfetti && <Confetti />}

      {/* ── Header with Streak ── */}
      <div className="px-8 pt-10 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-ink-muted dark:text-white/40 mb-1">Welcome back,</p>
              <h1 className="text-4xl font-hand font-bold text-ink dark:text-chalk-white leading-tight">
                {firstName}
              </h1>
            </div>
            {streak > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pencil/10 border border-pencil/20"
              >
                <Flame className="w-4 h-4 text-pencil" />
                <span className="text-sm font-hand font-bold text-pencil">{streak}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Net Worth ── */}
      <div className="px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 mb-2">
            Net Worth
          </p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-6xl font-black tabular-nums tracking-tight text-ink dark:text-chalk-white">
              <AnimNum value={totalBalance} prefix="$" />
            </h2>
            {earningsEstimate.monthly > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-1 text-sm font-semibold text-sage dark:text-sage-300"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                ~{formatCurrency(earningsEstimate.monthly)}/mo
              </motion.span>
            )}
          </div>

          {/* Real vs Projected earnings */}
          <div className="flex items-center gap-4 mt-2">
            {growthLog.total > 0 && (
              <span className="text-[11px] text-sage-dark dark:text-sage-300 font-semibold">
                +{formatCurrency(growthLog.total)} earned
              </span>
            )}
            {earningsEstimate.monthly > 0 && (
              <span className="text-[11px] text-ink-faint dark:text-white/30">
                {earningsEstimate.savingsRate}% APY + market returns
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Allocation (Donut + Legend) ── */}
      {donutData.length > 0 && (
        <div className="px-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="flex items-center gap-10"
          >
            <div className="flex-shrink-0">
              <DonutChart
                data={donutData}
                size={130}
                stroke={16}
                centerValue=""
                centerLabel=""
              />
            </div>
            <div className="flex-1 space-y-3.5">
              {Object.entries(ACCOUNT_COLORS).map(([key, colors]) => {
                const balance = accounts[key] || 0
                const pct = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(0) : 0
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.hex }}
                      />
                      <span className="text-[13px] text-ink-light dark:text-white/60">
                        {ACCOUNT_META[key]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold tabular-nums text-ink dark:text-chalk-white">
                        {formatCurrency(balance)}
                      </span>
                      <span className="text-[11px] tabular-nums text-ink-faint dark:text-white/30 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Level Progress ── */}
      <div className="px-8 mb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-pencil" />
              <span className="text-xs font-bold text-ink-muted dark:text-white/40 uppercase tracking-wider">
                {currentLevel?.name}
              </span>
            </div>
            {nextLevel ? (
              <span className="text-xs font-medium text-ink-faint dark:text-white/30">
                {formatCurrency(nextLevel.min - totalBalance)} to {nextLevel.name}
              </span>
            ) : (
              <span className="text-xs font-medium text-pencil">Max Level!</span>
            )}
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-surface-3 dark:bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-pencil-dark to-pencil"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
            />
          </div>
        </motion.div>
      </div>

      {/* ── Divider ── */}
      <div className="px-8 mb-6">
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />
      </div>

      {/* ── Account Cards (tappable for investments) ── */}
      <div className="px-8 mb-8">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ACCOUNT_COLORS).map(([key, colors], index) => {
            const balance = accounts[key] || 0
            const Icon = ACCOUNT_ICONS[key]
            const isInvestment = key === 'sp500' || key === 'nasdaq'
            const earnedForType = key === 'sp500' ? growthLog.sp500 :
                                  key === 'nasdaq' ? growthLog.nasdaq :
                                  key === 'savings' ? growthLog.savings : 0

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + index * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={isInvestment ? { scale: 0.97 } : undefined}
                onClick={isInvestment ? () => navigate(`/invest/${key}`) : undefined}
                className={`group ${isInvestment ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`rounded-xl p-5 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] transition-shadow hover:shadow-sm ${isInvestment ? 'hover:border-black/[0.12] dark:hover:border-white/[0.12]' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: colors.light }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: colors.hex }} />
                      </div>
                      <span className="text-[11px] font-semibold text-ink-muted dark:text-white/50 uppercase tracking-wider">
                        {ACCOUNT_META[key]?.label}
                      </span>
                    </div>
                    {isInvestment && (
                      <ChevronRight className="w-3.5 h-3.5 text-ink-faint dark:text-white/20 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>

                  <p className="text-2xl font-black tabular-nums text-ink dark:text-chalk-white mb-1">
                    <AnimNum value={balance} prefix="$" />
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-ink-faint dark:text-white/25">
                      {ACCOUNT_SUBTITLES[key]}
                    </p>
                    {earnedForType > 0 && (
                      <span className="text-[10px] font-semibold text-sage dark:text-sage-300">
                        +{formatCurrency(earnedForType)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-8 mb-8">
        <div className="flex gap-2">
          {[
            { label: 'Log Pay', Icon: Banknote, route: '/paycheck' },
            { label: 'Transfer', Icon: Send, route: '/transfer' },
            { label: 'Buy', Icon: ShoppingCart, route: '/purchase' },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.06 }}
              onClick={() => navigate(action.route)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold transition-colors hover:bg-ink/90 dark:hover:bg-chalk-white/90"
            >
              <action.Icon className="w-4 h-4" />
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Leaderboard Teaser ── */}
      {myRank && leaderboard.length > 1 && (
        <div className="px-8 mb-8">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            onClick={() => navigate('/leaderboard')}
            className="w-full text-left"
          >
            <div className="rounded-xl p-4 border border-pencil/20 dark:border-pencil/10 bg-pencil/[0.04] hover:bg-pencil/[0.07] transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pencil/15 flex items-center justify-center">
                    <Trophy className="w-4.5 h-4.5 text-pencil" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                      You're ranked #{myRank}
                    </p>
                    <p className="text-[11px] text-ink-muted dark:text-white/40">
                      out of {leaderboard.length} students
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-faint dark:text-white/20 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {/* ── Enhanced Earnings Snapshot ── */}
      {(growthLog.total > 0 || earningsEstimate.monthly > 0) && (
        <div className="px-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl p-6 border border-sage/20 dark:border-sage/10 bg-sage-bg dark:bg-sage/[0.04]"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sage/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sprout className="w-5 h-5 text-sage-dark dark:text-sage-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink dark:text-chalk-white mb-3">
                  Your Money is Growing
                </p>

                <div className="space-y-2.5">
                  {growthLog.total > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-ink-light dark:text-white/60">Earned so far</span>
                      <span className="text-[14px] font-bold text-sage-dark dark:text-sage-300">
                        +{formatCurrency(growthLog.total)}
                      </span>
                    </div>
                  )}

                  {earningsEstimate.monthly > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-ink-light dark:text-white/60">Projected monthly</span>
                      <span className="text-[14px] font-bold text-sage-dark dark:text-sage-300">
                        ~{formatCurrency(earningsEstimate.monthly)}/mo
                      </span>
                    </div>
                  )}
                </div>

                {(earningsEstimate.breakdown.savings > 0 || earningsEstimate.breakdown.sp500 > 0 || earningsEstimate.breakdown.nasdaq > 0) && (
                  <div className="mt-3 pt-3 border-t border-sage/20 dark:border-sage/10 space-y-1.5">
                    {earningsEstimate.breakdown.savings > 0 && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-ink-light dark:text-white/50">Savings interest</span>
                        <span className="text-sage-dark dark:text-sage-300 font-semibold">
                          +{formatCurrency(earningsEstimate.breakdown.savings)}/mo
                        </span>
                      </div>
                    )}
                    {earningsEstimate.breakdown.sp500 > 0 && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-ink-light dark:text-white/50">S&P 500 gains</span>
                        <span className="text-sage-dark dark:text-sage-300 font-semibold">
                          +{formatCurrency(earningsEstimate.breakdown.sp500)}/mo
                        </span>
                      </div>
                    )}
                    {earningsEstimate.breakdown.nasdaq > 0 && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-ink-light dark:text-white/50">NASDAQ gains</span>
                        <span className="text-sage-dark dark:text-sage-300 font-semibold">
                          +{formatCurrency(earningsEstimate.breakdown.nasdaq)}/mo
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Daily Discovery Card (Daily Tip Redesigned) ── */}
      <div className="px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.52, type: 'spring', stiffness: 100 }}
          className="rounded-2xl p-6 overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(166,139,91,0.15) 0%, rgba(124,140,120,0.1) 100%)',
            border: '1px solid rgba(166,139,91,0.2)',
          }}
        >
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-amber/10 -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10">
            {/* Big emoji */}
            <div className="text-6xl mb-4">{dailyTip.icon}</div>

            {/* Header */}
            <h3 className="text-[18px] font-hand font-bold text-ink dark:text-chalk-white mb-3">
              Money Moves
            </h3>

            {/* Tip text */}
            <p className="text-base leading-relaxed text-ink-light dark:text-white/70 mb-4">
              {dailyTip.tip}
            </p>

            {/* Day indicator */}
            <p className="text-[12px] font-medium text-ink-muted dark:text-white/40">
              Day {dailyTip.dayNumber} of your journey
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Milestones (Goals) ── */}
      {nextLevel && (
        <div className="px-8 mb-8">
          <h3 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
            Milestones
          </h3>
          <div className="space-y-2">
            {/* Next level */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-pencil/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-pencil" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                  Reach {nextLevel.name} level
                </p>
                <p className="text-[11px] text-ink-faint dark:text-white/30">
                  {formatCurrency(nextLevel.min - totalBalance)} to go
                </p>
              </div>
              <div className="w-16">
                <div className="h-1.5 rounded-full bg-surface-3 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-pencil"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Next monetary milestone */}
            {(() => {
              const nextMilestone = MILESTONES.find(m => totalBalance < m)
              if (!nextMilestone) return null
              const pct = (totalBalance / nextMilestone) * 100
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-amber-bg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                      ${nextMilestone} milestone
                    </p>
                    <p className="text-[11px] text-ink-faint dark:text-white/30">
                      {formatCurrency(nextMilestone - totalBalance)} to go
                    </p>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 rounded-full bg-surface-3 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Streak milestone */}
            {streak < 5 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-rose-bg flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4 h-4 text-rose" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                    5-week streak
                  </p>
                  <p className="text-[11px] text-ink-faint dark:text-white/30">
                    {5 - streak} more week{5 - streak !== 1 ? 's' : ''} to go
                  </p>
                </div>
                <div className="w-16">
                  <div className="h-1.5 rounded-full bg-surface-3 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose"
                      style={{ width: `${(streak / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Learn Section ── */}
      <div className="px-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider">
            Learn
          </h3>
          <button
            onClick={() => navigate('/learn')}
            className="text-[11px] font-medium text-sage dark:text-sage-300 flex items-center gap-1 hover:opacity-70"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {[
            { title: 'Why spread your money around?', body: 'Diversifying means spreading your money across different account types for different goals — checking for daily use, savings for safety, investments for growth.' },
            { title: 'S&P 500 vs NASDAQ', body: 'S&P 500 tracks 500 large companies for steady growth. NASDAQ focuses on tech companies, which can grow faster but are riskier. Both are great for long-term investing!' },
            { title: 'The 50/30/20 Rule', body: '50% needs, 30% wants, 20% savings. A simple framework real adults use to budget their paychecks.' },
          ].map((tip, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.56 + i * 0.06 }}
              className="group rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03] overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-paper-warm/50 dark:hover:bg-white/[0.02] transition-colors">
                <span className="text-[13px] font-bold text-ink dark:text-chalk-white">
                  {tip.title}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-ink-faint dark:text-white/20" />
              </summary>
              <div className="px-5 pb-4 text-[13px] leading-relaxed border-t border-black/[0.04] dark:border-white/[0.04] pt-3 text-ink-light dark:text-white/50">
                {tip.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
