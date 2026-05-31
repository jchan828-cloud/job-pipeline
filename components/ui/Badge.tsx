// components/ui/Badge.tsx
type BadgeVariant = 'default' | 'green' | 'amber' | 'red' | 'blue' | 'orange'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#1f2937', color: 'var(--text-secondary)' },
  green:   { background: 'var(--green-bg)', color: 'var(--green)' },
  amber:   { background: 'var(--amber-bg)', color: 'var(--amber)' },
  red:     { background: 'var(--red-bg)', color: '#fca5a5' },
  blue:    { background: 'var(--blue-bg)', color: 'var(--blue)' },
  orange:  { background: '#7c2d12', color: 'var(--orange)' },
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...VARIANT_STYLES[variant],
      }}
    >
      {children}
    </span>
  )
}
