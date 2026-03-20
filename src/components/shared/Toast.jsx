import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast = ({ message = null }) => {
  if (!message) return null;

  const isSuccess = message.type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-rose-500';
  const icon = isSuccess ? '✓' : '✕';

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className={`fixed bottom-6 left-6 ${bgColor} text-white px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg`}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-lg font-bold">{icon}</span>
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
