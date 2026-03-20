import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const DonutChart = ({
  data = [],
  size = 200,
  stroke = 18
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const [segments, setSegments] = useState([]);

  useEffect(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentOffset = 0;
    const newSegments = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const dashLength = (percentage / 100) * circumference;
      const offset = currentOffset;
      currentOffset += dashLength;
      return { dashLength, offset, color: item.color, percentage };
    });
    setSegments(newSegments);
  }, [data, circumference]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((segment, index) => (
        <motion.circle
          key={index}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={segment.color}
          strokeWidth={stroke}
          strokeDasharray={segment.dashLength}
          strokeDashoffset={-segment.offset}
          strokeLinecap="round"
          initial={{
            strokeDashoffset: -circumference
          }}
          animate={{
            strokeDashoffset: -segment.offset
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.1,
            ease: 'easeOut'
          }}
        />
      ))}
    </svg>
  );
};
