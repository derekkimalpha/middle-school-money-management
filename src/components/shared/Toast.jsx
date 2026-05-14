import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

export const Toast = ({ message = null }) => {
  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 font-ds-sans
            ${isSuccess
              ? 'bg-ds-primary text-ds-canvas'
              : 'bg-ds-negative text-white'
            }
            px-4 py-3 rounded-full flex items-center gap-2.5 border border-ds-border-strong`}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/15">
            {isSuccess ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
          </span>
          <span className="text-[13px] font-semibold pr-1">{message.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
