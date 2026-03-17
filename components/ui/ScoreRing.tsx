'use client'

type ScoreRingProps = {
  score: number    // 0–100
  size?: number
  strokeWidth?: number
  label?: string
}

function scoreColor(score: number) {
  if (score >= 90) return '#6366f1'   // brand violet
  if (score >= 70) return '#10b981'   // green
  if (score >= 40) return '#f59e0b'   // amber
  return '#ef4444'                     // red
}

export default function ScoreRing({ score, size = 80, strokeWidth = 7, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
        {/* Score text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight={700}
          fontFamily="Inter, sans-serif"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {score}%
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      )}
    </div>
  )
}
