'use client'
import { useSearchParams, useRouter } from 'next/navigation'

export function NavBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = searchParams.get('view') ?? 'feed'

  function switchView(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', next)
    params.delete('job')
    router.replace(`/?${params.toString()}`)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? 'var(--bg-card-active)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    border: 'none',
    transition: 'background 0.15s, color 0.15s',
  })

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-base)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
        Job Pipeline
      </span>
      <div role="tablist" style={{ display: 'flex', gap: 4 }}>
        <button
          role="tab"
          aria-selected={view === 'feed'}
          onClick={() => switchView('feed')}
          style={tabStyle(view === 'feed')}
        >
          Feed
        </button>
        <button
          role="tab"
          aria-selected={view === 'pipeline'}
          onClick={() => switchView('pipeline')}
          style={tabStyle(view === 'pipeline')}
        >
          My Pipeline
        </button>
      </div>
    </nav>
  )
}
