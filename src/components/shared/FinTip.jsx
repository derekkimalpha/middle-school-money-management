import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FinTip = ({
  icon = '💡',
  title = 'Tip',
  children,
  color
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="rounded-2xl p-4 cursor-pointer transition-all duration-200 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5"
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="font-bold text-[14px] text-gray-900 dark:text-white">{title}</h3>
        </div>
        <motion.svg
          className="w-4 h-4 text-violet-400 dark:text-violet-400"
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
            className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-500/20 text-[14px] text-gray-600 dark:text-white/60 leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
