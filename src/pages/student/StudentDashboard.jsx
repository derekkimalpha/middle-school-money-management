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
  Clock, Star, X, Info, Lock, MapPin, GraduationCap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

const ACCOUNT_LEARN = {
  checking: {
    title: 'What is a Checking Account?',
    body: 'A checking account is your everyday spending money. In real life, this is the account connected to your debit card. You use it to buy things, pay bills, and handle daily expenses. It doesn\'t earn interest, so it\'s not for growing money — it\'s for using money.',
    funFact: 'The average American uses their debit card 23 times per month.',
  },
  savings: {
    title: 'What is a Savings Account?',
    body: 'A savings account is where you park money you don\'t need right now. Banks pay you interest (free money!) for keeping it there, because they use your deposit to make loans to other people. It\'s low risk — your balance only goes up. Think of it as your "safe growth" account.',
    funFact: 'The highest savings rate in US history was 33% during WWII — people had nothing to buy!',
  },
  sp500: {
    title: 'What is the S&P 500?',
    body: 'An index is a collection of stocks bundled together. The S&P 500 tracks the 500 biggest companies in America — Apple, Amazon, Google, McDonald\'s, Nike, and more. Instead of picking one company, you invest in ALL of them. It\'s considered lower-risk investing because if one company drops, the others balance it out. Historically returns ~10% per year.',
    funFact: 'If you invested $100 in the S&P 500 in 1980, it would be worth over $10,000 today.',
    riskLabel: 'Moderate Risk',
    riskColor: 'text-amber',
  },
  nasdaq: {
    title: 'What is the NASDAQ?',
    body: 'The NASDAQ-100 is an index focused on the 100 biggest tech and growth companies — Apple, Microsoft, Tesla, Meta, Netflix. It\'s higher-risk than the S&P 500 because tech stocks are more volatile (bigger ups AND bigger downs). But historically, higher risk = higher reward over long periods. Great for people who can handle the ride.',
    funFact: 'The NASDAQ has outperformed the S&P 500 in 7 of the last 10 years.',
    riskLabel: 'Higher Risk / Higher Reward',
    riskColor: 'text-rose',
  },
}

const LEVEL_DISPLAY = {
  Rookie:   { label: 'R', color: 'from-stone-300 to-stone-400' },
  Saver:    { label: 'S', color: 'from-sage to-teal' },
  Investor: { label: 'I', color: 'from-teal to-sage' },
  Baller:   { label: 'B', color: 'from-amber to-pencil' },
  Tycoon:   { label: 'T', color: 'from-pencil to-amber' },
  Legend:   { label: 'L', color: 'from-amber to-rose' },
}

