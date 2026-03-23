import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

export const FinTip = ({
  icon,
  title = 'Tip',
  children,
  color
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="rounded-xl p-4 cursor-pointer transition-all duration-200 bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-200/60 dark:border-amber-400/[0.12] hover:border-amber-300 dark:hover:border-amber-400/[0.2] hover:shadow-md"
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-400/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 px-1.5 py-0.5 rounded">Learn</span>
            <h3 className="font-bold text-[14px] text-gray-900 dark:text-white">{title}</h3>
          </div>
        </div>
        <motion.svg
          className="w-4 h-4 text-amber-400 dark:text-amber-400/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-amber-200/40 dark:border-amber-400/[0.08] text-[14px] text-gray-600 dark:text-white/60 leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
