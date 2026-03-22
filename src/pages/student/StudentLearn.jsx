import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, BookOpen, Lock, CheckCircle, Star } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Toast } from '../../components/shared'

const StudentLearn = () => {
  const { isDark } = useTheme()
  const [expandedUnits, setExpandedUnits] = useState({ 0: true, 1: false })
  const [expandedLessons, setExpandedLessons] = useState({})
  const [completedLessons, setCompletedLessons] = useState(new Set())

  const curriculumData = [
    {
      id: 0,
      title: 'Money Basics',
      color: 'from-blue-500 to-blue-600',
      icon: '💰',
      locked: false,
      lessons: [
        {
          id: '1-1',
          number: '1.1',
          title: 'What Is Money?',
          emoji: '🏛️',
          explanation: 'Money is a medium of exchange that lets us trade goods and services. It has existed for thousands of years in many forms—from shells and salt to coins and digital currency. Today, money enables our entire economy and allows us to store value over time.',
          keyTakeaway: 'Money is trust in a system of exchange.',
          icon: '📜'
        },
        {
          id: '1-2',
          number: '1.2',
          title: 'Earning vs Spending',
          emoji: '💵',
          explanation: 'Earning is money coming in (income), while spending is money going out (expenses). The difference between them is your balance. Smart money management means tracking both carefully so you don\'t spend more than you make.',
          keyTakeaway: 'Income minus expenses equals your financial health.',
          icon: '⚖️'
        },
        {
          id: '1-3',
          number: '1.3',
          title: 'Budgeting 101',
          emoji: '📋',
          explanation: 'A budget is a plan for your money. The popular 50/30/20 rule suggests spending 50% of income on needs, 30% on wants, and 20% on savings. Tracking where your money goes helps you reach your goals and avoid overspending.',
          keyTakeaway: 'A budget is your financial roadmap.',
          icon: '🗺️'
        },
        {
          id: '1-4',
          number: '1.4',
          title: 'Needs vs Wants',
          emoji: '🤔',
          explanation: 'Needs are essentials like food, shelter, and clothing. Wants are things you desire but don\'t require to survive, like video games or restaurants. Knowing the difference helps you make smarter spending choices and save money for what truly matters.',
          keyTakeaway: 'Distinguish needs from wants to control spending.',
          icon: '✂️'
        }
      ]
    },
    {
      id: 1,
      title: 'Banking & Saving',
      color: 'from-green-500 to-green-600',
      icon: '🏦',
      locked: false,
      lessons: [
        {
          id: '2-1',
          number: '2.1',
          title: 'How Banks Work',
          emoji: '🏦',
          explanation: 'Banks accept your deposits (money you store with them) and pay you interest on your balance. They use your deposits to make loans to others and earn profit on the difference. The FDIC insures deposits up to $250,000, protecting your money even if a bank fails.',
          keyTakeaway: 'Banks are guardians of your money and your financial partners.',
          icon: '🛡️'
        },
        {
          id: '2-2',
          number: '2.2',
          title: 'Types of Accounts',
          emoji: '🎫',
          explanation: 'Checking accounts let you withdraw money easily and pay bills. Savings accounts offer interest but limit withdrawals. CDs (Certificates of Deposit) lock your money for a set period but pay higher interest. Choose based on how soon you need your money.',
          keyTakeaway: 'Different accounts serve different financial goals.',
          icon: '🔐'
        },
        {
          id: '2-3',
          number: '2.3',
          title: 'Compound Interest',
          emoji: '📈',
          explanation: 'Compound interest is "interest on interest"—your interest earnings start earning interest themselves. Even small amounts grow dramatically over time. Albert Einstein allegedly called it the 8th wonder of the world. Start saving early to maximize this powerful effect.',
          keyTakeaway: 'Time is your greatest asset in building wealth.',
          icon: '⏰'
        },
        {
          id: '2-4',
          number: '2.4',
          title: 'Emergency Funds',
          emoji: '🚨',
          explanation: 'An emergency fund is money set aside for unexpected expenses like car repairs or medical bills. Financial experts recommend saving 3-6 months of expenses. This safety net prevents you from going into debt when surprises happen.',
          keyTakeaway: 'An emergency fund is your financial safety net.',
          icon: '🥅'
        }
      ]
    },
    {
      id: 2,
      title: 'Investing Fundamentals',
      color: 'from-teal-500 to-teal-600',
      icon: '📊',
      locked: true,
      lessons: [
        {
          id: '3-1',
          number: '3.1',
          title: 'What Is the Stock Market?',
          emoji: '📈',
          explanation: 'The stock market is where shares of companies are bought and sold. When you own a share, you own a tiny piece of a company. Companies use stock sales to raise money, and investors use stocks to grow their wealth. The stock market is open to everyone.',
          keyTakeaway: 'Stock ownership means owning a piece of companies.',
          icon: '🧩'
        },
        {
          id: '3-2',
          number: '3.2',
          title: 'S&P 500 Explained',
          emoji: '📊',
          explanation: 'The S&P 500 is an index of 500 large U.S. companies. Instead of picking individual stocks, index funds let you invest in all 500 companies at once. This diversification (spreading risk) is why experts recommend index funds for beginners.',
          keyTakeaway: 'Diversification spreads risk and builds wealth steadily.',
          icon: '🌍'
        },
        {
          id: '3-3',
          number: '3.3',
          title: 'Risk vs Reward',
          emoji: '⚡',
          explanation: 'Higher potential returns come with higher risk. Stocks are riskier than bonds because prices fluctuate, but they grow more over time. Your time horizon matters: you can afford more risk if you\'re investing for 20+ years.',
          keyTakeaway: 'Risk and reward are two sides of the same coin.',
          icon: '⚙️'
        },
        {
          id: '3-4',
          number: '3.4',
          title: 'The Power of Starting Early',
          emoji: '🚀',
          explanation: 'Starting to invest at 15 versus 25 makes a massive difference thanks to compound growth. A $100 investment growing at 10% annually becomes $1,645 in 30 years, but $10,635 in 50 years. Every year matters when building wealth.',
          keyTakeaway: 'Time in the market beats timing the market.',
          icon: '⭐'
        }
      ]
    },
    {
      id: 3,
      title: 'Real-World Skills',
      color: 'from-orange-500 to-orange-600',
      icon: '🎯',
      locked: true,
      lessons: [
        {
          id: '4-1',
          number: '4.1',
          title: 'Reading a Paycheck',
          emoji: '📝',
          explanation: 'Your gross pay is what you earn before taxes and deductions. Your net pay is what you actually receive—it\'s lower because of income tax, Social Security, Medicare, and other deductions. Understanding your paycheck helps you budget accurately.',
          keyTakeaway: 'Know the difference between gross and net pay.',
          icon: '🔍'
        },
        {
          id: '4-2',
          number: '4.2',
          title: 'Credit Scores',
          emoji: '💳',
          explanation: 'Your credit score (300-850) reflects how reliably you repay borrowed money. Lenders use it to decide loan interest rates. You build credit by paying bills on time and using credit responsibly. A good score (700+) saves you thousands in interest over your lifetime.',
          keyTakeaway: 'Your credit score is your financial reputation.',
          icon: '⭐'
        },
        {
          id: '4-3',
          number: '4.3',
          title: 'Debt & Loans',
          emoji: '📚',
          explanation: 'Good debt (student loans, mortgages) funds investments that increase in value. Bad debt (credit cards, payday loans) funds consumption and often has high interest rates. Interest rates tell you how expensive borrowing is, so compare carefully.',
          keyTakeaway: 'Not all debt is bad—it\'s about what you borrow for.',
          icon: '✅'
        },
        {
          id: '4-4',
          number: '4.4',
          title: 'Entrepreneurship',
          emoji: '🚀',
          explanation: 'Starting a business means creating something customers want to buy. Revenue is total money coming in, while profit is revenue minus expenses. Successful entrepreneurs solve problems and provide value. Every big company started as someone\'s small idea.',
          keyTakeaway: 'Entrepreneurship turns ideas into opportunities.',
          icon: '💡'
        }
      ]
    },
    {
      id: 4,
      title: 'Advanced Concepts',
      color: 'from-red-500 to-red-600',
      icon: '🎓',
      locked: true,
      lessons: [
        {
          id: '5-1',
          number: '5.1',
          title: 'Taxes 101',
          emoji: '🏛️',
          explanation: 'Taxes are mandatory contributions that fund public services like schools, roads, and defense. Income tax is based on your earnings, sales tax is added at purchase. Understanding taxes helps you plan financially and see where your money goes in the broader economy.',
          keyTakeaway: 'Taxes fund the services society depends on.',
          icon: '🛣️'
        },
        {
          id: '5-2',
          number: '5.2',
          title: 'Insurance',
          emoji: '🛡️',
          explanation: 'Insurance protects you from catastrophic costs. Health insurance covers medical bills, auto insurance covers accidents, life insurance protects dependents. You pay regular premiums for protection against unlikely but expensive events.',
          keyTakeaway: 'Insurance is protection against financial disaster.',
          icon: '🏥'
        },
        {
          id: '5-3',
          number: '5.3',
          title: 'Renting vs Buying',
          emoji: '🏠',
          explanation: 'Renting offers flexibility but builds no equity. Buying requires a down payment and mortgage but builds wealth through home equity. First apartments are usually rentals. Homeownership is a major financial decision that depends on your stability and plans.',
          keyTakeaway: 'Your housing choice shapes your long-term finances.',
          icon: '🗝️'
        },
        {
          id: '5-4',
          number: '5.4',
          title: 'Building Wealth',
          emoji: '💎',
          explanation: 'Wealth is the difference between your assets (what you own) and liabilities (what you owe). Net worth = assets minus liabilities. Building wealth takes time through consistent saving, smart investing, and increasing income. Track your net worth annually to monitor progress.',
          keyTakeaway: 'Wealth is built through consistent financial discipline.',
          icon: '📈'
        }
      ]
    }
  ]

  const toggleUnit = (unitId) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId]
    }))
  }

  const toggleLesson = (lessonId) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }))
  }

  const toggleLessonComplete = (lessonId) => {
    const newCompleted = new Set(completedLessons)
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId)
    } else {
      newCompleted.add(lessonId)
    }
    setCompletedLessons(newCompleted)
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <BookOpen size={32} className="text-blue-400" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Financial Literacy</h1>
              <p className="text-slate-300 mt-1">Alpha School's interactive money management curriculum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Your Learning Progress
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {completedLessons.size} of 20 lessons completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-32 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-slate-200'} overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedLessons.size / 20) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm font-medium text-blue-500 w-10">
                {Math.round((completedLessons.size / 20) * 100)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Curriculum Units */}
        <div className="space-y-4">
          {curriculumData.map((unit, index) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Unit Header */}
              <button
                onClick={() => toggleUnit(unit.id)}
                className={`w-full p-6 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                    : 'bg-white hover:bg-slate-50 text-slate-900'
                } shadow-md border-l-4 ${
                  unit.locked
                    ? `border-gray-500 ${isDark ? 'opacity-75' : 'opacity-90'}`
                    : `border-blue-500`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left flex-1">
                    <span className="text-3xl">{unit.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {unit.title}
                        {unit.locked && <Lock size={18} className="text-gray-500" />}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        {unit.lessons.length} lessons
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedUnits[unit.id] ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown
                      size={24}
                      className={unit.locked ? 'text-gray-500' : 'text-blue-500'}
                    />
                  </motion.div>
                </div>
              </button>

              {/* Unit Content */}
              <AnimatePresence>
                {expandedUnits[unit.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mt-3 space-y-3 ${isDark ? 'bg-gray-800/50' : 'bg-slate-50/50'} p-4 rounded-lg`}
                  >
                    {unit.lessons.map((lesson) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Lesson Card */}
                        <div
                          className={`rounded-lg overflow-hidden transition-all duration-200 ${
                            isDark
                              ? 'bg-gray-700 hover:bg-gray-650'
                              : 'bg-white hover:bg-slate-100'
                          } border ${
                            completedLessons.has(lesson.id)
                              ? 'border-green-500'
                              : isDark
                                ? 'border-gray-600'
                                : 'border-slate-200'
                          }`}
                        >
                          {/* Lesson Header */}
                          <button
                            onClick={() => toggleLesson(lesson.id)}
                            className="w-full p-4 text-left flex items-center justify-between hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {completedLessons.has(lesson.id) ? (
                                <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                              ) : (
                                <span className="text-2xl flex-shrink-0">{lesson.emoji}</span>
                              )}
                              <div className="flex-1">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {lesson.number}: {lesson.title}
                                </h4>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedLessons[lesson.id] ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight
                                size={20}
                                className={isDark ? 'text-gray-400' : 'text-slate-500'}
                              />
                            </motion.div>
                          </button>

                          {/* Lesson Content */}
                          <AnimatePresence>
                            {expandedLessons[lesson.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`border-t ${isDark ? 'border-gray-600 bg-gray-800' : 'border-slate-200 bg-slate-50'} p-4 space-y-4`}
                              >
                                {/* Explanation */}
                                <div>
                                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
                                    {lesson.explanation}
                                  </p>
                                </div>

                                {/* Key Takeaway */}
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 }}
                                  className={`p-3 rounded-lg flex items-start gap-3 ${
                                    isDark
                                      ? 'bg-blue-900/30 border border-blue-700'
                                      : 'bg-blue-50 border border-blue-200'
                                  }`}
                                >
                                  <Star
                                    size={18}
                                    className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                                  />
                                  <div>
                                    <p className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                                      Key Takeaway
                                    </p>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                                      {lesson.keyTakeaway}
                                    </p>
                                  </div>
                                </motion.div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => toggleLessonComplete(lesson.id)}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                                      completedLessons.has(lesson.id)
                                        ? `${isDark ? 'bg-green-600/20 text-green-400 border border-green-600/40' : 'bg-green-100 text-green-700 border border-green-300'}`
                                        : `${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`
                                    }`}
                                  >
                                    {completedLessons.has(lesson.id) ? '✓ Completed' : 'Mark Complete'}
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`mt-12 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-slate-100'} text-center`}
        >
          <Lock size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-slate-500'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
            More Units Coming Soon
          </h3>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Unlock advanced lessons as you progress through the curriculum. Keep learning!
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export { StudentLearn }
