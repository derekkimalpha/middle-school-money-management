import React from 'react';
import { motion } from 'framer-motion';
import { ACCOUNT_META } from '../../lib/constants';

const PICKER_COLORS = {
  checking: { dot: '#10b981', bg: 'bg-emerald-500/[0.06] dark:bg-emerald-400/[0.08]', border: 'border-emerald-500/30 dark:border-emerald-400/30', text: 'text-emerald-700 dark:text-emerald-400' },
  savings: { dot: '#06b6d4', bg: 'bg-cyan-500/[0.06] dark:bg-cyan-400/[0.08]', border: 'border-cyan-500/30 dark:border-cyan-400/30', text: 'text-cyan-700 dark:text-cyan-400' },
  sp500: { dot: '#f59e0b', bg: 'bg-amber-500/[0.06] dark:bg-amber-400/[0.08]', border: 'border-amber-500/30 dark:border-amber-400/30', text: 'text-amber-700 dark:text-amber-400' },
  nasdaq: { dot: '#8b5cf6', bg: 'bg-violet-500/[0.06] dark:bg-violet-400/[0.08]', border: 'border-violet-500/30 dark:border-violet-400/30', text: 'text-violet-700 dark:text-violet-400' },
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
