let _sparkId = 0

interface SparklineProps {
  data: number[]
  color: string
}

export function Sparkline({ data, color }: SparklineProps) {
  const W = 64, H = 36, padV = 4, padH = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = padH + (i / (data.length - 1)) * (W - padH * 2)
    const y = padV + (1 - (v - min) / range) * (H - padV * 2)
    return [x, y]
  })
  const linePts = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaD =
    `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} ` +
    pts.slice(1).map((p) => `L ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') +
    ` L ${pts[pts.length - 1][0].toFixed(1)},${H} L ${pts[0][0].toFixed(1)},${H} Z`
  const gid = `sg${++_sparkId}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