const DAILY_STORIES = [
  { title: 'The Janitor Who Died a Millionaire', story: 'Ronald Read was a gas station attendant and janitor in Vermont. He never earned more than $25/hour. But he quietly invested in stocks for decades. When he died at 92, he was worth $8 million. He left most of it to his local library and hospital. Patience beats salary.' },
  { title: 'Why Netflix Almost Sold for $50M', story: 'In 2000, Netflix offered to sell itself to Blockbuster for $50 million. Blockbuster laughed them out of the room. Today Netflix is worth over $250 billion. Blockbuster went bankrupt. The lesson? Don\'t sleep on small things that are growing.' },
  { title: 'The $1 That Became $10,000', story: 'If you invested $1 in the S&P 500 in 1970, it would be worth over $200 today — and that\'s after crashes, recessions, and pandemics. The market always recovered. Every. Single. Time.' },
  { title: 'Warren Buffett\'s Biggest Regret', story: 'Warren Buffett bought his first stock at age 11. He\'s now worth $130+ billion. But he says his biggest regret is not starting EARLIER. He spent years wishing he\'d invested his paper route money at age 6.' },
  { title: 'The Latte Factor', story: 'Spending $5/day on drinks = $1,825/year. Invested at 10% for 30 years, that\'s over $300,000. David Bach calls this "The Latte Factor" — small daily spending habits that secretly cost you a fortune over time.' },
  { title: 'How a Pizza Cost $100 Million', story: 'In 2010, someone bought two pizzas for 10,000 Bitcoin. At today\'s prices, those pizzas cost over $600 million. It\'s now celebrated as "Bitcoin Pizza Day" every May 22nd. Every financial decision has a future cost.' },
  { title: 'The Psychology of Losing Money', story: 'Scientists found that losing $100 feels twice as painful as gaining $100 feels good. That\'s why people panic-sell during crashes. Smart investors know: the pain is temporary, but selling locks in the loss forever.' },
  { title: 'The World\'s Greatest Investor Started Young', story: 'Peter Lynch ran the best-performing mutual fund in history from 1977-1990 — turning $1,000 into $28,000. His secret? "Invest in what you know." He bought stocks of stores and products he actually used.' },
  { title: 'Why Rich People Stay Rich', story: 'Morgan Housel says wealth isn\'t about how much you earn — it\'s about what you DON\'T spend. A doctor earning $300k who spends $300k is broke. A teacher saving 20% of $50k is building real wealth. Wealth = what you don\'t see.' },
  { title: 'The Magic of Compounding', story: 'If you put $100 in an account earning 10% a year and never add another dollar: after 10 years you\'d have $259. After 30 years: $1,745. After 50 years: $11,739. All from one $100 bill. Time is the real investment.' },
  { title: 'How a Teenager Built a $5B Company', story: 'At 15, Catherine Cook and her brother saw their high school yearbook and thought "this should be online." They built myYearbook.com, grew it to 33 million users, and sold it for over $100 million. Ideas + action = wealth.' },
  { title: 'The 72 Rule', story: 'Want to know how long it takes to double your money? Divide 72 by your interest rate. At 10% returns, your money doubles every 7.2 years. At 4% savings interest, every 18 years. This is why investments grow faster than savings.' },
  { title: 'Why Crashes Are Actually Good', story: 'The S&P 500 has crashed 20%+ about once every 4 years since 1950. But it\'s also gone up 10,000%+ total. Every crash was a sale — stocks at a discount. The people who kept investing during crashes are the richest.' },
  { title: 'The Marshmallow Test (For Money)', story: 'In a famous experiment, kids who could wait 15 minutes to get TWO marshmallows instead of one ended up more successful in life. Money works the same way — the ability to delay spending is the #1 predictor of wealth.' },
  { title: 'Jay-Z\'s Financial Lesson', story: 'Jay-Z went from selling CDs out of his car to a net worth of $2.5 billion. He says: "I\'m not a businessman — I\'m a business, man." He invested in companies (Tidal, Uber, Ace of Spades) instead of just spending. Ownership > paychecks.' },
  { title: 'The Savings Secret Nobody Talks About', story: 'Most people think getting rich requires a huge salary. But studies show your savings RATE matters more than your income. Someone saving 50% of a $40k salary will retire before someone saving 5% of $200k. It\'s math, not magic.' },
  { title: 'Apple Was Almost Bankrupt', story: 'In 1997, Apple was 90 days from going bankrupt. Steve Jobs came back and made one bet: simplify everything. If you invested $1,000 in Apple that year, it would be worth over $1,000,000 today. Sometimes the biggest winners look like losers first.' },
  { title: 'Why Your Brain Hates Investing', story: 'Your brain is wired to avoid risk — it kept your ancestors alive. But in investing, taking zero risk is actually the riskiest move. Inflation eats your cash at ~3%/year. Not investing is choosing to lose money slowly.' },
  { title: 'The Two Types of Money People', story: 'Morgan Housel says there are people who have money and people who look like they have money. The person driving a $80k car might be in $80k of debt. The person driving a Honda might have $2 million saved. You can\'t judge wealth by appearances.' },
  { title: 'How Kids Your Age Made Millions', story: 'Moziah Bridges started a bow tie business at age 9. By 15, he\'d made over $600k and appeared on Shark Tank. He didn\'t wait to be "old enough." He started small, reinvested profits, and grew. That\'s what you\'re doing right now.' },
]

