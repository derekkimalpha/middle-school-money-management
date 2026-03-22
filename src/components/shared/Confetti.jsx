import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const Confetti = ({ active = false }) => {
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      id: Math.random(),
      color: ['bg-stone-300', 'bg-sage-300', 'bg-amber-300', 'bg-rose-300', 'bg-stone-400', 'bg-stone-200', 'bg-stone-400'][
        Math.floor(Math.random() * 7)
      ],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1
    }));
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className={`absolute w-2 h-2 rounded-full ${piece.color}`}
          style={{
            left: `${piece.left}%`,
            top: '-10px'
          }}
          animate={{
            y: window.innerHeight + 10,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn'
          }}
        />
      ))}
    </div>
  );
};
