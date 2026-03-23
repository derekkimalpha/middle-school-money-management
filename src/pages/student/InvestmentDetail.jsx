import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Info, ChevronRight } from 'lucide-react'
import { AnimNum, Toast } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { useGrowthLog } from '../../hooks/useGrowthLog'
import { formatCurrency } from '../../lib/constants'

const TIME_PERIODS = [
  { key: '1W', label: '1W', days: 7 },
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 90 },
  { key: 'YTD', label: 'YTD', days: null },
  { key: 'ALL', label: 'All', days: null },
]

const INVESTMENT_INFO = {
  sp500: {
    name: 'S&P 500',
    ticker: 'SPY',
    icon: TrendingUp,
    color: '#a68b5b',
    lightBg: 'rgba(166,139,91,0.08)',
    description: 'The S&P 500 is like owning a tiny slice of the 500 biggest companies in America — all at once.',
    whatYouOwn: 'Your money is spread across companies you use every day: Apple (iPhones), Amazon (online shopping), Nike (shoes), Disney (movies), Tesla (cars), Google (search), and 494 more. Instead of betting on one company, you own a piece of all of them.',
    riskLevel: 'Moderate',
    historicalReturn: '~10% per year (long-term average)',
    learnCards: [
      {
        title: 'What is an index fund?',
        body: 'An index fund is a collection of stocks bundled together. Instead of picking one company, you invest in hundreds at once. This is called diversification — it spreads your risk so one bad company won\'t ruin your whole investment.',
      },
      {
        title: 'Why do prices go up and down?',
        body: 'Stock prices change based on how well companies are doing, news events, and how people feel about the economy. Short-term drops are normal — what matters is the long-term trend, which has historically been upward.',
      },
      {
        title: 'Dollar-cost averaging',
        body: 'This means investing a fixed amount regularly (like every paycheck) regardless of the price. When prices are low, your money buys more shares. When high, it buys fewer. Over time, this smooths out the ups and downs.',
      },
      {
        title: 'The power of time',
        body: '$100 invested in the S&P 500 in 2000 would be worth roughly $600 today. The key is patience — the longer you stay invested, the more your money can grow through compound returns.',
      },
    ],
  },
  nasdaq: {
    name: 'NASDAQ',
    ticker: 'QQQ',
    icon: BarChart3,
    color: '#78716c',
    lightBg: 'rgba(120,113,108,0.08)',
    description: 'The NASDAQ is like a tech-heavy version of the S&P 500 — focused on the 100 biggest innovative companies.',
    whatYouOwn: 'This is dominated by the tech giants you know: Apple, Microsoft, NVIDIA (AI chips), Meta (Instagram), Tesla, Netflix, and Google. It goes up faster in good times but drops harder in bad times — that\'s the trade-off for higher potential returns.',
    riskLevel: 'Higher',
    historicalReturn: '~12% per year (but more volatile)',
    learnCards: [
      {
        title: 'Tech-heavy means more swings',
        body: 'Because the NASDAQ is dominated by tech companies, it tends to go up faster during good times but fall harder during bad times. This higher risk is why it historically offers higher returns than the S&P 500.',
      },
      {
        title: 'What does "volatile" mean?',
        body: 'Volatility measures how much prices swing up and down. High volatility means bigger daily changes. It\'s not necessarily bad — it just means you need to be prepared for a bumpier ride in exchange for potentially higher growth.',
      },
      {
        title: 'Growth vs. value',
        body: 'NASDAQ companies are mostly "growth" companies — they reinvest profits to grow bigger rather than paying dividends. This means you make money when the stock price goes up, not from regular payments.',
      },
      {
        title: 'Why diversify beyond tech?',
        body: 'Having money in both S&P 500 (broad market) and NASDAQ (tech-focused) is smart because they don\'t always move together. When tech struggles, other sectors might hold steady, and vice versa.',
      },
    ],
  },
}

