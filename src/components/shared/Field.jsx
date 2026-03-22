import React from 'react';

export const Field = ({ label, children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[12px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider">
          {label}
        </label>
      )}
      {children}
    </div>
  );
};
