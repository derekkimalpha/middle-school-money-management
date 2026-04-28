import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Wealthfront-style smooth line chart.
 * - One curve, gradient fill underneath
 * - Two dashed horizontal gridlines (max + midpoint) with value labels
 * - Two x-axis labels (start date, "Today")
 * - Optional hover dot that snaps to nearest bar
 * - Animates the path drawing on mount
 */
export const NetWorthChart = ({
  history = [],
  currentTotal = 0,
  height = 220,
}) => {
  const [hoverIdx, setHoverIdx] = useState(null)

  // Pad sparse history with synthetic points so the chart always draws a visible
  // line. If we have <7 points, prepend back-dated copies of the current total
  // (or the earliest known balance) so the curve has somewhere to live.
  const points = useMemo(() => {
    const MIN_POINTS = 14
    const todayStr = new Date().toISOString().slice(0, 10)

    let base = history.length > 0
      ? [...history]
      : [{ date: todayStr, total: currentTotal }]

    // Make sure today is the last point.
    if (base[base.length - 1].date !== todayStr) {
      base.push({ date: todayStr, total: currentTotal })
    }

    if (base.length >= MIN_POINTS) return base

    // Pad with back-dated points using the earliest known total.
    const earliest = base[0].total
    const need = MIN_POINTS - base.length
    const earliestDate = new Date(base[0].date)
    const padded = []
    for (let i = need; i > 0; i--) {
      const d = new Date(earliestDate)
      d.setDate(earliestDate.getDate() - i)
      padded.push({ date: d.toISOString().slice(0, 10), total: earliest })
    }
    return [...padded, ...base]
  }, [history, currentTotal])

  const W = 700
  const PAD_X = 8
  const PAD_TOP = 20
  const PAD_BOTTOM = 28
  const usableW = W - PAD_X * 2
  const usableH = height - PAD_TOP - PAD_BOTTOM

  const totals = points.map((p) => p.total)
  const maxV = Math.max(...totals, 1)
  const minV = Math.min(...totals, 0)
  const range = maxV - minV || 1
  const midV = (maxV + minV) / 2

  const xs = points.map((_, i) =>
    points.length === 1 ? PAD_X + usableW / 2 : PAD_X + (i / (points.length - 1)) * usableW
  )
  const ys = points.map((p) => PAD_TOP + usableH - ((p.total - minV) / range) * usableH)

  // Cardinal spline path
  const linePath = useMemo(() => {
    if (xs.length === 0) return ''
    if (xs.length === 1) return `M ${xs[0]} ${ys[0]} L ${xs[0]} ${ys[0]}`
    const tension = 0.32
    let d = `M ${xs[0]} ${ys[0]}`
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = i > 0 ? xs[i - 1] : xs[i]
      const y0 = i > 0 ? ys[i - 1] : ys[i]
      const x1 = xs[i], y1 = ys[i]
      const x2 = xs[i + 1], y2 = ys[i + 1]
      const x3 = i + 2 < xs.length ? xs[i + 2] : x2
      const y3 = i + 2 < ys.length ? ys[i + 2] : y2
      const cp1x = x1 + (x2 - x0) * tension / 2
      const cp1y = y1 + (y2 - y0) * tension / 2
      const cp2x = x2 - (x3 - x1) * tension / 2
      const cp2y = y2 - (y3 - y1) * tension / 2
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
    }
    return d
  }, [xs.join(','), ys.join(',')])

  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${height - PAD_BOTTOM} L ${xs[0]} ${height - PAD_BOTTOM} Z`

  // Y-axis gridline positions
  const yMax = PAD_TOP
  const yMid = PAD_TOP + usableH * 0.5

  const formatY = (v) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  }

  const startLabel = points[0]?.date
    ? new Date(points[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  // Hover dot
  const activeIdx = hoverIdx != null ? hoverIdx : null
  const active = activeIdx != null ? { x: xs[activeIdx], y: ys[activeIdx], total: points[activeIdx].total, date: points[activeIdx].date } : null

  // Hit handler — snap to nearest x
  const handleMove = (evt) => {
    const svg = evt.currentTarget
    const rect = svg.getBoundingClientRect()
    const px = ((evt.clientX - rect.left) / rect.width) * W
    let bestI = 0
    let bestD = Infinity
    for (let i = 0; i < xs.length; i++) {
      const d = Math.abs(xs[i] - px)
      if (d < bestD) { bestD = d; bestI = i }
    }
    setHoverIdx(bestI)
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${height}px`, display: 'block', overflow: 'visible' }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nwArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F6FEB" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#1F6FEB" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nwLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7CC4FF" />
          <stop offset="100%" stopColor="#1F6FEB" />
        </linearGradient>
        <filter id="nwGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Gridlines */}
      <line x1={PAD_X} x2={W - PAD_X} y1={yMax} y2={yMax}
        stroke="currentColor" strokeOpacity="0.18" strokeDasharray="3 4" strokeWidth="0.75" />
      <line x1={PAD_X} x2={W - PAD_X} y1={yMid} y2={yMid}
        stroke="currentColor" strokeOpacity="0.12" strokeDasharray="3 4" strokeWidth="0.75" />

      {/* Y-axis labels (left-anchored above the gridlines) */}
      <text x={PAD_X} y={yMax - 6} fontSize="11" fill="currentColor" opacity="0.55"
        fontFamily="system-ui, sans-serif">
        {formatY(maxV)}
      </text>
      <text x={PAD_X} y={yMid - 6} fontSize="11" fill="currentColor" opacity="0.45"
        fontFamily="system-ui, sans-serif">
        {formatY(midV)}
      </text>

      {/* Area fill */}
      <motion.path d={areaPath} fill="url(#nwArea)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />

      {/* Line — gradient stroke with subtle glow */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="url(#nwLine)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#nwGlow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Hover dot + vertical guide */}
      {active && (
        <>
          <line x1={active.x} x2={active.x} y1={PAD_TOP} y2={height - PAD_BOTTOM}
            stroke="#1F6FEB" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 3" />
          <circle cx={active.x} cy={active.y} r="5" fill="#1F6FEB" />
          <circle cx={active.x} cy={active.y} r="9" fill="#1F6FEB" opacity="0.25" />
          <text
            x={active.x}
            y={active.y - 14}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
          >
            ${active.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </text>
        </>
      )}

      {/* X-axis labels */}
      <text x={PAD_X} y={height - 8} fontSize="11" fill="currentColor" opacity="0.55"
        fontFamily="system-ui, sans-serif">
        {startLabel}
      </text>
      <text x={W - PAD_X} y={height - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55"
        fontFamily="system-ui, sans-serif">
        Today
      </text>
    </svg>
  )
}
