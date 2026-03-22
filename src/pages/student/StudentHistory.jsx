import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FinTip, Toast, Tag, AnimNum } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { ACCOUNT_META, formatCurrency } from '../../lib/constants'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export const StudentHistory = () => {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'checking', label: 'Checking' },
    { id: 'savings', label: 'Savings' },
    { id: 'sp500', label: 'S&P 500' },
    { id: 'nasdaq', label: 'NASDAQ' },
    { id: 'bonus', label: 'Bonus' },
  ]

  // Fetch transactions
  useEffect(() => {
    if (!profile?.id) return

    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, accounts(account_type)')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          setTransactions(data)
          filterTransactions(data, 'all')
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setToast({ type: 'error', text: 'Failed to load transactions' })
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [profile?.id])

  const filterTransactions = (txns, filter) => {
    if (filter === 'all') {
      setFilteredTransactions(txns)
    } else {
      setFilteredTransactions(
        txns.filter((tx) => tx.accounts?.account_type === filter)
      )
    }
    setSelectedFilter(filter)
  }

  const handleFilterChange = (filterId) => {
    filterTransactions(transactions, filterId)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white/90 tracking-[-0.02em] mb-2">
          Transaction History
        </h1>
        <p className="text-[13px] text-black/50 dark:text-white/40">
          Track all your transactions and account activity
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-6">
        <FinTip
          icon="📋"
          title="Track Your Transactions"
          color="from-blue-50 to-cyan-50"
        >
          Every deposit, transfer, and purchase is recorded here. Reviewing your
          transaction history helps you understand your spending patterns and
          make better financial decisions. Look for trends in where your money
          goes!
        </FinTip>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#111118] rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-3"
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-[#1a1a2e] dark:bg-white/[0.12] text-white dark:text-white/90'
                    : 'bg-black/[0.03] dark:bg-white/[0.04] text-black/50 dark:text-white/40 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111118] rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center dark:bg-[#111118]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-400 mx-auto mb-4"></div>
              <p className="text-[13px] text-black/50 dark:text-white/40">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center dark:bg-[#111118]">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-[13px] text-black/50 dark:text-white/40 text-lg">No transactions yet</p>
              <p className="text-[13px] text-black/40 dark:text-white/30 text-sm">
                {selectedFilter === 'all'
                  ? 'Your transactions will appear here'
                  : `No transactions in ${selectedFilter}`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {filteredTransactions.map((transaction, index) => {
                const isCredit = transaction.type === 'credit'
                const isDebit = transaction.type === 'debit'
                const accountType = transaction.accounts?.account_type
                const accountMeta = ACCOUNT_META[accountType]
                const Icon = isCredit ? ArrowDownLeft : ArrowUpRight

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Icon and Description */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCredit
                              ? 'bg-emerald-500/[0.08] dark:bg-emerald-400/[0.08]'
                              : isDebit
                                ? 'bg-red-500/[0.08] dark:bg-red-400/[0.08]'
                                : 'bg-black/[0.04] dark:bg-white/[0.04]'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isCredit
                                ? 'text-green-600'
                                : isDebit
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[13px] text-[#1a1a2e] dark:text-white/90 truncate">
                            {transaction.description || 'Transaction'}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-black/40 dark:text-white/30 mt-1">
                            <span>{accountMeta?.label || accountType}</span>
                            <span>•</span>
                            <span>
                              {new Date(transaction.created_at).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount and Balance */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-bold ${
                            isCredit
                              ? 'text-green-600 dark:text-green-400'
                              : isDebit
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isCredit ? '+' : isDebit ? '-' : ''}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <p className="text-[11px] text-black/40 dark:text-white/30 mt-1">
                          {formatCurrency(transaction.balance_after)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Summary Stats */}
        {filteredTransactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#111118] rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-6"
          >
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] dark:text-white/90 uppercase tracking-wider mb-4">Summary</h3>

            {(() => {
              const credits = filteredTransactions
                .filter((tx) => tx.type === 'credit')
                .reduce((sum, tx) => sum + tx.amount, 0)

              const debits = filteredTransactions
                .filter((tx) => tx.type === 'debit')
                .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

              const net = credits - debits

              return (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-500/[0.04] dark:bg-emerald-400/[0.06] rounded-xl border border-emerald-500/20 dark:border-emerald-400/10">
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                      Total In
                    </p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      <AnimNum value={credits} prefix="$" />
                    </p>
                  </div>

                  <div className="p-4 bg-red-500/[0.04] dark:bg-red-400/[0.06] rounded-xl border border-red-500/20 dark:border-red-400/10">
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                      Total Out
                    </p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-400 tabular-nums">
                      <AnimNum value={debits} prefix="$" />
                    </p>
                  </div>

                  <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Net Flow
                    </p>
                    <p
                      className={`text-xl font-bold tabular-nums ${
                        net > 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : net < 0
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      <AnimNum value={net} prefix="$" />
                    </p>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </div>
    </div>
  )
}
