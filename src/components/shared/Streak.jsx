import React from 'react';
import { motion } from 'framer-motion';

export const Streak = ({ count = 0 }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-200 to-orange-200">
      <motion.span
        className="text-xl"
        animate={{
          y: [0, -2, 0]
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 1
        }}
      >
        🔥
      </motion.span>
      <span className="font-bold text-amber-900 text-sm">{count} day streak</span>
    </div>
  );
};
