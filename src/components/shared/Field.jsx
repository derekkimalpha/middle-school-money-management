import React from 'react';

export const Field = ({ label, children }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      {children}
    </div>
  );
};
