import React from 'react';

export const Field = ({ label, children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[12px] font-semibold text-black/50 dark:text-white/40 uppercase tracking-wider">
          {label}
        </label>
      )}
      {children}
    </div>
  );
};
