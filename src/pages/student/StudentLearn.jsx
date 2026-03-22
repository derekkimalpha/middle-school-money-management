import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

/* ────────────────────────────────────────────
   Glossary data — organized by topic
   ──────────────────────────────────────────── */
const TOPICS = [
  {
    id: 'basics',
    label: 'Money Basics',
    emoji: '💰',
    color: '#a68b5b',
    terms: [
      {
        term: 'Money',
        emoji: '🏛️',
        short: 'A system for trading value',
        full: 'Money is a medium of exchange that lets us trade goods and services. It has existed for thousands of years — from shells and salt to coins and digital currency. Today, money enables our entire economy and allows us to store value over time.',
        funFact: 'The world's largest bill ever printed was a 100-trillion-dollar note from Zimbabwe. It could barely buy a loaf of bread!',
      },
      {
        term: 'Income',
        emoji: '💵',
        short: 'Money coming in',
        full: 'Income is any money you earn or receive. It can come from a job, allowance, selling things, or even interest on savings. The more sources of income you have, the stronger your financial position.',
        funFact: 'The average American earns about $1.7 million over their entire lifetime.',
      },
      {
        term: 'Expenses',
        emoji: '🛒',
        short: 'Money going out',
        full: "Expenses are anything you spend money on — food, rent, games, clothes. Tracking expenses is the first step to taking control of your money. If you spend more than you earn, you're in trouble!",
        funFact: 'The average person makes about 35,000 decisions a day — many of them are tiny spending choices.',
      },
      {
        term: 'Budget',
        emoji: '📋',
        short: 'A plan for your money',
        full: "A budget is a roadmap that tells your money where to go. The popular 50/30/20 rule suggests: 50% on needs, 30% on wants, 20% on savings. It doesn't have to be perfect — just having one puts you ahead of most people.",
        funFact: 'Only about 1 in 3 Americans actually keep a detailed budget. Be the 1!',
      },
      {
        term: 'Needs vs Wants',
        emoji: '🤔',
        short: 'Essentials vs nice-to-haves',
        full: "Needs are things you must have to survive — food, shelter, clothing. Wants are things you'd like but can live without — video games, eating out, new sneakers. Knowing the difference is a money superpower.",
        funFact: "The average teen spends about $2,150 a year — and most of it goes to wants, not needs.",
      },
    ],
  },
  {
    id: 'banking',
    label: 'Banking & Saving',
    emoji: '🏦',
    color: '#6b8a87',
    terms: [
      {
        term: 'Bank',
        emoji: '🏦',
        short: 'A safe place for your money',
        full: 'Banks accept your deposits and pay you interest for keeping money with them. They lend your deposits to other people and earn profit on the difference. The FDIC insures deposits up to $250,000, so your money is protected even if the bank fails.',
        funFact: 'The oldest bank still operating today was founded in Italy in 1472 — over 550 years ago!',
      },
      {
        term: 'Checking Account',
        emoji: '💳',
        short: 'Your everyday spending account',
        full: "A checking account is where you keep money for daily use. You can withdraw anytime, pay bills, and use a debit card. It's like the cash in your backpack — easy to access whenever you need it.",
        funFact: "The word \"check\" comes from the game of chess — it means to verify or confirm something.",
      },
      {
        term: 'Savings Account',
        emoji: '🐷',
        short: 'Your money-growing account',
        full: "A savings account pays you interest for keeping money deposited. It's designed for money you don't need right away. The trade-off: it's slightly harder to access than checking, but your money actually grows while it sits there.",
        funFact: 'If you saved just $5 a week starting at age 13, you\'d have over $13,000 by age 30 (with interest)!',
      },
      {
        term: 'Interest',
        emoji: '📈',
        short: 'Money your money earns',
        full: "Interest is what the bank pays you for keeping money with them — think of it as rent they pay for borrowing your cash. Compound interest is even cooler: you earn interest ON your interest. It's like a snowball rolling downhill, getting bigger and bigger.",
        funFact: 'Albert Einstein reportedly called compound interest "the eighth wonder of the world."',
      },
      {
        term: 'Emergency Fund',
        emoji: '🚨',
        short: 'Your financial safety net',
        full: "An emergency fund is money set aside for unexpected expenses — car repairs, medical bills, or losing a job. Experts recommend saving 3-6 months of expenses. It's the difference between a minor inconvenience and a financial crisis.",
        funFact: 'About 56% of Americans can\'t cover a $1,000 emergency. Having even a small fund puts you way ahead.',
      },
    ],
  },
  {
    id: 'investing',
    label: 'Investing',
    emoji: '📊',
    color: '#7c8c78',
    terms: [
      {
        term: 'Stock',
        emoji: '📈',
        short: 'A tiny piece of a company',
        full: "When you buy a stock, you own a small piece of that company. If the company does well, your stock becomes more valuable. If it does poorly, it loses value. It's like betting on a horse — but with research, not luck.",
        funFact: 'If you bought $1,000 of Apple stock when the iPhone launched in 2007, it would be worth over $40,000 today.',
      },
      {
        term: 'S&P 500',
        emoji: '🏢',
        short: 'The top 500 U.S. companies',
        full: 'The S&P 500 is an index that tracks 500 of the biggest companies in America — Apple, Google, Nike, Disney, and more. Instead of picking one company, you can invest in all 500 at once through an index fund. This spreads your risk across the whole economy.',
        funFact: 'The S&P 500 has returned an average of about 10% per year since 1957. Patience pays!',
      },
      {
        term: 'NASDAQ',
        emoji: '🚀',
        short: 'The tech-heavy stock index',
        full: 'NASDAQ is a stock index loaded with technology companies — think Google, Tesla, Netflix, and Amazon. It can shoot up fast when tech is booming, but it can also drop harder during downturns. Higher risk, higher potential reward.',
        funFact: 'NASDAQ stands for "National Association of Securities Dealers Automated Quotations." Try saying that five times fast.',
      },
      {
        term: 'Diversification',
        emoji: '🥚',
        short: "Don't put all your eggs in one basket",
        full: "Diversification means spreading your money across different investments so one bad pick doesn't wipe you out. If you own stocks in tech, healthcare, AND food companies, a crash in one area won't destroy your whole portfolio.",
        funFact: 'The saying "don\'t put all your eggs in one basket" dates back to at least the 1600s!',
      },
      {
        term: 'Risk vs Reward',
        emoji: '⚡',
        short: 'Bigger gains = bigger chances of loss',
        full: "In investing, higher potential returns always come with higher risk. Savings accounts are safe but grow slowly. Stocks are riskier but grow faster over time. Your age matters too — if you're young, you have time to recover from dips.",
        funFact: 'The stock market has crashed and recovered over 10 times in the last 100 years. It always came back.',
      },
    ],
  },
  {
    id: 'real-world',
    label: 'Real-World Money',
    emoji: '🎯',
    color: '#78716c',
    terms: [
      {
        term: 'Paycheck',
        emoji: '📝',
        short: 'What you earn from work',
        full: "Your gross pay is what you earn before deductions. Your net pay (take-home pay) is what's left after taxes, Social Security, and other deductions. The gap between gross and net surprises most people getting their first real paycheck!",
        funFact: 'The very first minimum wage in the U.S. was $0.25 per hour, set in 1938.',
      },
      {
        term: 'Credit Score',
        emoji: '⭐',
        short: 'Your financial reputation number',
        full: "Your credit score (300-850) tells lenders how trustworthy you are with borrowed money. Pay bills on time and keep debt low to build a high score. A score of 700+ can save you tens of thousands of dollars in interest over your lifetime.",
        funFact: 'Your credit score can affect whether you get an apartment, a car loan, or even some jobs!',
      },
      {
        term: 'Debt',
        emoji: '⚖️',
        short: 'Money you owe someone',
        full: "Not all debt is bad. \"Good debt\" (student loans, mortgages) helps you build value over time. \"Bad debt\" (credit cards, payday loans) costs you money on things that lose value. The key is the interest rate — the higher it is, the more expensive the debt.",
        funFact: 'The average American has about $104,000 in debt. Understanding debt now helps you avoid that trap.',
      },
      {
        term: 'Taxes',
        emoji: '🏛️',
        short: 'Money that funds public services',
        full: "Taxes are mandatory payments to the government that fund schools, roads, hospitals, and defense. Income tax is based on what you earn. Sales tax is added when you buy things. Understanding taxes helps you see where your money goes in the bigger picture.",
        funFact: 'Tax Day in the U.S. is April 15. If it falls on a weekend, you get an extra day or two!',
      },
      {
        term: 'Entrepreneurship',
        emoji: '💡',
        short: 'Starting your own business',
        full: "Entrepreneurship means creating something people want to buy. Revenue is total money coming in; profit is what's left after expenses. Every massive company — Apple, Nike, Amazon — started as one person's small idea.",
        funFact: "Most successful entrepreneurs failed multiple times before making it. Walt Disney was fired for 'lacking imagination.'",
      },
      {
        term: 'Net Worth',
        emoji: '💎',
        short: 'What you own minus what you owe',
        full: "Net worth = assets (stuff you own) minus liabilities (stuff you owe). It's the single best number to track your financial health. You build it through saving, investing, and being smart about debt. Even billionaires started with a net worth of zero.",
        funFact: "The world's first trillionaire might happen within your lifetime. Could it be you?",
      },
    ],
  },
]

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */
const StudentLearn = () => {
  const { isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [activeTopic, setActiveTopic] = useState(null) // null = all
  const [expandedTerm, setExpandedTerm] = useState(null)

  // Filter terms by search + topic
  const filteredTopics = useMemo(() => {
    const q = search.toLowerCase().trim()
    return TOPICS.map((topic) => ({
      ...topic,
      terms: topic.terms.filter((t) => {
        const matchesTopic = !activeTopic || topic.id === activeTopic
        const matchesSearch =
          !q ||
          t.term.toLowerCase().includes(q) ||
          t.short.toLowerCase().includes(q) ||
          t.full.toLowerCase().includes(q)
        return matchesTopic && matchesSearch
      }),
    })).filter((topic) => topic.terms.length > 0)
  }, [search, activeTopic])

  const totalTerms = TOPICS.reduce((sum, t) => sum + t.terms.length, 0)
  const visibleTerms = filteredTopics.reduce((sum, t) => sum + t.terms.length, 0)

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <div className="notebook-ruled notebook-margin px-8 pt-8 pb-6 ml-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-pencil-dark dark:text-pencil" />
            <div>
              <h1 className="text-3xl font-hand font-bold text-ink dark:text-chalk-white">
                Money Dictionary
              </h1>
              <p className="text-xs text-ink-muted dark:text-white/50 mt-0.5">
                {totalTerms} terms to explore — tap any to learn more
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-8 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted dark:text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms…"
            className="w-full pl-10 pr-4 py-3 rounded-sm bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] text-sm text-ink dark:text-chalk-white placeholder:text-ink-faint dark:placeholder:text-white/30 shadow-[2px_2px_0px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-pencil/30 focus:border-pencil/50 font-hand"
          />
        </motion.div>
      </div>

      {/* ── Topic Filter Chips ── */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-1 -mx-8 px-8"
        >
          <button
            onClick={() => setActiveTopic(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-hand font-bold whitespace-nowrap flex-shrink-0 border transition-all ${
              activeTopic === null
                ? 'bg-ink dark:bg-chalk-white text-chalk-white dark:text-ink border-ink dark:border-chalk-white shadow-[2px_2px_0px_rgba(0,0,0,0.1)]'
                : 'bg-white dark:bg-white/[0.04] text-ink-muted dark:text-white/50 border-black/[0.08] dark:border-white/[0.06] hover:border-pencil/40'
            }`}
          >
            All
          </button>
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(activeTopic === topic.id ? null : topic.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-hand font-bold whitespace-nowrap flex-shrink-0 border transition-all ${
                activeTopic === topic.id
                  ? 'bg-ink dark:bg-chalk-white text-chalk-white dark:text-ink border-ink dark:border-chalk-white shadow-[2px_2px_0px_rgba(0,0,0,0.1)]'
                  : 'bg-white dark:bg-white/[0.04] text-ink-muted dark:text-white/50 border-black/[0.08] dark:border-white/[0.06] hover:border-pencil/40'
              }`}
            >
              <span>{topic.emoji}</span>
              {topic.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* ── Terms ── */}
      {filteredTopics.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-8 py-16 text-center"
        >
          <Search className="w-10 h-10 mx-auto mb-3 text-ink-faint dark:text-white/20" />
          <p className="text-sm font-hand font-bold text-ink-muted dark:text-white/50">
            No terms match "{search}"
          </p>
          <p className="text-xs text-ink-faint dark:text-white/30 mt-1">
            Try a different search or clear the filter
          </p>
        </motion.div>
      ) : (
        <div className="px-8 space-y-8">
          {filteredTopics.map((topic, topicIdx) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: topicIdx * 0.08 }}
            >
              {/* Topic heading */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{topic.emoji}</span>
                <h2 className="text-[13px] font-hand font-bold text-ink dark:text-chalk-white pencil-underline">
                  {topic.label}
                </h2>
                <span className="text-[10px] text-ink-faint dark:text-white/30 ml-1">
                  {topic.terms.length} {topic.terms.length === 1 ? 'term' : 'terms'}
                </span>
              </div>

              {/* Term cards */}
              <div className="space-y-2">
                {topic.terms.map((entry, i) => {
                  const isExpanded = expandedTerm === `${topic.id}-${entry.term}`
                  const termKey = `${topic.id}-${entry.term}`

                  return (
                    <motion.div
                      key={termKey}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: topicIdx * 0.08 + i * 0.03 }}
                    >
                      <div
                        className={`rounded-sm overflow-hidden border transition-all ${
                          isExpanded
                            ? 'border-pencil/40 dark:border-pencil/30 shadow-[3px_3px_0px_rgba(0,0,0,0.08)]'
                            : 'border-black/[0.06] dark:border-white/[0.06] shadow-[2px_2px_0px_rgba(0,0,0,0.04)]'
                        } bg-white dark:bg-white/[0.04]`}
                      >
                        {/* Term header */}
                        <button
                          onClick={() =>
                            setExpandedTerm(isExpanded ? null : termKey)
                          }
                          className="w-full px-4 py-3.5 text-left flex items-center gap-3 hover:bg-paper-warm/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-xl flex-shrink-0">{entry.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-ink dark:text-chalk-white block font-hand">
                              {entry.term}
                            </span>
                            <span className="text-[11px] text-ink-muted dark:text-white/50 block truncate">
                              {entry.short}
                            </span>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            <ChevronRight className="w-4 h-4 text-ink-faint dark:text-white/30" />
                          </motion.div>
                        </button>

                        {/* Expanded content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
                                {/* Main explanation */}
                                <p className="text-sm leading-relaxed text-ink-light dark:text-white/70 mt-3">
                                  {entry.full}
                                </p>

                                {/* Fun fact callout */}
                                {entry.funFact && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mt-4 p-3 rounded-sm bg-pencil/10 dark:bg-pencil/10 border border-pencil/25 dark:border-pencil/20 flex items-start gap-2.5"
                                  >
                                    <Sparkles className="w-4 h-4 text-pencil-dark dark:text-pencil flex-shrink-0 mt-0.5" />
                                    <div>
                                      <span className="text-[10px] font-hand font-bold uppercase tracking-wider text-pencil-dark dark:text-pencil block mb-0.5">
                                        Fun Fact
                                      </span>
                                      <p className="text-xs leading-relaxed text-ink-light dark:text-white/60">
                                        {entry.funFact}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Footer note ── */}
      {visibleTerms === totalTerms && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="px-8 mt-10 mb-4 text-center"
        >
          <p className="text-[11px] text-ink-faint dark:text-white/25 font-hand">
            More terms added as you explore new topics in class
          </p>
        </motion.div>
      )}
    </div>
  )
}

export { StudentLearn }
