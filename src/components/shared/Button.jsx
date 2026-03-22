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
    sm: 'px-3.5 py-1.5 text-[12px] gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-[13px] gap-2 rounded-lg',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl'
  };

  const variantClasses = {
    primary: 'bg-[#1a1a2e] dark:bg-white/[0.12] text-white dark:text-white/90 hover:bg-[#16213e] dark:hover:bg-white/[0.18] shadow-sm shadow-black/5',
    accent: 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-400 shadow-sm shadow-emerald-600/10',
    ghost: 'border border-black/[0.1] dark:border-white/[0.1] text-black/70 dark:text-white/60 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:border-black/[0.15] dark:hover:border-white/[0.15]',
    danger: 'bg-red-500/90 dark:bg-red-500/80 text-white hover:bg-red-600 dark:hover:bg-red-500 shadow-sm shadow-red-500/10',
    soft: 'bg-black/[0.04] dark:bg-white/[0.06] text-black/70 dark:text-white/60 hover:bg-black/[0.07] dark:hover:bg-white/[0.1]',
    secondary: 'bg-black/[0.04] dark:bg-white/[0.06] text-black/70 dark:text-white/60 hover:bg-black/[0.07] dark:hover:bg-white/[0.1]',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-semibold transition-all duration-150
        ${sizeClasses[size]}
        ${variantClasses[variant] || variantClasses.primary}
        ${full ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  );
};
