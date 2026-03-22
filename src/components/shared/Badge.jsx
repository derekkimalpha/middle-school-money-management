import React from 'react';
import { motion } from 'framer-motion';

export const Badge = ({
  badge = { id: '', title: '', icon: '', description: '', earned: false },
  delay = 0
}) => {
  const { title, icon, description, earned } = badge;

  return (
    <motion.div
      className={`flex flex-col items-center gap-3 p-4 rounded-lg transition-all ${
        earned
          ? 'bg-stone-100 dark:bg-stone-800'
          : 'bg-stone-200 dark:bg-stone-700 grayscale opacity-50'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={earned ? { scale: 1.05 } : {}}
    >
      <motion.div
        className="text-4xl"
        animate={
          earned
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }
            : {}
        }
        transition={{
          duration: 0.6,
          repeat: earned ? Infinity : 0,
          repeatDelay: 2
        }}
      >
        {icon}
      </motion.div>
      <div className="text-center">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        <p className="text-xs text-slate-600 mt-1">{description}</p>
      </div>
    </motion.div>
  );
};
