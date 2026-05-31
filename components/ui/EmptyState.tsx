// components/ui/EmptyState.tsx
import { Button } from './Button'

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
        <Button variant="ghost" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
