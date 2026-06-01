// hooks/useJobActions.ts
'use client'
import { useState } from 'react'
import { mutate } from 'swr'
import type { JobPosting } from '../lib/types'

export function useJobActions() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function updateStatus(job: JobPosting, status: JobPosting['status']) {
    setLoadingId(job.id)
    // Optimistic update
    await mutate(
      '/api/jobs',
      (current: JobPosting[] | undefined) =>
        current?.map(j => j.id === job.id ? { ...j, status } : j) ?? [],
      { revalidate: false }
    )
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch (err) {
      throw err
    } finally {
      setLoadingId(null)
      await mutate('/api/jobs')
    }
  }

  return {
    markInterested: (job: JobPosting) => updateStatus(job, 'Interested'),
    markSkipped: (job: JobPosting) => updateStatus(job, 'Skipped'),
    loadingId,
  }
}
