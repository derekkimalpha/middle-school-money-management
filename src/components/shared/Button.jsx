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
    sm: 'px-3.5 py-1.5 text-[12px] gap-1.5 rounded',
    md: 'px-4 py-2.5 text-[13px] gap-2 rounded',
    lg: 'px-6 py-3.5 text-sm gap-2 rounded'
  };

  const variantClasses = {
    primary: 'bg-ink dark:bg-chalk-white text-white dark:text-ink hover:bg-ink-light dark:hover:bg-chalk shadow-[2px_2px_0px_rgba(0,0,0,0.1)]',
    accent: 'bg-pencil hover:bg-pencil-dark text-ink shadow-[2px_2px_0px_rgba(0,0,0,0.1)]',
    ghost: 'border border-black/[0.1] dark:border-white/10 text-ink dark:text-white/60 hover:bg-paper-warm dark:hover:bg-white/5',
    danger: 'bg-red-700 text-white hover:bg-red-800 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]',
    soft: 'bg-paper-warm dark:bg-white/[0.06] text-ink-light dark:text-white/60 hover:bg-surface-3 dark:hover:bg-white/[0.1]',
    secondary: 'bg-paper-warm dark:bg-white/[0.06] text-ink-light dark:text-white/60 hover:bg-surface-3 dark:hover:bg-white/[0.1]',
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
