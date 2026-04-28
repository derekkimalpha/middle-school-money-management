import React, { useEffect, useState } from 'react'

/**
 * Animated currency display with the cents portion rendered in a dimmer color.
 *   $26,887.09  →  "$26,887" big-bold + ".09" muted
 *
 * Counts up from the previously-displayed value when `value` changes.
 */
export const SplitBalance = ({
  value = 0,
  duration = 900,
  className = '',
  centsClassName = '',
}) => {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const start = display
    const target = value
    const startTime = performance.now()
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

    let frame
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = ease(progress)
      setDisplay(start + (target - start) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  const sign = display < 0 ? '-' : ''
  const abs = Math.abs(display)
  const whole = Math.floor(abs)
  const cents = Math.round((abs - whole) * 100).toString().padStart(2, '0')

  return (
    <span className={`tabular-nums ${className}`}>
      {sign}${whole.toLocaleString()}
      <span className={`opacity-30 ${centsClassName}`}>.{cents}</span>
    </span>
  )
}
