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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ds-hairline"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em] mb-2">
          Transaction History
        </h1>
        <p className="text-[13px] text-ds-tertiary">
          Track all your transactions and account activity
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-6">
        <FinTip
          icon=""
          title="Track Your Transactions"
          color="from-stone-50 to-stone-100"
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
          className="bg-ds-surface rounded-ds-xl border border-ds-hairline p-3"
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                aria-current={selectedFilter === filter.id ? "page" : undefined}
                className={`px-4 py-2 rounded-ds-md font-semibold text-sm whitespace-nowrap transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-ds-accent text-ds-on-accent hover:bg-ds-accent-hover'
                    : 'bg-ds-inset text-ds-secondary hover:bg-ds-overlay'
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
          className="bg-ds-surface rounded-ds-xl border border-ds-hairline overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ds-hairline mx-auto mb-4"></div>
              <p className="text-[13px] text-ds-tertiary">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3"></div>
              <p className="text-sm font-semibold text-ds-secondary">No transactions yet</p>
              <p className="text-xs text-ds-tertiary mt-1">You'll see all your deposits, transfers, and purchases here once you start earning</p>
            </div>
          ) : (
            <div className="divide-y divide-ds-hairline">
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
                    className="p-4 hover:bg-ds-overlay transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Icon and Description */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCredit
                              ? 'bg-ds-accent-soft'
                              : isDebit
                                ? 'bg-ds-negative-soft'
                                : 'bg-ds-inset'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isCredit
                                ? 'text-ds-positive'
                                : isDebit
                                  ? 'text-ds-negative'
                                  : 'text-ds-secondary'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[13px] text-ds-primary truncate">
                            {transaction.description || 'Transaction'}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-ds-tertiary mt-1">
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
                          className={`font-semibold tabular-nums ${
                            isCredit
                              ? 'text-ds-positive'
                              : isDebit
                                ? 'text-ds-negative'
                                : 'text-ds-primary'
                          }`}
                        >
                          {isCredit ? '+' : isDebit ? '-' : ''}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <p className="text-[11px] text-ds-tertiary mt-1 tabular-nums">
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
            className="bg-ds-surface rounded-ds-xl border border-ds-hairline p-6 md:p-7"
          >
            <h3 className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-4">Summary</h3>

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
                  <div className="p-4 bg-ds-accent-soft rounded-ds-md border border-ds-hairline">
                    <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1">
                      Total In
                    </p>
                    <p className="text-xl font-bold text-ds-positive tabular-nums">
                      <AnimNum value={credits} prefix="$" />
                    </p>
                  </div>

                  <div className="p-4 bg-ds-negative-soft rounded-ds-md border border-ds-hairline">
                    <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1">
                      Total Out
                    </p>
                    <p className="text-xl font-bold text-ds-negative tabular-nums">
                      <AnimNum value={debits} prefix="$" />
                    </p>
                  </div>

                  <div className="p-4 bg-ds-inset rounded-ds-md border border-ds-hairline">
                    <p className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em] mb-1">
                      Net Flow
                    </p>
                    <p
                      className={`text-xl font-bold tabular-nums ${
                        net > 0
                          ? 'text-ds-positive'
                          : net < 0
                            ? 'text-ds-negative'
                            : 'text-ds-primary'
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
