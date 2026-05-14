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
    primary:   'bg-ds-accent text-ds-on-accent hover:bg-ds-accent-hover',
    secondary: 'bg-ds-surface border border-ds-border text-ds-primary hover:bg-ds-inset',
    outline:   'bg-transparent border border-ds-accent text-ds-accent hover:bg-ds-accent-soft',
    accent:    'bg-ds-accent text-ds-on-accent hover:bg-ds-accent-hover',
    ghost:     'bg-transparent text-ds-secondary hover:text-ds-primary hover:bg-ds-overlay',
    danger:    'bg-ds-negative text-white hover:opacity-90',
    soft:      'bg-ds-inset text-ds-primary hover:bg-ds-overlay',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-semibold font-ds-sans transition-all duration-150
        ${sizeClasses[size]}
        ${variantClasses[variant] || variantClasses.primary}
        ${full ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  );
};
