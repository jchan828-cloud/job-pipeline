// components/jobs/JobList.tsx
import type { JobPosting } from '../../lib/types'
import { JobCard } from './JobCard'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

interface JobListProps {
  jobs: JobPosting[]
  selectedId: string | null
  isLoading: boolean
  onSelect: (job: JobPosting) => void
  onShowAll: () => void
}

export function JobList({ jobs, selectedId, isLoading, onSelect, onShowAll }: JobListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
            <Skeleton height={14} style={{ marginBottom: 6, width: '65%' }} />
            <Skeleton height={11} style={{ width: '45%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        message="No jobs match this filter"
        actionLabel="Show all"
        onAction={onShowAll}
      />
    )
  }

  return (
    <div
      role="list"
      aria-label="Job listings"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {jobs.map(job => (
        <div key={job.id} role="listitem">
          <JobCard
            job={job}
            isSelected={job.id === selectedId}
            onClick={() => onSelect(job)}
          />
        </div>
      ))}
    </div>
  )
}
