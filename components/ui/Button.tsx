// components/ui/Button.tsx
type ButtonVariant = 'primary' | 'danger' | 'ghost'

interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  'aria-label'?: string
  'aria-pressed'?: boolean
  type?: 'button' | 'submit'
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--green-bg)', color: 'var(--green)', border: 'none' },
  danger:  { background: 'var(--red-bg)', color: '#fca5a5', border: 'none' },
  ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
}

export function Button({
  children, variant = 'primary', onClick, disabled, loading,
  'aria-label': ariaLabel, 'aria-pressed': ariaPressed, type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 'var(--radius)',
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'opacity 0.15s',
        ...VARIANT_STYLES[variant],
      }}
    >
      {loading ? (
        <span
          style={{
            width: 12, height: 12,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
}
