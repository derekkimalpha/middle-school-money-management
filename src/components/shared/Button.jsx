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
    md: 'px-4 py-2.5 text-[13px] gap-2 rounded-xl',
    lg: 'px-6 py-3.5 text-sm gap-2 rounded-xl'
  };

  const variantClasses = {
    primary: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm',
    accent: 'bg-teal-500 text-white hover:bg-teal-600 shadow-sm shadow-teal-500/20',
    ghost: 'border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20',
    soft: 'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/[0.1]',
    secondary: 'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/[0.1]',
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
