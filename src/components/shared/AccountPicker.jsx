import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ACCOUNT_META } from '../../lib/constants';

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
        const isSelected = selected === key;
        const label = ACCOUNT_META[key]?.label || key;

        return (
          <motion.button
            key={key}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => onSelect(key)}
            className={`
              p-4 rounded-ds-lg text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ds-accent-soft
              ${isSelected
                ? 'bg-ds-accent-soft border border-ds-accent'
                : 'bg-ds-surface border border-ds-hairline hover:border-ds-border'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-semibold uppercase tracking-[0.05em] ${isSelected ? 'text-ds-accent' : 'text-ds-tertiary'}`}>
                {label}
              </span>
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-ds-accent text-ds-on-accent flex items-center justify-center">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
              )}
            </div>
            {showBalance && (
              <div className={`text-[18px] font-semibold tabular-nums ${isSelected ? 'text-ds-primary' : 'text-ds-primary'}`}>
                ${typeof balance === 'number' ? balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : balance}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
