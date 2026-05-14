import React from 'react';

export const Tag = ({ children, color }) => {
  return (
    <span
      className={`
        inline-block px-2 py-0.5 rounded-full
        text-[11px] font-semibold uppercase tracking-[0.05em]
        ${color || 'bg-ds-inset text-ds-secondary'}
      `}
    >
      {children}
    </span>
  );
};
