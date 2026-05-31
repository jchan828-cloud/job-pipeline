'use client'
import { usePipeline } from '../../hooks/usePipeline'
import { PipelineCard } from './PipelineCard'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { useRouter } from 'next/navigation'

export function PipelineView() {
  const { entries, isLoading, error } = usePipeline()
  const router = useRouter()

  if (error) {
    return (
      <EmptyState
        message="Failed to load pipeline"
        actionLabel="Retry"
        onAction={() => router.refresh()}
      />
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <Skeleton height={14} style={{ marginBottom: 6, width: '50%' }} />
            <Skeleton height={11} style={{ width: '30%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        message="No active applications yet — mark jobs as Interested to add them here"
      />
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {entries.length} active application{entries.length !== 1 ? 's' : ''}
        </h2>
      </div>
      <div>
        {entries.map(entry => (
          <PipelineCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
