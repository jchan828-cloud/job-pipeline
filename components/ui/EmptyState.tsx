// components/ui/EmptyState.tsx
interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '40px 20px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 14 }}>{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            fontSize: 13,
            color: 'var(--blue)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
