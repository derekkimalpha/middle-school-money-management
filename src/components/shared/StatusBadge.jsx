import React from 'react';

const STATUS_STYLES = {
  draft: {
    bg: 'bg-alpha-blue-100',
    text: 'text-alpha-blue-800',
    label: 'In Progress',
  },
  submitted: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    label: 'Submitted',
  },
  allocated: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    label: 'Allocated',
  },
  verified: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    label: 'Verified',
  },
};

/**
 * StatusBadge: pill-shaped status indicator
 * @param {string} status - draft | submitted | allocated | verified
 * @param {boolean} showLabel - whether to show the label text (default: true)
 */
export const StatusBadge = ({ status = 'draft', showLabel = true, className = '' }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold
        ${style.bg} ${style.text}
        ${className}
      `}
    >
      {showLabel ? style.label : ''}
    </span>
  );
};
