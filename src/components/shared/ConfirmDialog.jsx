import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ConfirmDialog = ({
  open = false,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' or 'primary'
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  const btnClass = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            {message && (
              <p className="text-sm text-gray-500 dark:text-white/50 mb-6">{message}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-colors disabled:opacity-40 ${btnClass}`}
              >
                {loading ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
