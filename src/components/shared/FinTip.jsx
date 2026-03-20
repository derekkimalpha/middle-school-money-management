import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FinTip = ({
  icon = '💡',
  title = 'Tip',
  children,
  color = 'from-sage-50 to-green-50'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className={`rounded-lg p-4 cursor-pointer transition-all bg-gradient-to-br ${color} border border-slate-200`}
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ translateY: -2 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <motion.svg
          className="w-5 h-5 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </motion.svg>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-700"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
