/**
 * Format transaction labels for payment history display
 * Simplifies labels to: "S5 W1 paycheck", "Interest", "Market: S&P 500", etc.
 */
export const formatTxLabel = (tx) => {
  const { description, category } = tx

  // Baseline deposits
  if (category === 'baseline') {
    return 'S5 starting balance'
  }

  // Paycheck allocations — extract week from description if available
  if (category === 'paycheck' && description) {
    // Match patterns like "S5 W1 paycheck" or fallback to "Weekly paycheck"
    if (description.match(/S\d+\s+W\d+/i)) {
      return description // Already formatted
    }
    return 'Weekly paycheck'
  }

  // Interest
  if (category === 'interest') {
    return 'Interest'
  }

  // Market returns
  if (category === 'market_return') {
    if (description && description.includes('S&P')) {
      return 'Market: S&P 500'
    }
    if (description && description.includes('NASDAQ')) {
      return 'Market: NASDAQ'
    }
    return 'Market return'
  }

  // Cash out
  if (category === 'cash_out') {
    return 'Cash out'
  }

  // Transfers
  if (category === 'transfer') {
    if (description && description.includes('to')) {
      return `Transfer to ${description.split('to ')[1] || 'account'}`
    }
    return 'Transfer'
  }

  // Fees
  if (category === 'fee') {
    return 'Fee'
  }

  // Bonuses
  if (category === 'bonus') {
    return 'Bonus'
  }

  // Default: use description or category
  return description || category || 'Transaction'
}
