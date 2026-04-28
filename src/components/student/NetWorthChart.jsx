import React, { useMemo } from 'react'

/**
 * Wealthfront-style net worth chart.
 * - Smooth cardinal-spline curve
 * - Faint area fill underneath
 * - End-point dot
 * - Sage green when net up, rose when down, pencil amber when flat
 *
 * Props:
 *   history: [{ date: 'YYYY-MM-DD', total: number }, ...] sorted ascending
 *   currentTotal: fallback if history is empty
 *   range: '1W' | '1M' | '3M' | 'ALL' — slices history accordingly
 *   height: SVG height (px)
 */
export const NetWorthChart = ({ history = [], currentTotal = 0, range = 'ALL', height = 140 }) => {
  const filtered = useMemo(() => {
    if (range === 'ALL') return history
    const days = range === '1W' ? 7 : range === '1M' ? 30 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return history.filter((h) => h.date >= cutoffStr)
  }, [history, range])

  const { pathLine, pathArea, endX, endY, isUp, isFlat, stroke, fill } = useMemo(() => {
    const pts = (filtered.length > 0)
      ? filtered.map((h) => h.total)
      : [currentTotal, currentTotal]

    if (pts.length === 1) pts.push(pts[0])

    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const range = max - min || 1

    const padTop = 14
    const padBottom = 12
    const padX = 4
    const w = 600
    const h = height
    const usableW = w - padX * 2
    const usableH = h - padTop - padBottom

    const xs = pts.map((_, i) => padX + (i / (pts.length - 1)) * usableW)
    const ys = pts.map((v) => padTop + usableH - ((v - min) / range) * usableH)

    // Cardinal spline → smooth Bezier curve.
    const tension = 0.35
    let line = `M ${xs[0]} ${ys[0]}`
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = i > 0 ? xs[i - 1] : xs[i]
      const y0 = i > 0 ? ys[i - 1] : ys[i]
      const x1 = xs[i]
      const y1 = ys[i]
      const x2 = xs[i + 1]
      const y2 = ys[i + 1]
      const x3 = i + 2 < xs.length ? xs[i + 2] : x2
      const y3 = i + 2 < ys.length ? ys[i + 2] : y2
      const cp1x = x1 + (x2 - x0) * tension / 2
      const cp1y = y1 + (y2 - y0) * tension / 2
      const cp2x = x2 - (x3 - x1) * tension / 2
      const cp2y = y2 - (y3 - y1) * tension / 2
      line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
    }
    const area = `${line} L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`

    const isFlat = max === min
    const isUp = pts[pts.length - 1] >= pts[0]
    const stroke = isFlat ? '#a68b5b' : isUp ? '#1D9E75' : '#c43d3d'
    const fill = isFlat ? 'rgba(166,139,91,0.10)' : isUp ? 'rgba(29,158,117,0.12)' : 'rgba(196,61,61,0.12)'

    return {
      pathLine: line,
      pathArea: area,
      endX: xs[xs.length - 1],
      endY: ys[ys.length - 1],
      isUp, isFlat, stroke, fill,
    }
  }, [filtered, currentTotal, height])

  return (
    <svg
      viewBox={`0 0 600 ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nwArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={pathArea} fill="url(#nwArea)" />
      <path
        d={pathLine}
        fill="none"
        stroke={stroke}
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* End-of-line dot */}
      <circle cx={endX} cy={endY} r="3.5" fill={stroke} />
      <circle cx={endX} cy={endY} r="6" fill={stroke} opacity="0.18" />
    </svg>
  )
}
