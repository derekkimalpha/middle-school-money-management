import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const DonutChart = ({
  data = [],
  size = 200,
  stroke = 20,
  centerLabel = '',
  centerValue = '',
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const [segments, setSegments] = useState([]);

  useEffect(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;
    let currentOffset = 0;
    const gap = data.length > 1 ? 4 : 0; // small gap between segments
    const totalGap = gap * data.length;
    const usableCircumference = circumference - totalGap;

    const newSegments = data.map((item) => {
      const percentage = (item.value / total) * 100;
      const dashLength = (percentage / 100) * usableCircumference;
      const offset = currentOffset;
      currentOffset += dashLength + gap;
      return { dashLength, offset, color: item.color, percentage };
    });
    setSegments(newSegments);
  }, [data, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {/* Data segments */}
        {segments.map((segment, index) => (
          <motion.circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={stroke}
            strokeDasharray={`${segment.dashLength} ${circumference}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="round"
            initial={{ opacity: 0, strokeDasharray: `0 ${circumference}` }}
            animate={{ opacity: 1, strokeDasharray: `${segment.dashLength} ${circumference}` }}
            transition={{
              duration: 1,
              delay: index * 0.15,
              ease: [0.23, 1, 0.32, 1]
            }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        ))}
      </svg>
      {/* Center text */}
      {(centerLabel || centerValue) && (
        <div className="absolute text-center">
          {centerValue && (
            <motion.div
              className="text-2xl font-bold text-slate-900"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {centerValue}
            </motion.div>
          )}
          {centerLabel && (
            <motion.div
              className="text-xs font-medium text-slate-500 uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {centerLabel}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
