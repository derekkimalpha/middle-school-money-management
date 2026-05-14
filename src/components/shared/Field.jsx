import React from 'react';

export const Field = ({ label, children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[11px] font-semibold text-ds-tertiary uppercase tracking-[0.05em]">
          {label}
        </label>
      )}
      {children}
    </div>
  );
};
