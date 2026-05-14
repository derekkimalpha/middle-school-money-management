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
    ? 'bg-ds-negative hover:opacity-90 text-white'
    : 'bg-ds-accent hover:bg-ds-accent-hover text-ds-on-accent';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-ds-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-sm bg-ds-surface rounded-ds-xl border border-ds-hairline p-6"
          >
            <h3 className="text-[16px] font-semibold text-ds-primary mb-2 tracking-[-0.01em]">{title}</h3>
            {message && (
              <p className="text-[13px] text-ds-secondary mb-5 leading-relaxed">{message}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-[13px] font-semibold rounded-full border border-ds-border text-ds-secondary hover:bg-ds-inset transition-colors disabled:opacity-40"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors disabled:opacity-40 ${btnClass}`}
              >
                {loading ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