const DAILY_FUN_FACTS = [
  { fact: 'The average American has $65,000 in savings by age 30 — but the median is only $20,000. Averages can be misleading!' },
  { fact: 'A dollar bill lasts about 6.6 years in circulation before it\'s too worn out and gets shredded by the Federal Reserve.' },
  { fact: 'The stock market has returned an average of ~10% per year since 1926. But no single year is ever exactly "average."' },
  { fact: 'There\'s more Monopoly money printed each year than real U.S. currency. About $30 billion in Monopoly cash vs $7 billion real.' },
  { fact: 'Credit cards were invented by accident in 1949 when a man forgot his wallet at a restaurant and felt embarrassed.' },
  { fact: 'If you saved a penny and doubled it every day for 30 days, you\'d have over $5.3 million. That\'s the power of compounding.' },
  { fact: 'The word "budget" comes from the French word "bougette" — a small leather purse. Budgeting = knowing what\'s in your purse.' },
  { fact: 'About 78% of NFL players go broke within 5 years of retirement. Earning big doesn\'t matter without financial habits.' },
  { fact: 'The first ATM was installed in London in 1967. Before that, you could only get cash during bank hours (9-3pm, no weekends).' },
  { fact: 'Warren Buffett still lives in the same house he bought in 1958 for $31,500. It\'s now worth about $1.4 million.' },
  { fact: 'The S&P 500 was only 500 companies when it started in 1957. Today it represents about 80% of total U.S. stock market value.' },
  { fact: 'Teens who learn about money before 18 are 75% more likely to save regularly as adults. You\'re ahead of the game.' },
  { fact: 'The NASDAQ is named after the National Association of Securities Dealers Automated Quotations. It was the first electronic stock exchange.' },
  { fact: 'Inflation means $100 today will only buy about $74 worth of stuff in 10 years (at 3% inflation). Saving alone isn\'t enough — you need to invest.' },
  { fact: 'The richest person in modern history was Mansa Musa, a 14th-century African king worth an estimated $400 billion in today\'s dollars.' },
  { fact: 'Americans spend an average of $219/month on subscriptions — but think they only spend about $86. Hidden spending adds up fast.' },
  { fact: 'Compound interest was called the "eighth wonder of the world" by Albert Einstein. Whether or not he actually said it, the math checks out.' },
  { fact: 'The New York Stock Exchange started in 1792 under a buttonwood tree when 24 stockbrokers signed an agreement on Wall Street.' },
  { fact: 'Only about 12% of Americans have a written financial plan. People with written plans save 2x more than those without one.' },
  { fact: 'The 50/30/20 rule: 50% of income to needs, 30% to wants, 20% to savings. It\'s the simplest budget that actually works.' },
]

