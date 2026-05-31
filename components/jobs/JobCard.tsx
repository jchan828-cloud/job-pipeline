import type { JobPosting } from '../../lib/types'
import { MatchBadge } from './MatchBadge'
import { RepostBadge } from './RepostBadge'

interface JobCardProps {
  job: JobPosting
  isSelected: boolean
  onClick: () => void
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary not listed'
  if (min && max) return `$${(min / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k`
  if (min) return `$${(min / 1000).toFixed(0)}k+`
  return ''
}

const STATUS_INDICATORS: Partial<Record<JobPosting['status'], string>> = {
  Interested: '●',
  Skipped: '●',
  'Added to Pipeline': '●',
}

const STATUS_COLORS: Partial<Record<JobPosting['status'], string>> = {
  Interested: 'var(--green)',
  Skipped: 'var(--text-muted)',
  'Added to Pipeline': 'var(--blue)',
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const salaryText = formatSalary(job.salaryMin, job.salaryMax)
  const hasSalary = !!(job.salaryMin || job.salaryMax)
  const indicator = STATUS_INDICATORS[job.status]

  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${job.title} at ${job.company}`}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 12px',
        borderLeft: `3px solid ${isSelected ? 'var(--blue)' : job.status === 'Skipped' ? 'var(--border)' : 'var(--bg-card-active)'}`,
        background: isSelected
          ? 'var(--bg-card-active)'
          : job.status === 'Skipped'
            ? 'var(--bg-card-skipped)'
            : 'var(--bg-card)',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        opacity: job.status === 'Skipped' ? 0.5 : 1,
        transition: 'background 0.1s, opacity 0.1s',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {job.title}
        </span>
        <MatchBadge score={job.matchScore} match={job.requirementsMatch} />
      </div>

      {/* Metadata row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{job.company}</span>

        {job.location && (
          <>
            <span style={{ color: 'var(--border-active)', fontSize: 10 }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.location}</span>
          </>
        )}

        <span style={{ color: 'var(--border-active)', fontSize: 10 }}>·</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: hasSalary ? 'var(--green)' : 'var(--amber)',
          }}
        >
          {salaryText}
        </span>

        {job.isRepost && (
          <>
            <span style={{ color: 'var(--border-active)', fontSize: 10 }}>·</span>
            <RepostBadge
              originalDateFound={job.dateFound}
              changes={job.repostChanges ?? []}
              expanded={false}
            />
          </>
        )}

        {indicator && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 8,
              color: STATUS_COLORS[job.status],
            }}
          >
            {indicator}
          </span>
        )}
      </div>
    </button>
  )
}
