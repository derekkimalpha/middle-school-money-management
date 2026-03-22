import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast = ({ message = null }) => {
  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className={`fixed bottom-6 left-6 z-50 ${
            isSuccess
              ? 'bg-stone-800 dark:bg-stone-200 dark:text-stone-900 text-white'
              : 'bg-red-800 dark:bg-red-200 dark:text-red-900 text-white'
          } px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg`}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="text-lg font-bold">{isSuccess ? '✓' : '✕'}</span>
          <span className="text-[14px] font-semibold">{message.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
