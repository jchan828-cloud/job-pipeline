import type { PipelineEntry } from '../../lib/types'

interface PipelineCardProps {
  entry: PipelineEntry
}

const STAGE_COLORS: Record<string, string> = {
  'To Apply': 'var(--blue)',
  'Applied': 'var(--amber)',
  'Interview': 'var(--orange)',
  'Offer': 'var(--green)',
  'Declined': 'var(--text-muted)',
  'Rejected': 'var(--red)',
}

export function PipelineCard({ entry }: PipelineCardProps) {
  const stageColor = STAGE_COLORS[entry.stage] ?? 'var(--text-muted)'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '4px 16px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {entry.title}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
          {entry.company}
        </p>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {entry.lastActivity && <span>Active: {entry.lastActivity}</span>}
          {entry.nextFollowUp && <span>Follow up: {entry.nextFollowUp}</span>}
          {entry.contactName && <span>Contact: {entry.contactName}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: stageColor,
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 8px',
            borderRadius: 9999,
            border: `1px solid ${stageColor}`,
          }}
        >
          {entry.stage}
        </span>
        {entry.salaryOffered && (
          <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
            {entry.salaryOffered}
          </span>
        )}
      </div>
    </div>
  )
}
