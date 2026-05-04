import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  full = false,
  size = 'md',
  type = 'button',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-[12px] gap-1.5 rounded-full',
    md: 'px-5 py-2.5 text-[13px] gap-2 rounded-full',
    lg: 'px-6 py-3.5 text-[14px] gap-2 rounded-full'
  };

  const variantClasses = {
    primary: 'bg-alpha-blue-500 text-white hover:bg-alpha-blue-600 dark:hover:bg-alpha-blue-600 shadow-soft',
    secondary: 'bg-alpha-blue-100 text-alpha-blue-700 hover:bg-alpha-blue-200 dark:bg-alpha-blue-900/40 dark:text-alpha-blue-300 dark:hover:bg-alpha-blue-900/60 shadow-soft',
    outline: 'border-2 border-alpha-blue-500 text-alpha-blue-500 hover:bg-alpha-blue-50 dark:border-alpha-blue-400 dark:text-alpha-blue-400 dark:hover:bg-alpha-blue-900/30',
    accent: 'bg-pencil hover:bg-pencil-dark text-ink shadow-soft',
    ghost: 'border border-black/[0.1] dark:border-white/10 text-ink dark:text-white/60 hover:bg-paper-warm dark:hover:bg-white/5',
    danger: 'bg-red-700 text-white hover:bg-red-800 shadow-soft',
    soft: 'bg-paper-warm dark:bg-white/[0.06] text-ink-light dark:text-white/60 hover:bg-surface-3 dark:hover:bg-white/[0.1]',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-bold transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant] || variantClasses.primary}
        ${full ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={!disabled ? { y: -1, scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
    >
      {children}
    </motion.button>
  );
};
