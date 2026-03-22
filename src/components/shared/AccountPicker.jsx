import React from 'react';
import { motion } from 'framer-motion';
import { ACCOUNT_META } from '../../lib/constants';

const PICKER_COLORS = {
  checking: { dot: '#7c8c78', bg: 'bg-sage/[0.06]', border: 'border-sage/30', text: 'text-sage-600 dark:text-sage-300' },
  savings: { dot: '#6b8a87', bg: 'bg-teal/[0.06]', border: 'border-teal/30', text: 'text-teal dark:text-teal' },
  sp500: { dot: '#a68b5b', bg: 'bg-amber/[0.06]', border: 'border-amber/30', text: 'text-amber dark:text-amber' },
  nasdaq: { dot: '#78716c', bg: 'bg-stone-500/[0.06]', border: 'border-stone-400/30', text: 'text-stone-600 dark:text-stone-400' },
};

export const AccountPicker = ({
  accounts = {},
  selected = null,
  onSelect,
  exclude = [],
  showBalance = true
}) => {
  const filteredAccounts = Object.entries(accounts).filter(
    ([key]) => !exclude.includes(key) && key !== 'bonus'
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {filteredAccounts.map(([key, balance], index) => {
        const colors = PICKER_COLORS[key] || { dot: '#94a3b8', bg: 'bg-black/[0.03] dark:bg-white/[0.04]', border: 'border-black/[0.1] dark:border-white/[0.1]', text: 'text-black/70 dark:text-white/60' };
        const isSelected = selected === key;
        const label = ACCOUNT_META[key]?.label || key;

        return (
          <motion.button
            key={key}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(key)}
            className={`
              p-4 rounded-xl border-2 text-left transition-all duration-150
              ${isSelected
                ? `${colors.bg} ${colors.border}`
                : 'bg-white dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
              <span className={`text-[12px] font-semibold uppercase tracking-wider ${isSelected ? colors.text : 'text-black/50 dark:text-white/40'}`}>
                {label}
              </span>
            </div>
            {showBalance && (
              <div className={`text-lg font-bold tabular-nums ${isSelected ? 'text-[#1a1a2e] dark:text-white' : 'text-black/70 dark:text-white/60'}`}>
                ${typeof balance === 'number' ? balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : balance}
              </div>
            )}
            {isSelected && (
              <motion.div
                className={`mt-2 text-[11px] font-semibold ${colors.text}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ✓ Selected
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
