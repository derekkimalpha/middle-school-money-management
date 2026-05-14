import React from 'react';

const STATUS_STYLES = {
  draft: {
    bg: 'bg-ds-inset',
    text: 'text-ds-secondary',
    label: 'In progress',
  },
  submitted: {
    bg: 'bg-ds-accent-soft',
    text: 'text-ds-accent',
    label: 'Submitted',
  },
  allocated: {
    bg: 'bg-ds-accent-soft',
    text: 'text-ds-accent',
    label: 'Allocated',
  },
  verified: {
    bg: 'bg-ds-accent-soft',
    text: 'text-ds-accent',
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
        inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.02em]
        ${style.bg} ${style.text}
        ${className}
      `}
    >
      {showLabel ? style.label : ''}
    </span>
  );
};
