import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown } from 'lucide-react';

export const FinTip = ({
  icon,
  title = 'Tip',
  children,
  color
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="rounded-ds-xl p-4 cursor-pointer transition-colors duration-150 bg-ds-inset border border-ds-hairline hover:border-ds-border"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-ds-md bg-ds-surface text-ds-secondary flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ds-tertiary">Learn</span>
            <h3 className="font-semibold text-[13px] text-ds-primary truncate">{title}</h3>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ds-tertiary flex-shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.2} />
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-ds-hairline text-[13px] text-ds-secondary leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
