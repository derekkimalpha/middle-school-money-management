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
      className="rounded-xl p-4 cursor-pointer transition-all duration-150 bg-[#f1f2f4] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.04] hover:border-black/[0.08] dark:hover:border-white/[0.08]"
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ y: -1 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold text-[13px] text-[#1a1a2e] dark:text-white/90">{title}</h3>
        </div>
        <motion.svg
          className="w-4 h-4 text-black/30 dark:text-white/30"
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
            className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] text-[13px] text-black/60 dark:text-white/50 leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
