import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// These would typically be imported from constants
const getLevel = (total) => {
  if (total < 100) return 1;
  if (total < 500) return 2;
  if (total < 1000) return 3;
  if (total < 5000) return 4;
  if (total < 10000) return 5;
  return Math.min(Math.floor(total / 5000), 20);
};

const getNextLevel = (level) => {
  const thresholds = [0, 100, 500, 1000, 5000, 10000];
  if (level >= 5) return Math.min(level + 1, 20) * 5000;
  return thresholds[Math.min(level + 1, thresholds.length - 1)];
};

export const LevelRing = ({ total = 0 }) => {
  const currentLevel = useMemo(() => getLevel(total), [total]);
  const nextLevelThreshold = useMemo(() => getNextLevel(currentLevel), [currentLevel]);

  const size = 120;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const levelThreshold = currentLevel === 1 ? 100 : currentLevel * 1000;
  const previousThreshold = currentLevel === 1 ? 0 : (currentLevel - 1) * 1000;
  const progress = Math.min((total - previousThreshold) / (levelThreshold - previousThreshold), 1);
  const dashLength = circumference * progress;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#d4d0cb"
            strokeWidth={4}
          />
          {/* Progress ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#7c8c78"
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - dashLength}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dashLength }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-bold text-slate-800">{currentLevel}</div>
          <div className="text-xs text-slate-500">Level</div>
        </div>
      </div>
      <div className="text-center text-xs text-slate-600">
        <div className="font-tabular-nums">${total.toLocaleString()} / ${nextLevelThreshold.toLocaleString()}</div>
      </div>
    </div>
  );
};
