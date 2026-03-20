import React, { useEffect, useState } from 'react';

export const AnimNum = ({
  value = 0,
  prefix = '',
  duration = 800,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const startValue = displayValue;
    const startTime = performance.now();
    const targetValue = value;

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      const currentValue = Math.round(
        startValue + (targetValue - startValue) * easedProgress
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span className={`font-tabular-nums ${className}`}>
      {prefix}
      {displayValue.toLocaleString()}
    </span>
  );
};
