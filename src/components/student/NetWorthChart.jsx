import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Dot-bar histogram of net worth over time.
 *
 * - Each bar = one day, rendered as a stack of dots whose height encodes the net worth
 * - Bars stagger-rise on mount
 * - Today's bar is highlighted in pencil yellow with a floating tooltip
 * - Hovering any bar moves the tooltip and lights it up
 *
 * Props:
 *   history: [{ date: 'YYYY-MM-DD', total: number }, ...] sorted ascending
 *   currentTotal: fallback total if history is empty
 *   range: '1W' | '1M' | '3M' | 'ALL'
 *   height: SVG height in px (default 180)
 */
export const NetWorthChart = ({
  history = [],
  currentTotal = 0,
  range = 'ALL',
  height = 180,
}) => {
  const [hoverIdx, setHoverIdx] = useState(null)

  const filtered = useMemo(() => {
    if (range === 'ALL' || history.length === 0) return history
    const days = range === '1W' ? 7 : range === '1M' ? 30 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return history.filter((h) => h.date >= cutoffStr)
  }, [history, range])

  // If we have no transaction history yet, render a single bar today.
  const points = filtered.length > 0
    ? filtered
    : [{ date: new Date().toISOString().slice(0, 10), total: currentTotal }]

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayIdx = points.findIndex((p) => p.date === todayStr)
  const activeIdx = hoverIdx ?? (todayIdx >= 0 ? todayIdx : points.length - 1)

  // Geometry
  const PAD_X = 6
  const PAD_TOP = 8
  const PAD_BOTTOM = 12
  const W = 600
  const H = height
  const usableW = W - PAD_X * 2
  const usableH = H - PAD_TOP - PAD_BOTTOM

  // How many vertical dots a 1-period bar shows. Scale max-value bar to ~14 dots.
  const MAX_DOTS = 14
  const DOT_SIZE = 2.5
  const DOT_GAP = (usableH - MAX_DOTS * DOT_SIZE * 2) / (MAX_DOTS - 1)
  const DOT_PITCH = DOT_SIZE * 2 + DOT_GAP

  const max = Math.max(...points.map((p) => p.total), 1)

  const colCount = points.length
  const colW = usableW / Math.max(colCount, 1)

  const bars = points.map((p, i) => {
    const ratio = p.total / max
    const dotCount = Math.max(1, Math.round(ratio * MAX_DOTS))
    const cx = PAD_X + colW * i + colW / 2
    return { ...p, idx: i, cx, dotCount }
  })

  // Active tooltip data
  const active = bars[activeIdx]
  const activeIsToday = active?.date === todayStr

  // Tooltip horizontal placement (clamp inside chart)
  const tooltipW = 110
  let tooltipX = (active?.cx ?? W / 2) - tooltipW / 2
  if (tooltipX < 4) tooltipX = 4
  if (tooltipX + tooltipW > W - 4) tooltipX = W - tooltipW - 4

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${H}px`, display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Bars */}
      {bars.map((bar) => {
        const isActive = bar.idx === activeIdx
        const isToday = bar.date === todayStr
        const accent = isToday ? '#e8c840' : isActive ? '#1f2a1f' : '#bdb8a8'
        return (
          <g
            key={bar.date + bar.idx}
            onMouseEnter={() => setHoverIdx(bar.idx)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Hit area */}
            <rect
              x={bar.cx - colW / 2}
              y={0}
              width={colW}
              height={H}
              fill="transparent"
            />
            {Array.from({ length: bar.dotCount }).map((_, j) => {
              const cy = H - PAD_BOTTOM - j * DOT_PITCH - DOT_SIZE
              return (
                <motion.circle
                  key={j}
                  cx={bar.cx}
                  cy={cy}
                  r={DOT_SIZE}
                  fill={accent}
                  initial={{ opacity: 0, cy: H - PAD_BOTTOM }}
                  animate={{ opacity: 1, cy }}
                  transition={{
                    duration: 0.5,
                    delay: bar.idx * 0.012 + j * 0.01,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )
            })}
          </g>
        )
      })}

      {/* Floating tooltip for active bar */}
      <AnimatePresence>
        {active && (
          <motion.g
            key={`tip-${active.idx}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <rect
              x={tooltipX}
              y={2}
              width={tooltipW}
              height={36}
              rx={10}
              fill="#e8c840"
            />
            <text
              x={tooltipX + tooltipW / 2}
              y={18}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#1f2a1f"
              fontFamily="system-ui, sans-serif"
            >
              ${active.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
            <text
              x={tooltipX + tooltipW / 2}
              y={31}
              textAnchor="middle"
              fontSize="9.5"
              fill="#1f2a1f"
              opacity="0.7"
              fontFamily="system-ui, sans-serif"
            >
              {activeIsToday ? 'Today' : new Date(active.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
            {/* connector line from tooltip to bar */}
            <line
              x1={active.cx}
              y1={38}
              x2={active.cx}
              y2={H - PAD_BOTTOM - active.dotCount * DOT_PITCH}
              stroke="#e8c840"
              strokeWidth="1.5"
              strokeDasharray="2 3"
              opacity="0.55"
            />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}
