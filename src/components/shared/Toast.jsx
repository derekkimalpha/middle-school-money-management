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
              ? 'bg-ink dark:bg-chalk-white dark:text-ink text-white'
              : 'bg-red-800 dark:bg-red-200 dark:text-red-900 text-white'
          } px-5 py-3.5 rounded font-hand text-[16px] flex items-center gap-3 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]`}
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
