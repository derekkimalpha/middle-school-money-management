import React from 'react';
import { motion } from 'framer-motion';

export const Input = ({
  value = '',
  onChange,
  placeholder = '',
  type = 'text',
  prefix = '',
  big = false
}) => {
  return (
    <motion.div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 font-semibold">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full rounded-lg border-2 border-slate-300 transition-all
          focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-200
          placeholder-slate-400 text-slate-800
          ${prefix ? 'pl-8' : 'px-4'} py-2
          ${big ? 'text-lg py-3' : 'text-base'}
          bg-white
        `}
      />
    </motion.div>
  );
};
