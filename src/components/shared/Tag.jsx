import React from 'react';

export const Tag = ({ children, color = 'bg-sage-100 text-sage-700' }) => {
  return (
    <span
      className={`
        inline-block px-2.5 py-1 rounded-full
        text-xs font-semibold uppercase tracking-wide
        ${color}
      `}
    >
      {children}
    </span>
  );
};
