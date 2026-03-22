import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  full = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2'
  };

  const variantClasses = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
    accent: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    ghost: 'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    soft: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-xl font-semibold transition-all
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${full ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  );
};
