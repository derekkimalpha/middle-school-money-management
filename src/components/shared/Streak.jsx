import React from 'react';
import { motion } from 'framer-motion';

export const Streak = ({ count = 0 }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-700 dark:bg-stone-300 dark:text-stone-900">
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
        
      </motion.span>
      <span className="font-bold text-stone-100 dark:text-stone-900 text-sm">{count} day streak</span>
    </div>
  );
};
