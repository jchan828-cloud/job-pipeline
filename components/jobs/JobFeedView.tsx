// components/jobs/JobFeedView.tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useCallback, useState } from 'react'
import type { FilterState, JobPosting } from '../../lib/types'
import { useJobs } from '../../hooks/useJobs'
import { useJobActions } from '../../hooks/useJobActions'
import { FilterBar } from './FilterBar'
import { JobList } from './JobList'
import { JobDetail } from './JobDetail'
import { EmptyState } from '../ui/EmptyState'

export function JobFeedView() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeFilter = (searchParams.get('filter') ?? 'all') as FilterState['filter']
  const activeCompany = searchParams.get('company')
  const selectedId = searchParams.get('job')

  const filters: FilterState = {
    filter: activeFilter,
    company: activeCompany,
    minScore: null,
  }

  const { jobs, filteredJobs, counts, companies, isLoading, error } = useJobs(filters)
  const { markInterested, markSkipped, loadingId } = useJobActions()
  const [actionError, setActionError] = useState<string | null>(null)

  const selectedJob = jobs.find(j => j.id === selectedId) ?? null

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    router.replace(`/?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  function handleFilterChange(f: FilterState) {
    updateParams({
      filter: f.filter === 'all' ? null : f.filter,
      company: f.company,
      job: null,
    })
  }

  function handleSelect(job: JobPosting) {
    updateParams({ job: job.id })
  }

  const handleClose = useCallback(() => {
    updateParams({ job: null })
  }, [updateParams])

  const handleInterest = useCallback(async (id: string, action: 'interested' | 'skipped') => {
    const job = jobs.find(j => j.id === id)
    if (!job) return
    setActionError(null)
    try {
      if (action === 'interested') await markInterested(job)
      else await markSkipped(job)
    } catch {
      setActionError('Action failed — please try again')
    }
  }, [jobs, markInterested, markSkipped])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

    if (e.key === 'Escape') { handleClose(); return }

    const currentIdx = filteredJobs.findIndex(j => j.id === selectedId)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (currentIdx === -1) {
        if (filteredJobs.length > 0) updateParams({ job: filteredJobs[0].id })
      } else {
        const next = filteredJobs[currentIdx + 1]
        if (next) updateParams({ job: next.id })
      }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentIdx <= 0) return  // nothing selected or already at top
      const prev = filteredJobs[currentIdx - 1]
      if (prev) updateParams({ job: prev.id })
    }
    if (e.key === 'i' && selectedJob) {
      handleInterest(selectedJob.id, 'interested')
    }
    if (e.key === 's' && selectedJob) {
      handleInterest(selectedJob.id, 'skipped')
    }
  }, [filteredJobs, selectedId, selectedJob, updateParams, handleClose, handleInterest])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (error) {
    return (
      <EmptyState
        message="Failed to load jobs. Check your Google Sheets connection."
        actionLabel="Retry"
        onAction={() => router.refresh()}
      />
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* List panel — hidden on mobile when a job is selected */}
      <div
        style={{
          width: '38%',
          minWidth: 280,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        className={selectedId ? 'job-list-panel--has-selection' : ''}
      >
        <FilterBar
          activeFilter={activeFilter}
          activeCompany={activeCompany}
          minScore={null}
          counts={counts}
          companies={companies}
          onChange={handleFilterChange}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <JobList
            jobs={filteredJobs}
            selectedId={selectedId}
            isLoading={isLoading}
            onSelect={handleSelect}
            onShowAll={() => handleFilterChange({ filter: 'all', company: null, minScore: null })}
          />
        </div>
      </div>

      {/* Detail panel */}
      <div
        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        className="job-detail-panel"
      >
        {actionError && (
          <div style={{
            padding: '8px 16px',
            background: 'var(--red-bg)',
            color: '#fca5a5',
            fontSize: 12,
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            {actionError}
            <button onClick={() => setActionError(null)} style={{ color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
        )}
        {selectedJob ? (
          <JobDetail
            job={selectedJob}
            onInterest={handleInterest}
            onClose={handleClose}
            loading={loadingId === selectedJob.id}
          />
        ) : (
          <EmptyState message="Select a job to read details" />
        )}
      </div>
    </div>
  )
}
