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
      <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
        <div className="max-w-3xl mx-auto px-8 py-10 text-center">
          <p className="text-ds-tertiary">Account type not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-ds-accent underline text-sm">Go back</button>
        </div>
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
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
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
              className="flex items-center gap-2 text-ds-tertiary hover:text-ds-secondary transition-colors mb-4"
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
              className="w-12 h-12 rounded-ds-lg flex items-center justify-center bg-ds-inset"
            >
              <Icon className="w-6 h-6 text-ds-secondary" />
            </div>
            <div>
              <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">
                {info.name}
              </h1>
              <p className="text-xs text-ds-tertiary">
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
            <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1">
              Your Balance
            </p>
            <h2 className="text-5xl font-bold tabular-nums tracking-tight text-ds-primary">
              <AnimNum value={balance} prefix="$" />
            </h2>
            {type === 'savings' && earnedForType > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Sprout className="w-4 h-4 text-ds-positive" />
                <span className="text-sm font-semibold tabular-nums text-ds-positive">
                  +{formatCurrency(earnedForType)}
                </span>
                <span className="text-xs text-ds-tertiary">interest earned</span>
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
            className="rounded-ds-lg p-5 border border-ds-hairline bg-ds-surface"
          >
            <div className="flex items-start gap-3 mb-3">
              <Info className="w-4 h-4 text-ds-tertiary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-ds-primary mb-1">
                  {info.description}
                </p>
                <p className="text-[12px] text-ds-secondary leading-relaxed">
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
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-ds-lg bg-ds-accent text-ds-on-accent text-[13px] font-semibold text-center hover:bg-ds-accent-hover transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Move to Savings / Invest
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                onClick={() => navigate('/purchase')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-ds-lg border border-ds-hairline text-ds-primary text-[13px] font-semibold text-center hover:bg-ds-overlay transition-colors"
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
              className="rounded-ds-lg p-4 border border-ds-hairline bg-ds-inset"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-ds-md bg-ds-surface flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-ds-secondary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ds-primary">Locked Until Graduation</p>
                  <p className="text-[11px] text-ds-secondary">
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
              className="rounded-ds-lg border border-ds-hairline bg-ds-surface p-5"
            >
              <h3 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-3">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentTransactions.map((tx) => {
                  const isPositive = tx.amount > 0
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-ds-hairline last:border-0">
                      <div>
                        <p className="text-[13px] font-medium text-ds-primary">
                          {tx.description || tx.type || 'Transaction'}
                        </p>
                        <p className="text-[10px] text-ds-tertiary">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[13px] font-semibold tabular-nums ${isPositive ? 'text-ds-positive' : 'text-ds-negative'}`}>
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
          <div className="border-t border-ds-hairline" />
        </div>

        {/* Learn Section */}
        <div className="px-8">
          <h3 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-3">
            Learn About {info.name}
          </h3>
          <div className="space-y-2">
            {info.learnCards.map((card, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="group rounded-ds-lg border border-ds-hairline bg-ds-surface overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-ds-overlay transition-colors">
                  <span className="text-[13px] font-semibold text-ds-primary">
                    {card.title}
                  </span>
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-ds-tertiary" />
                </summary>
                <div className="px-5 pb-4 text-[13px] leading-relaxed border-t border-ds-hairline pt-3 text-ds-secondary">
                  {card.body}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
