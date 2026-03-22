import React from 'react';
import { motion } from 'framer-motion';

export const Input = ({
  value = '',
  onChange,
  placeholder = '',
  type = 'text',
  prefix = '',
  big = false,
  disabled = false,
  className = ''
}) => {
  return (
    <motion.div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/40 font-bold text-[13px]">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full rounded-xl border border-gray-200 dark:border-white/10 transition-all duration-200
          focus:outline-none focus:border-violet-400 dark:focus:border-violet-500/50 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/10
          placeholder-gray-300 dark:placeholder-white/20 text-gray-900 dark:text-white
          ${prefix ? 'pl-8' : 'px-4'} py-2.5
          ${big ? 'text-lg py-3.5 font-bold' : 'text-[14px]'}
          bg-white dark:bg-white/5
          disabled:opacity-40 disabled:cursor-not-allowed
          ${className}
        `}
      />
    </motion.div>
  );
};
