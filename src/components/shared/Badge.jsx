import React from 'react';
import { motion } from 'framer-motion';

export const Badge = ({
  badge = { id: '', title: '', icon: '', description: '', earned: false },
  delay = 0
}) => {
  const { title, icon, description, earned } = badge;

  return (
    <motion.div
      className={`flex flex-col items-center gap-3 p-4 rounded-ds-lg border transition-all ${
        earned
          ? 'bg-ds-surface border-ds-hairline'
          : 'bg-ds-inset border-ds-hairline opacity-40'
      }`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        duration: 0.4,
        type: 'spring',
        stiffness: 120
      }}
      whileHover={earned ? { y: -2 } : {}}
    >
      <motion.div
        className="text-3xl"
        animate={earned ? { scale: [1, 1.05, 1] } : {}}
        transition={{
          duration: 0.6,
          repeat: earned ? Infinity : 0,
          repeatDelay: 3
        }}
      >
        {icon}
      </motion.div>
      <div className="text-center">
        <h3 className="font-semibold text-ds-primary text-[13px]">{title}</h3>
        <p className="text-[11px] text-ds-tertiary mt-1">{description}</p>
      </div>
    </motion.div>
  );
};
