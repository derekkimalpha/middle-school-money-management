import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export const TiltCard = ({ children, className = '' }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const rotateY = (x / centerX) * 8;
    const rotateX = -(y / centerY) * 8;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{ perspective: 600 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
