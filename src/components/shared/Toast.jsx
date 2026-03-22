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
              ? 'bg-emerald-600 dark:bg-emerald-500'
              : 'bg-red-500 dark:bg-red-400'
          } text-white px-5 py-3 rounded-xl flex items-center gap-2.5 shadow-lg shadow-black/10`}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <span className="text-sm font-bold">{isSuccess ? '✓' : '✕'}</span>
          <span className="text-[13px] font-medium">{message.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
