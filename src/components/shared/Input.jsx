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
  className = '',
  ...rest
}) => {
  return (
    <motion.div className="relative">
      {prefix && (
        <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-ds-tertiary font-medium text-[14px] pointer-events-none">
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
          w-full font-ds-sans rounded-ds-md bg-ds-inset border border-ds-hairline
          text-ds-primary placeholder-ds-tertiary tabular-nums
          transition-all duration-150
          focus:outline-none focus:border-ds-accent focus:ring-2 focus:ring-ds-accent-soft
          ${prefix ? 'pl-8' : 'px-3.5'} py-2.5
          ${big ? 'text-[20px] py-3.5 font-semibold' : 'text-[14px]'}
          disabled:opacity-40 disabled:cursor-not-allowed
          ${className}
        `}
        {...rest}
      />
    </motion.div>
  );
};
