import React from 'react';

export const Tag = ({ children, color = 'bg-black/[0.05] dark:bg-white/[0.08] text-black/60 dark:text-white/50' }) => {
  return (
    <span
      className={`
        inline-block px-2 py-0.5 rounded-md
        text-[11px] font-semibold uppercase tracking-wider
        ${color}
      `}
    >
      {children}
    </span>
  );
};
