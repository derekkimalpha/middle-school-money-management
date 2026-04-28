import React, { useMemo } from 'react'

/**
 * Minimal SVG line chart for net worth over time.
 * Wealthfront-style: green line, faint area fill, no axes/labels.
 *
 * `history` is an array of { date, total }, sorted ascending.
 * If empty or 1-point, renders a flat line at the current balance.
 */
export const NetWorthChart = ({ history, currentTotal = 0, height = 100 }) => {
  const { pathLine, pathArea, isUp, isFlat } = useMemo(() => {
    const pts = (history && history.length > 0)
      ? history.map((h) => h.total)
      : [currentTotal, currentTotal]

    if (pts.length === 1) pts.push(pts[0])

    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const range = max - min || 1

    // Pad the chart so a perfectly flat line still sits in the middle.
    const padTop = 8
    const padBottom = 8
    const w = 600
    const h = height
    const usableH = h - padTop - padBottom

    const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
    const ys = pts.map((v) => padTop + usableH - ((v - min) / range) * usableH)

    let line = `M ${xs[0]} ${ys[0]}`
    for (let i = 1; i < pts.length; i++) {
      line += ` L ${xs[i]} ${ys[i]}`
    }
    const area = `${line} L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`

    return {
      pathLine: line,
      pathArea: area,
      isUp: pts[pts.length - 1] >= pts[0],
      isFlat: max === min,
    }
  }, [history, currentTotal, height])

  // Sage green up, pencil-yellow flat-ish.
  const stroke = isFlat ? '#a68b5b' : isUp ? '#1D9E75' : '#c43d3d'
  const fill = isFlat ? 'rgba(166,139,91,0.10)' : isUp ? 'rgba(29,158,117,0.10)' : 'rgba(196,61,61,0.10)'

  return (
    <svg
      viewBox={`0 0 600 ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
      aria-hidden="true"
    >
      <path d={pathArea} fill={fill} />
      <path d={pathLine} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
