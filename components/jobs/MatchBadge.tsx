// components/jobs/MatchBadge.tsx
import type { JobPosting } from '../../lib/types'

interface MatchBadgeProps {
  score: number
  match: JobPosting['requirementsMatch']
}

const MATCH_COLORS: Record<JobPosting['requirementsMatch'], string> = {
  Strong:  'var(--match-strong)',
  Partial: 'var(--match-partial)',
  Stretch: 'var(--match-stretch)',
  Unknown: 'var(--match-unknown)',
}

export function MatchBadge({ score, match }: MatchBadgeProps) {
  const color = MATCH_COLORS[match]
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color, lineHeight: 1 }}>
        {score > 0 ? score : '—'}
      </span>
      <span style={{ fontSize: 10, color, lineHeight: 1 }}>
        {match}
      </span>
    </span>
  )
}
