import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AnimNum,
  DonutChart,
  FinTip,
  LevelRing,
  Streak,
  Badge,
  Button,
  TiltCard,
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
import { ArrowRight, TrendingUp, Send, ShoppingCart } from 'lucide-react'

const QUIPS = [
  'Ready to level up your money game?',
  'Time to make your money work for you!',
  'Let\'s grow that wealth!',
  'Your financial journey starts here!',
  'Every dollar counts!',
  'You got this!',
  'Making money moves today?',
  'Let\'s check on your empire!',
]

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [streak, setStreak] = useState(0)
  const [badges, setBadges] = useState([])
  const [toast, setToast] = useState(null)
  const { accounts, loading } = useAccounts(profile?.id)

  // Get random quip
  const randomQuip = QUIPS[Math.floor(Math.random() * QUIPS.length)]

  // Fetch streak and badges
  useEffect(() => {
    if (!profile?.id) return

    const fetchStreakAndBadges = async () => {
      try {
        // Fetch streak
        const { data: streakData } = await supabase
          .from('students')
          .select('streak')
          .eq('id', profile.id)
          .single()

        if (streakData) {
          setStreak(streakData.streak || 0)
        }

        // Fetch badges
        const { data: badgeData } = await supabase
          .from('student_badges')
          .select('badge_id, badges:badge_definitions(*)')
          .eq('student_id', profile.id)

        if (badgeData) {
          const formattedBadges = badgeData.map((sb) => ({
            id: sb.badge_id,
            title: sb.badges?.title || '',
            icon: sb.badges?.icon || '',
            description: sb.badges?.description || '',
            earned: true,
          }))
          setBadges(formattedBadges)
        }
      } catch (error) {
        console.error('Error fetching streak and badges:', error)
      }
    }

    fetchStreakAndBadges()
  }, [profile?.id])

  if (loading || !accounts || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-400"></div>
      </div>
    )
  }

  // Calculate total balance
  const totalBalance = Object.values(accounts).reduce((sum, bal) => sum + bal, 0)
  const currentLevel = getLevel(totalBalance)
  const nextLevel = getNextLevel(totalBalance)

  // Prepare donut chart data
  const chartData = Object.entries(accounts)
    .filter(([key]) => key !== 'bonus')
    .map(([key, value]) => ({
      label: ACCOUNT_META[key]?.label || key,
      value,
      color: ACCOUNT_META[key]?.color?.replace('text-', 'rgb(') || '#ccc',
    }))
    .map((item) => {
      // Convert Tailwind color to RGB (simplified mapping)
      const colorMap = {
        'text-sage': '#7EA58C',
        'text-teal': '#14B8A6',
        'text-amber': '#F59E0B',
        'text-plum': '#A855F7',
      }
      return {
        ...item,
        color:
          colorMap[ACCOUNT_META[Object.keys(accounts).find((k) => ACCOUNT_META[k]?.label === item.label)]?.color] ||
          '#ccc',
      }
    })

  // Filter and prepare chart colors correctly
  const donutChartData = [
    { value: accounts.checking || 0, color: '#7EA58C' },
    { value: accounts.savings || 0, color: '#14B8A6' },
    { value: accounts.sp500 || 0, color: '#F59E0B' },
    { value: accounts.nasdaq || 0, color: '#A855F7' },
  ].filter((item) => item.value > 0)

  const nextLevelThreshold = nextLevel?.min || totalBalance

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray to-white p-6 pb-20">
      <Toast message={toast} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Hey {profile?.first_name || 'Friend'}
            </h1>
            <p className="text-slate-600 mt-2 italic">{randomQuip}</p>
          </div>
          <Streak count={streak} />
        </div>
      </motion.div>

      {/* Hero Card with DonutChart and LevelRing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-8 mb-8"
      >
        <div className="grid grid-cols-2 gap-8 items-center mb-8">
          {/* DonutChart */}
          <div className="flex justify-center">
            {donutChartData.length > 0 ? (
              <DonutChart data={donutChartData} size={200} stroke={16} />
            ) : (
              <div className="text-center text-slate-400">No accounts yet</div>
            )}
          </div>

          {/* LevelRing and Stats */}
          <div className="flex flex-col items-center gap-6">
            <LevelRing total={totalBalance} />
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">
                Total Balance
              </p>
              <h2 className="text-3xl font-bold text-slate-900">
                <AnimNum value={totalBalance} prefix="$" />
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Level: {currentLevel?.name || 'N/A'}{' '}
                {currentLevel?.icon}
              </p>
            </div>
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">
                Progress to {nextLevel.name}
              </span>
              <span className="text-xs text-slate-600">
                ${(nextLevelThreshold - totalBalance).toLocaleString()} away
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-sage-400 to-green-400 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min((totalBalance / nextLevelThreshold) * 100, 100)}%`,
                }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}

        <FinTip
          icon="💭"
          title="Why Multiple Accounts?"
          color="from-blue-50 to-cyan-50"
        >
          Different accounts serve different purposes. Checking for daily needs,
          Savings for safety nets, S&P 500 for long-term growth, and NASDAQ for
          tech-focused investing. Diversification helps you build wealth
          strategically!
        </FinTip>
      </motion.div>

      {/* Achievements Section */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Achievements
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {badges.slice(0, 6).map((badge, index) => (
                <Badge key={badge.id} badge={badge} delay={index * 0.1} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Accounts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-4">Your Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.entries(accounts)
            .filter(([key]) => key !== 'bonus')
            .map(([key, balance], index) => {
              const meta = ACCOUNT_META[key]
              const Icon = meta?.icon
              const percentage = (balance / totalBalance) * 100

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div
                    className={`${meta?.bgColor} border-2 ${meta?.borderColor} rounded-xl p-4`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {meta?.label}
                        </p>
                        <h4 className={`text-2xl font-bold ${meta?.color} mt-1`}>
                          <AnimNum value={balance} prefix="$" />
                        </h4>
                      </div>
                      {Icon && <Icon className={`${meta?.color} w-5 h-5`} />}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-600">
                        <span>% of total</span>
                        <span className="font-semibold">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/50 rounded-full h-1.5">
                        <motion.div
                          className={`h-1.5 rounded-full ${
                            meta?.color?.replace('text-', 'bg-')
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
        </div>

        {/* FinTips for each account */}
        <div className="space-y-3 mb-6">
          <FinTip
            icon="🏦"
            title="Checking Account"
            color="from-blue-50 to-cyan-50"
          >
            Your everyday spending account. Keep funds here for bills, groceries,
            and immediate expenses.
          </FinTip>

          <FinTip
            icon="🪴"
            title="Savings Account"
            color="from-green-50 to-teal-50"
          >
            Your safety net and emergency fund. Keep 3-6 months of expenses here
            for unexpected costs.
          </FinTip>

          <FinTip
            icon="📈"
            title="S&P 500"
            color="from-amber-50 to-orange-50"
          >
            Invest in the 500 largest US companies. Lower risk, steady growth over
            the long term.
          </FinTip>

          <FinTip
            icon="📊"
            title="NASDAQ"
            color="from-purple-50 to-pink-50"
          >
            Invest in tech and growth companies. Higher risk, higher potential
            returns.
          </FinTip>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TiltCard>
            <button
              onClick={() => navigate('/paycheck')}
              className="w-full h-full p-6 rounded-xl bg-gradient-to-br from-green-400 to-sage-400 text-white hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col items-center justify-center gap-3 h-full">
                <div className="text-3xl">💰</div>
                <div className="text-center">
                  <h4 className="font-bold text-lg">Log Paycheck</h4>
                  <p className="text-sm opacity-90 mt-1">
                    Record your earnings
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 mt-auto" />
              </div>
            </button>
          </TiltCard>

          <TiltCard>
            <button
              onClick={() => navigate('/transfer')}
              className="w-full h-full p-6 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-white hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col items-center justify-center gap-3 h-full">
                <Send className="w-8 h-8" />
                <div className="text-center">
                  <h4 className="font-bold text-lg">Transfer</h4>
                  <p className="text-sm opacity-90 mt-1">Move between accounts</p>
                </div>
                <ArrowRight className="w-4 h-4 mt-auto" />
              </div>
            </button>
          </TiltCard>

          <TiltCard>
            <button
              onClick={() => navigate('/purchase')}
              className="w-full h-full p-6 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col items-center justify-center gap-3 h-full">
                <ShoppingCart className="w-8 h-8" />
                <div className="text-center">
                  <h4 className="font-bold text-lg">Purchase Request</h4>
                  <p className="text-sm opacity-90 mt-1">Ask to buy something</p>
                </div>
                <ArrowRight className="w-4 h-4 mt-auto" />
              </div>
            </button>
          </TiltCard>
        </div>
      </motion.div>
    </div>
  )
}
