// hooks/useJobActions.ts
'use client'
import { useState } from 'react'
import { mutate } from 'swr'
import type { JobPosting } from '../lib/types'

function getAuthHeader(): Record<string, string> {
  const token = process.env.NEXT_PUBLIC_API_TOKEN
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch (err) {
      // Rollback on error
      await mutate('/api/jobs')
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
