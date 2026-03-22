import {
  Wallet,
  PiggyBank,
  TrendingUp,
  BarChart3,
  Gift,
} from 'lucide-react'

// Account metadata with colors and icons
export const ACCOUNT_META = {
  checking: {
    label: 'Checking',
    tag: 'checking',
    color: 'text-sage',
    bgColor: 'bg-sage-bg',
    borderColor: 'border-sage',
    icon: Wallet,
  },
  savings: {
    label: 'Savings',
    tag: 'savings',
    color: 'text-teal',
    bgColor: 'bg-teal-bg',
    borderColor: 'border-teal',
    icon: PiggyBank,
  },
  sp500: {
    label: 'S&P 500',
    tag: 'sp500',
    color: 'text-amber',
    bgColor: 'bg-amber-bg',
    borderColor: 'border-amber',
    icon: TrendingUp,
  },
  nasdaq: {
    label: 'NASDAQ',
    tag: 'nasdaq',
    color: 'text-stone-600 dark:text-stone-400',
    bgColor: 'bg-stone-500/[0.06]',
    borderColor: 'border-stone-400',
    icon: BarChart3,
  },
  bonus: {
    label: 'Bonus',
    tag: 'bonus',
    color: 'text-rose',
    bgColor: 'bg-rose-bg',
    borderColor: 'border-rose',
    icon: Gift,
  },
}

// Transfer rules defining which accounts can transfer to which
export const TRANSFER_RULES = {
  checking: ['savings', 'sp500', 'nasdaq', 'bonus'],
  savings: ['checking', 'sp500', 'nasdaq'],
  sp500: ['checking', 'savings'],
  nasdaq: ['checking', 'savings'],
  bonus: ['checking', 'savings', 'sp500', 'nasdaq'],
}

// Grade levels
export const GRADES = [
  'K',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th',
]

// Achievement levels
export const LEVELS = [
  {
    name: 'Rookie',
    min: 0,
    icon: '🌱',
    description: 'Just getting started',
  },
  {
    name: 'Saver',
    min: 200,
    icon: '🪴',
    description: 'Growing your wealth',
  },
  {
    name: 'Investor',
    min: 500,
    icon: '📈',
    description: 'Making smart moves',
  },
  {
    name: 'Baller',
    min: 1000,
    icon: '💎',
    description: 'Living large',
  },
  {
    name: 'Tycoon',
    min: 2000,
    icon: '👑',
    description: 'Financial mastermind',
  },
  {
    name: 'Legend',
    min: 5000,
    icon: '🏆',
    description: 'The ultimate money master',
  },
]

/**
 * Get the current level based on total balance
 * @param {number} total - Total balance across all accounts
 * @returns {object} Current level object
 */
export const getLevel = (total) => {
  let currentLevel = LEVELS[0]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (total >= LEVELS[i].min) {
      currentLevel = LEVELS[i]
      break
    }
  }
  return currentLevel
}

/**
 * Get the next level milestone
 * @param {number} total - Total balance across all accounts
 * @returns {object|null} Next level object or null if at max level
 */
export const getNextLevel = (total) => {
  for (let i = 0; i < LEVELS.length; i++) {
    if (total < LEVELS[i].min) {
      return LEVELS[i]
    }
  }
  return null
}

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number in short notation (1.2K, 1.5M, etc.)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted short string
 */
export const formatShort = (amount) => {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`
  }
  if (absAmount >= 1000) {
    return `${sign}$${(absAmount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}
