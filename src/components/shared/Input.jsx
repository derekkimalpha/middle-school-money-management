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
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 dark:text-white/40 font-semibold text-[13px]">
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
          w-full rounded-lg border border-black/[0.1] dark:border-white/[0.1] transition-all duration-150
          focus:outline-none focus:border-[#1a1a2e]/40 dark:focus:border-white/[0.25] focus:ring-2 focus:ring-[#1a1a2e]/5 dark:focus:ring-white/[0.05]
          placeholder-black/30 dark:placeholder-white/25 text-[#1a1a2e] dark:text-white/90
          ${prefix ? 'pl-8' : 'px-3'} py-2
          ${big ? 'text-lg py-3' : 'text-[13px]'}
          bg-white dark:bg-white/[0.04]
          disabled:opacity-40 disabled:cursor-not-allowed
          ${className}
        `}
      />
    </motion.div>
  );
};