const MILESTONES = [100, 250, 500, 1000, 2000, 5000]

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [toast, setToast] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [learnPopup, setLearnPopup] = useState(null) // which account card popup is open
  const { accounts, loading } = useAccounts(profile?.id)
  const { settings } = usePaycheckSettings()
  const growthLog = useGrowthLog(profile?.id)
  const { leaderboard, myRank } = useLeaderboard(profile?.id, false)
  const { streak } = useStreak(profile?.id)
  const [mapTests, setMapTests] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('map_tests')
      .select('*')
      .eq('student_id', profile.id)
      .order('test_date', { ascending: false })
      .then(({ data }) => { if (data) setMapTests(data) })
  }, [profile?.id])

  const mapTotal = mapTests.reduce((s, t) => s + (t.payout || 0), 0)

  // Get daily story + fun fact based on day of year
  const dailyStory = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
    const dayNumber = dayOfYear % DAILY_STORIES.length
    return { ...DAILY_STORIES[dayNumber], dayNumber: dayNumber + 1 }
  }, [])

  const dailyFact = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
    return DAILY_FUN_FACTS[(dayOfYear + 7) % DAILY_FUN_FACTS.length] // offset so it's different from story
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
      <div className="px-8 pt-6 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
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

      {/* ── Tier Badge ── */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
          className="rounded-xl p-4 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]"
        >
          <div className="flex items-center gap-4">
            {/* Current tier badge */}
            <div className="flex-shrink-0">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${LEVEL_DISPLAY[currentLevel?.name]?.color || 'from-stone-300 to-stone-400'} flex items-center justify-center shadow-sm`}>
                <span className="text-lg font-black text-white">{LEVEL_DISPLAY[currentLevel?.name]?.label || 'R'}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Level name + net worth requirement */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[15px] font-bold text-ink dark:text-chalk-white">
                  {currentLevel?.name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-pencil/10 text-pencil font-semibold">
                  {formatCurrency(currentLevel?.min)}+
                </span>
              </div>

              {/* Progress to next level */}
              {nextLevel ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-ink-muted dark:text-white/40">
                      Next: <span className="font-semibold">{nextLevel.name}</span> at {formatCurrency(nextLevel.min)}
                    </span>
                    <span className="text-[11px] font-bold text-pencil">
                      {formatCurrency(nextLevel.min - totalBalance)} to go
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-surface-3 dark:bg-white/[0.06]">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${LEVEL_DISPLAY[nextLevel.name]?.color || 'from-pencil-dark to-pencil'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-pencil font-semibold">Max Level Reached!</p>
              )}
            </div>
          </div>

          {/* All tiers mini-map */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
            {LEVELS.map((level, i) => {
              const isActive = currentLevel?.name === level.name
              const isPast = totalBalance >= level.min
              return (
                <div key={level.name} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-sm ${isActive ? '' : isPast ? 'opacity-60' : 'opacity-25 grayscale'}`}>
                    {LEVEL_DISPLAY[level.name]?.label}
                  </span>
                  <span className={`text-[9px] font-bold ${isActive ? 'text-pencil' : isPast ? 'text-ink-muted dark:text-white/40' : 'text-ink-faint dark:text-white/20'}`}>
                    {level.name}
                  </span>
                  <span className={`text-[8px] ${isActive ? 'text-ink-muted dark:text-white/40' : 'text-ink-faint dark:text-white/15'}`}>
                    ${level.min}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Money Story + Fun Fact (side by side) ── */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Fun Fact */}
          <div
            className="rounded-xl p-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(107,138,135,0.10) 0%, rgba(107,138,135,0.04) 100%)',
              border: '1px solid rgba(107,138,135,0.15)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal/70 dark:text-teal/50 mb-1">
                  Fun Fact
                </p>
                <p className="text-[11.5px] leading-relaxed text-ink-light dark:text-white/60">
                  {dailyFact.fact}
                </p>
              </div>
            </div>
          </div>

          {/* Money Story */}
          <div
            className="rounded-xl p-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(166,139,91,0.10) 0%, rgba(166,139,91,0.04) 100%)',
              border: '1px solid rgba(166,139,91,0.15)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber/70 dark:text-amber/50 mb-1">
                  Money Story
                </p>
                <p className="text-[12px] font-bold text-ink dark:text-chalk-white mb-0.5 leading-snug">
                  {dailyStory.title}
                </p>
                <p className="text-[11px] leading-relaxed text-ink-light dark:text-white/60 line-clamp-4">
                  {dailyStory.story}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Account Cards with Learn Popups ── */}
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
                className="group relative"
              >
                <div
                  className={`rounded-xl p-5 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] transition-shadow hover:shadow-sm ${isInvestment ? 'hover:border-black/[0.12] dark:hover:border-white/[0.12]' : ''}`}
                  onClick={isInvestment ? () => navigate(`/invest/${key}`) : undefined}
                  style={{ cursor: isInvestment ? 'pointer' : 'default' }}
                >
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
                    <button
                      onClick={(e) => { e.stopPropagation(); setLearnPopup(learnPopup === key ? null : key) }}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Info className="w-3.5 h-3.5 text-ink-faint dark:text-white/25" />
                    </button>
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

      {/* ── Account Learn Popup (overlay) ── */}
      <AnimatePresence>
        {learnPopup && ACCOUNT_LEARN[learnPopup] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setLearnPopup(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

            {/* Popup Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl bg-white dark:bg-[#1c1b19] border border-black/[0.08] dark:border-white/[0.08] shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-5 pb-4 flex items-start justify-between"
                style={{ background: `linear-gradient(135deg, ${ACCOUNT_COLORS[learnPopup]?.light} 0%, transparent 100%)` }}
              >
                <div className="flex items-center gap-3">
                  
                  <h3 className="text-[16px] font-bold text-ink dark:text-chalk-white">
                    {ACCOUNT_LEARN[learnPopup].title}
                  </h3>
                </div>
                <button
                  onClick={() => setLearnPopup(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-ink-muted dark:text-white/40" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-6">
                <p className="text-[13px] leading-relaxed text-ink-light dark:text-white/60 mb-4">
                  {ACCOUNT_LEARN[learnPopup].body}
                </p>

                {/* Risk label for investments */}
                {ACCOUNT_LEARN[learnPopup].riskLabel && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-surface-3 dark:bg-white/[0.04]">
                    <div className={`w-2 h-2 rounded-full ${learnPopup === 'sp500' ? 'bg-amber' : 'bg-rose'}`} />
                    <span className={`text-[12px] font-bold ${ACCOUNT_LEARN[learnPopup].riskColor}`}>
                      {ACCOUNT_LEARN[learnPopup].riskLabel}
                    </span>
                  </div>
                )}

                {/* Fun fact */}
                <div className="rounded-lg p-3 bg-pencil/[0.06] dark:bg-pencil/[0.04] border border-pencil/10">
                  <p className="text-[11px] font-bold text-pencil uppercase tracking-wider mb-1">Fun Fact</p>
                  <p className="text-[12px] text-ink-light dark:text-white/55 leading-relaxed">
                    {ACCOUNT_LEARN[learnPopup].funFact}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ── Next Goals ── */}
      {(nextLevel || streak < 5) && (
        <div className="px-8 mb-8">
          <h3 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
            Next Up
          </h3>
          <div className="space-y-2">
            {/* Next monetary milestone */}
            {(() => {
              const nextMilestone = MILESTONES.find(m => totalBalance < m)
              if (!nextMilestone) return null
              const prevMilestone = [...MILESTONES].reverse().find(m => totalBalance >= m) || 0
              const pct = prevMilestone === 0
                ? (totalBalance / nextMilestone) * 100
                : ((totalBalance - prevMilestone) / (nextMilestone - prevMilestone)) * 100
              return (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                  <div className="w-9 h-9 rounded-lg bg-amber-bg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                      Reach ${nextMilestone} net worth
                    </p>
                    <p className="text-[11px] text-ink-faint dark:text-white/30">
                      You have {formatCurrency(totalBalance)} — {formatCurrency(nextMilestone - totalBalance)} more to hit this milestone
                    </p>
                  </div>
                  <div className="w-16">
                    <div className="h-2 rounded-full bg-surface-3 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Streak goal — explain what it means */}
            {streak < 5 && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                <div className="w-9 h-9 rounded-lg bg-rose-bg flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4.5 h-4.5 text-rose" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-ink dark:text-chalk-white">
                    5-week paycheck streak
                  </p>
                  <p className="text-[11px] text-ink-faint dark:text-white/30">
                    Log your paycheck 5 weeks in a row — you're at {streak} week{streak !== 1 ? 's' : ''} ({5 - streak} to go)
                  </p>
                </div>
                <div className="w-16">
                  <div className="h-2 rounded-full bg-surface-3 dark:bg-white/[0.06] overflow-hidden">
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

      {/* ── Roth IRA (MAP Rewards — locked) ── */}
      {(accounts.roth > 0 || mapTests.length > 0) && (
        <div className="px-8 mb-8">
          <div className="rounded-xl border border-amber-200/60 dark:border-amber-700/20 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-900/10 dark:to-orange-900/5 p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-amber-600/70 dark:text-amber-400/60 uppercase tracking-wider">Roth IRA</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-200/50 dark:bg-amber-800/30 text-amber-700 dark:text-amber-400 font-semibold">
                Locked until graduation
              </span>
            </div>
            <p className="text-2xl font-black tabular-nums text-amber-800 dark:text-amber-300 mb-2 mt-2">
              {formatCurrency(accounts.roth || 0)}
            </p>
            <p className="text-[11px] text-amber-600/60 dark:text-amber-400/40 leading-relaxed">
              Earned from MAP testing. Like a real Roth IRA, this money grows tax-free but can't be touched until you graduate.
            </p>
            {mapTests.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200/40 dark:border-amber-700/20 space-y-1.5">
                {mapTests.filter(t => t.payout > 0).map(test => (
                  <div key={test.id} className="flex items-center justify-between text-xs">
                    <span className="text-amber-700/70 dark:text-amber-300/60 capitalize">
                      {test.subject} · {test.percentile}th %ile
                    </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(test.payout)}</span>
                  </div>
                ))}
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
