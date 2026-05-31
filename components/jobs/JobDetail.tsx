import type { JobPosting } from '../../lib/types'
import { RepostBadge } from './RepostBadge'
import { InterestActions } from './InterestActions'
import { MatchBadge } from './MatchBadge'

interface JobDetailProps {
  job: JobPosting
  onInterest: (id: string, action: 'interested' | 'skipped') => void
  onClose: () => void
  loading?: boolean
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary not listed'
  if (min && max) return `$${(min / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k`
  if (min) return `$${(min / 1000).toFixed(0)}k+`
  return ''
}

function daysAgo(dateStr: string): string {
  const time = new Date(dateStr).getTime()
  if (!Number.isFinite(time)) return 'recently'
  const days = Math.floor(Math.max(0, Date.now() - time) / (24 * 60 * 60 * 1000))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

const META_FIELDS: { key: keyof JobPosting; label: string }[] = [
  { key: 'yearsExperience', label: 'Experience' },
  { key: 'educationRequired', label: 'Education' },
  { key: 'certificationsRequired', label: 'Certifications' },
  { key: 'skillsToolsRequired', label: 'Tools' },
  { key: 'managementRequired', label: 'Management' },
  { key: 'securityClearance', label: 'Security' },
  { key: 'languages', label: 'Languages' },
]

export function JobDetail({ job, onInterest, onClose, loading }: JobDetailProps) {
  const hasSalary = !!(job.salaryMin || job.salaryMax)
  const isClosed = job.status === 'Dismissed'

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '20px',
        gap: 16,
      }}
      aria-label={`${job.title} at ${job.company}`}
    >
      {/* Mobile back button — shown via CSS class in globals.css */}
      <button
        onClick={onClose}
        aria-label="Back to job list"
        className="job-detail-back"
        style={{
          display: 'none',
          alignItems: 'center',
          gap: 6,
          color: 'var(--blue)',
          fontSize: 13,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ← Back
      </button>

      {/* Header */}
      <div>
        <h1
          style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}
          tabIndex={-1}
        >
          {job.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{job.company}</span>
          {job.location && (
            <>
              <span style={{ color: 'var(--border-active)' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{job.location}</span>
            </>
          )}
          <span style={{ color: 'var(--border-active)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Found {daysAgo(job.dateFound)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: hasSalary ? 'var(--green)' : 'var(--amber)',
            }}
          >
            {formatSalary(job.salaryMin, job.salaryMax)}
          </span>
          <MatchBadge score={job.matchScore} match={job.requirementsMatch} />
          {isClosed && (
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'var(--red-bg)',
                color: '#fca5a5',
              }}
            >
              Posting closed
            </span>
          )}
        </div>
      </div>

      {/* Repost diff */}
      {job.isRepost && (
        <RepostBadge
          originalDateFound={job.dateFound}
          changes={job.repostChanges ?? []}
          expanded
        />
      )}

      {/* Interest actions */}
      {!isClosed && (
        <InterestActions
          currentStatus={job.status}
          url={job.url}
          onAction={action => onInterest(job.id, action)}
          loading={loading}
        />
      )}

      {/* Requirements metadata */}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '6px 16px',
          fontSize: 12,
        }}
      >
        {META_FIELDS.map(({ key, label }) => {
          const value = job[key] as string
          if (!value) return null
          return (
            <div key={key} style={{ display: 'contents' }}>
              <dt style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</dt>
              <dd style={{ color: 'var(--text-secondary)' }}>{value}</dd>
            </div>
          )
        })}
      </dl>

      {/* Description */}
      {job.description && (
        <section>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Description
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {job.description}
          </p>
        </section>
      )}

      {job.closingDate && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Closes: {job.closingDate}
        </p>
      )}
    </article>
  )
}
