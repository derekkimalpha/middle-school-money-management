import React from 'react';
import { motion } from 'framer-motion';
import { TiltCard } from './TiltCard';

export const AccountPicker = ({
  accounts = {},
  selected = null,
  onSelect,
  exclude = [],
  showBalance = true
}) => {
  const filteredAccounts = Object.entries(accounts).filter(
    ([key]) => !exclude.includes(key)
  );

  const borderColors = {
    checking: 'border-blue-400',
    savings: 'border-green-400',
    credit: 'border-amber-400',
    investment: 'border-purple-400'
  };

  const bgColors = {
    checking: 'from-blue-50 to-blue-100',
    savings: 'from-green-50 to-green-100',
    credit: 'from-amber-50 to-amber-100',
    investment: 'from-purple-50 to-purple-100'
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {filteredAccounts.map(([key, balance], index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <TiltCard
            className="h-full"
            onClick={() => onSelect(key)}
          >
            <div
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                bg-gradient-to-br ${bgColors[key] || 'from-slate-50 to-slate-100'}
                ${selected === key ? (borderColors[key] || 'border-sage-400') : 'border-slate-200'}
              `}
            >
              <div className="text-sm font-semibold text-slate-700 capitalize mb-2">
                {key}
              </div>
              {showBalance && (
                <div className="text-xl font-bold text-slate-900">
                  ${balance.toLocaleString()}
                </div>
              )}
              {selected === key && (
                <motion.div
                  className="mt-3 text-xs font-semibold text-sage-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ✓ Selected
                </motion.div>
              )}
            </div>
          </TiltCard>
        </motion.div>
      ))}
    </div>
  );
};
