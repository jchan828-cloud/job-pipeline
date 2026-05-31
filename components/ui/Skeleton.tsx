// components/ui/Skeleton.tsx
interface SkeletonProps {
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-active) 50%, var(--bg-card) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 'var(--radius-sm)',
        ...style,
      }}
    />
  )
}
