// components/jobs/RepostBadge.tsx
import type { RepostChange } from '../../lib/types'

interface RepostBadgeProps {
  originalDateFound: string
  changes: RepostChange[]
  expanded?: boolean
}

function weeksAgo(dateStr: string): string {
  const time = new Date(dateStr).getTime()
  if (!Number.isFinite(time)) return 'an unknown date'
  const diff = Math.max(0, Date.now() - time)
  const weeks = Math.round(diff / (7 * 24 * 60 * 60 * 1000))
  return weeks <= 1 ? '1 week ago' : `${weeks} weeks ago`
}

const FIELD_LABELS: Record<RepostChange['field'], string> = {
  salary: 'Salary',
  location: 'Location',
  title: 'Title',
  workArrangement: 'Work arrangement',
}

export function RepostBadge({ originalDateFound, changes, expanded = false }: RepostBadgeProps) {
  if (!expanded) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: '1px 6px',
          borderRadius: 9999,
          fontSize: 10,
          fontWeight: 600,
          background: 'var(--amber-bg)',
          color: 'var(--amber)',
        }}
        aria-label="This is a repost"
      >
        ⟳ repost
      </span>
    )
  }

  return (
    <div
      style={{
        background: '#1a1208',
        border: '1px solid var(--amber-bg)',
        borderRadius: 'var(--radius)',
        padding: '10px 12px',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 6 }}>
        ⟳ Repost · Originally posted {weeksAgo(originalDateFound)}
      </p>
      {changes.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            What changed:
          </p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {changes.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <dt style={{ color: 'var(--text-muted)', minWidth: 100 }}>
                  {FIELD_LABELS[c.field] ?? c.field}
                </dt>
                <dd style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{c.from}</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ color: 'var(--green)' }}>{c.to}</span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}
