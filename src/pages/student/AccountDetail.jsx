import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, PiggyBank, TrendingUp, Info, ChevronRight, DollarSign, ShoppingCart, ArrowLeftRight, Sprout, Lock } from 'lucide-react'
import { AnimNum, Toast } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useAccounts } from '../../hooks/useAccounts'
import { useGrowthLog } from '../../hooks/useGrowthLog'
import { formatCurrency } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

const ACCOUNT_INFO = {
  checking: {
    name: 'Checking',
    icon: Wallet,
    color: '#7c8c78',
    lightBg: 'rgba(124,140,120,0.08)',
    description: 'Your everyday spending money — like having a wallet for your debit card.',
    whatItDoes: 'This is where your paychecks land and where money goes out when you buy things or cash out. Think of it as your "active" money that you use day-to-day. In real life, checking accounts are connected to debit cards for quick spending.',
    learnCards: [
      {
        title: 'What is a checking account?',
        body: 'A checking account is where you keep money you plan to spend soon. It\'s connected to your debit card so you can buy things, pay bills, and handle daily expenses. Unlike savings, it usually doesn\'t earn interest.',
      },
      {
        title: 'Checking vs. Savings',
        body: 'Checking = spending money (easy access, no interest). Savings = money you\'re growing (harder to access, earns interest). Smart money managers keep just enough in checking and put the rest to work in savings or investments.',
      },
      {
        title: 'Why not keep everything in checking?',
        body: 'Money sitting in checking doesn\'t grow. If you have $100 in checking for a year, you still have $100. But $100 in savings at 4.5% interest becomes $104.50 — and in investments it could become $110. Make your money work for you!',
      },
      {
        title: 'The spending trap',
        body: 'Studies show people spend more when money is easily available. That\'s why having a separate savings account helps — out of sight, out of mind. Keep your checking balance just high enough for what you need.',
      },
    ],
  },
  savings: {
    name: 'Savings',
    icon: PiggyBank,
    color: '#6b8a87',
    lightBg: 'rgba(107,138,135,0.08)',
    description: 'Your money grows here automatically — the bank pays YOU for keeping it safe.',
    whatItDoes: 'Your savings account earns interest every single day. The more money you keep here, the more free money you earn. It\'s the safest way to grow your money because your balance can only go up (unlike investments which go up AND down).',
    learnCards: [
      {
        title: 'What is interest?',
        body: 'Interest is money the bank pays you for letting them hold your cash. If you have $100 at 4.5% APY, you earn about $4.50 per year — just for doing nothing. The bank uses your money to make loans and shares the profit with you.',
      },
      {
        title: 'What is compound interest?',
        body: 'Compound interest means you earn interest ON your interest. If you earn $4.50 in year one, next year you earn interest on $104.50 instead of $100. Over time, this snowball effect makes your money grow faster and faster.',
      },
      {
        title: 'The Rule of 72',
        body: 'Want to know how long until your money doubles? Divide 72 by your interest rate. At 4.5% interest, your money doubles in about 16 years. At 10% investment returns, it doubles in just 7.2 years!',
      },
      {
        title: 'Emergency fund basics',
        body: 'Financial experts say everyone should have 3-6 months of expenses saved up. This "emergency fund" lives in savings so it\'s safe but accessible. It\'s your financial safety net for unexpected expenses.',
      },
    ],
  },
}

export const AccountDetail = () => {
  const { type } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { accounts } = useAccounts(profile?.id)
  const growthLog = useGrowthLog(profile?.id)
  const [toast, setToast] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])

  const info = ACCOUNT_INFO[type]
  if (!info) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10 text-center">
        <p className="text-ink-muted dark:text-white/40">Account type not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sage underline text-sm">Go back</button>
      </div>
    )
  }

  // Fetch recent transactions for this account
  useEffect(() => {
    if (!profile?.id) return
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', profile.id)
        .eq('account_type', type)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setRecentTransactions(data)
    }
    fetchTransactions()
  }, [profile?.id, type])

  const balance = accounts?.[type] || 0
  const Icon = info.icon
  const earnedForType = type === 'savings' ? growthLog.savings : 0

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
            <h1 className="text-3xl font-bold text-alpha-navy-800 dark:text-white">
              {info.name}
            </h1>
            <p className="text-xs text-ink-muted dark:text-white/40">
              {type === 'savings' ? 'Earning interest daily' : 'Your spending account'}
            </p>
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
          {type === 'savings' && earnedForType > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Sprout className="w-4 h-4 text-sage" />
              <span className="text-sm font-bold tabular-nums text-sage">
                +{formatCurrency(earnedForType)}
              </span>
              <span className="text-xs text-ink-faint dark:text-white/30">interest earned</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Info Card */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
        >
          <div className="flex items-start gap-3 mb-3">
            <Info className="w-4 h-4 text-ink-muted dark:text-white/40 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-ink dark:text-chalk-white mb-1">
                {info.description}
              </p>
              <p className="text-[12px] text-ink-light dark:text-white/50 leading-relaxed">
                {info.whatItDoes}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 mb-8">
        {type === 'checking' ? (
          <div className="flex gap-2">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate('/transfer')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold text-center hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Move to Savings / Invest
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              onClick={() => navigate('/purchase')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-ink dark:text-chalk-white text-[13px] font-bold text-center hover:bg-surface-2 dark:hover:bg-white/[0.04] transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy
            </motion.button>
          </div>
        ) : (
          /* Savings — locked, show info instead of action buttons */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4 border border-teal/20 dark:border-teal/10 bg-teal/[0.04]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-teal" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink dark:text-chalk-white">Locked Until Graduation</p>
                <p className="text-[11px] text-ink-light dark:text-white/50">
                  Your savings can only grow — no withdrawals allowed. Money goes in through your weekly paycheck allocation. When you graduate, it's all yours!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Activity */}
      {recentTransactions.length > 0 && (
        <div className="px-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-5"
          >
            <h3 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
              Recent Activity
            </h3>
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const isPositive = tx.amount > 0
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-black/[0.03] dark:border-white/[0.03] last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-ink dark:text-chalk-white">
                        {tx.description || tx.type || 'Transaction'}
                      </p>
                      <p className="text-[10px] text-ink-faint dark:text-white/30">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[13px] font-bold tabular-nums ${isPositive ? 'text-sage' : 'text-rose'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}

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