export const InvestmentDetail = () => {
  const { type } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts } = useAccounts(profile?.id)
  const growthLog = useGrowthLog(profile?.id)
  const [selectedPeriod, setSelectedPeriod] = useState('ALL')
  const [toast, setToast] = useState(null)

  const info = INVESTMENT_INFO[type]
  if (!info) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10 text-center">
        <p className="text-ink-muted dark:text-white/40">Investment type not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sage underline text-sm">Go back</button>
      </div>
    )
  }

  const balance = accounts?.[type] || 0
  const Icon = info.icon

  // Filter timeline for this account type
  const accountTimeline = useMemo(() => {
    if (!growthLog.timeline) return []
    return growthLog.timeline.filter(d => d[type] !== undefined && d[type] !== 0)
  }, [growthLog.timeline, type])

  // Filter by time period
  const filteredTimeline = useMemo(() => {
    if (accountTimeline.length === 0) return []
    const now = new Date()

    if (selectedPeriod === 'ALL') return accountTimeline

    if (selectedPeriod === 'YTD') {
      const yearStart = `${now.getFullYear()}-01-01`
      return accountTimeline.filter(d => d.date >= yearStart)
    }

    const period = TIME_PERIODS.find(p => p.key === selectedPeriod)
    if (!period?.days) return accountTimeline

    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - period.days)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return accountTimeline.filter(d => d.date >= cutoffStr)
  }, [accountTimeline, selectedPeriod])

  // Calculate total gains for this account
  const totalGains = type === 'sp500' ? growthLog.sp500 : growthLog.nasdaq
  const isPositive = totalGains >= 0

  // Simple sparkline chart
  const chartData = useMemo(() => {
    if (filteredTimeline.length === 0) return null

    let cumulative = 0
    const points = filteredTimeline.map(d => {
      cumulative += d[type] || 0
      return { date: d.date, value: cumulative }
    })

    if (points.length < 2) return null

    const max = Math.max(...points.map(p => p.value))
    const min = Math.min(...points.map(p => p.value))
    const range = max - min || 1

    const width = 600
    const height = 200
    const padding = 20

    const pathPoints = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2)
      const y = height - padding - ((p.value - min) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')

    // Area path
    const lastX = padding + ((points.length - 1) / (points.length - 1)) * (width - padding * 2)
    const firstX = padding
    const areaPath = `${pathPoints} L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`

    return { pathPoints, areaPath, width, height, points, max, min }
  }, [filteredTimeline, type])

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <Toast message={toast} />

      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-ink-muted dark:text-white/40 hover:text-ink dark:hover:text-white/60 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium">Back</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-4"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: info.lightBg }}
          >
            <Icon className="w-6 h-6" style={{ color: info.color }} />
          </div>
          <div>
            <h1 className="text-3xl font-hand font-bold text-ink dark:text-chalk-white">
              {info.name}
            </h1>
            <p className="text-xs text-ink-muted dark:text-white/40">{info.ticker} · {info.riskLevel} risk</p>
          </div>
        </motion.div>
      </div>

      {/* Balance */}
      <div className="px-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-ink-muted dark:text-white/40 mb-1">
            Your Balance
          </p>
          <h2 className="text-5xl font-black tabular-nums tracking-tight text-ink dark:text-chalk-white">
            <AnimNum value={balance} prefix="$" />
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-sage" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose" />
            )}
            <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-sage' : 'text-rose'}`}>
              {isPositive ? '+' : ''}{formatCurrency(totalGains)}
            </span>
            <span className="text-xs text-ink-faint dark:text-white/30">total earned</span>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-5"
        >
          {/* Time period selector */}
          <div className="flex gap-1 mb-4">
            {TIME_PERIODS.map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-ink dark:bg-chalk-white text-white dark:text-ink'
                    : 'text-ink-muted dark:text-white/40 hover:bg-surface-2 dark:hover:bg-white/[0.06]'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* SVG Chart */}
          {chartData ? (
            <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-[200px]">
              {/* Gradient */}
              <defs>
                <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={info.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={info.color} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <motion.path
                d={chartData.areaPath}
                fill={`url(#gradient-${type})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />

              {/* Line */}
              <motion.path
                d={chartData.pathPoints}
                fill="none"
                stroke={info.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              />
            </svg>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[13px] text-ink-faint dark:text-white/30">
                No growth data yet — earnings will appear here as your investment grows
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Info Card */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
        >
          <div className="flex items-start gap-3 mb-3">
            <Info className="w-4 h-4 text-ink-muted dark:text-white/40 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-ink dark:text-chalk-white mb-1">
                {info.description}
              </p>
              <p className="text-[12px] text-ink-light dark:text-white/50 leading-relaxed">
                {info.whatYouOwn}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-lg p-3 bg-surface-2 dark:bg-white/[0.04]">
              <p className="text-[10px] font-bold text-ink-faint dark:text-white/30 uppercase tracking-wider mb-1">Risk Level</p>
              <p className="text-[13px] font-bold text-ink dark:text-chalk-white">{info.riskLevel}</p>
            </div>
            <div className="rounded-lg p-3 bg-surface-2 dark:bg-white/[0.04]">
              <p className="text-[10px] font-bold text-ink-faint dark:text-white/30 uppercase tracking-wider mb-1">Avg. Return</p>
              <p className="text-[13px] font-bold text-ink dark:text-chalk-white">{info.historicalReturn}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 mb-8">
        <div className="flex gap-2">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => navigate('/transfer')}
            className="flex-1 py-3.5 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold text-center hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors"
          >
            Add Money
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/transfer')}
            className="flex-1 py-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-ink dark:text-chalk-white text-[13px] font-bold text-center hover:bg-surface-2 dark:hover:bg-white/[0.04] transition-colors"
          >
            Withdraw
          </motion.button>
        </div>
      </div>

      {/* Divider */}
      <div className="px-8 mb-6">
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />
      </div>

      {/* Learn Section */}
      <div className="px-8">
        <h3 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
          Learn About {info.name}
        </h3>
        <div className="space-y-2">
          {info.learnCards.map((card, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="group rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03] overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-paper-warm/50 dark:hover:bg-white/[0.02] transition-colors">
                <span className="text-[13px] font-bold text-ink dark:text-chalk-white">
                  {card.title}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-ink-faint dark:text-white/20" />
              </summary>
              <div className="px-5 pb-4 text-[13px] leading-relaxed border-t border-black/[0.04] dark:border-white/[0.04] pt-3 text-ink-light dark:text-white/50">
                {card.body}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </div>
  )
}
