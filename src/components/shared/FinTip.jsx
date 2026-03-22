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
      className="rounded-sm p-4 cursor-pointer transition-all duration-200 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1] hover:shadow-md"
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="font-bold text-[14px] text-gray-900 dark:text-white">{title}</h3>
        </div>
        <motion.svg
          className="w-4 h-4 text-gray-400 dark:text-white/40"
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
            className="mt-3 pt-3 border-t border-gray-200 dark:border-white/[0.06] text-[14px] text-gray-600 dark:text-white/60 leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
