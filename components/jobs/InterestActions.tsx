import type { JobPosting } from '../../lib/types'
import { Button } from '../ui/Button'

interface InterestActionsProps {
  jobId: string
  currentStatus: JobPosting['status']
  url: string
  onAction: (action: 'interested' | 'skipped') => void
  loading?: boolean
}

export function InterestActions({
  currentStatus, url, onAction, loading,
}: InterestActionsProps) {
  const isInterested = currentStatus === 'Interested'
  const isSkipped = currentStatus === 'Skipped'

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button
        variant="primary"
        onClick={() => onAction('interested')}
        disabled={loading}
        loading={loading && !isInterested}
        aria-label="Mark as interested"
        aria-pressed={isInterested}
      >
        {isInterested ? 'Interested ✓' : 'Interested'}
      </Button>

      <Button
        variant="danger"
        onClick={() => onAction('skipped')}
        disabled={loading}
        loading={loading && !isSkipped}
        aria-label="Skip this job"
        aria-pressed={isSkipped}
      >
        {isSkipped ? 'Skipped ✓' : 'Skip'}
      </Button>

      <Button
        variant="ghost"
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        aria-label="Open job description (opens in new tab)"
      >
        Open JD ↗
      </Button>
    </div>
  )
}
