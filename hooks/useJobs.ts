// hooks/useJobs.ts
'use client'
import useSWR from 'swr'
import type { JobPosting, FilterState } from '../lib/types'

function getAuthHeader(): Record<string, string> {
  const token = process.env.NEXT_PUBLIC_API_TOKEN
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fetcher = (url: string) =>
  fetch(url, { headers: getAuthHeader() }).then(r => {
    if (!r.ok) throw new Error('Failed to fetch jobs')
    return r.json() as Promise<JobPosting[]>
  })

export function filterJobs(jobs: JobPosting[], filters: FilterState): JobPosting[] {
  return jobs.filter(job => {
    if (filters.filter === 'new' && job.status !== 'New') return false
    if (filters.filter === 'interested' && job.status !== 'Interested') return false
    if (filters.filter === 'skipped' && job.status !== 'Skipped') return false
    if (filters.company && job.company !== filters.company) return false
    if (filters.minScore !== null && job.matchScore < filters.minScore) return false
    return true
  })
}

export function countByStatus(jobs: JobPosting[]) {
  return {
    all: jobs.length,
    new: jobs.filter(j => j.status === 'New').length,
    interested: jobs.filter(j => j.status === 'Interested').length,
    skipped: jobs.filter(j => j.status === 'Skipped').length,
  }
}

export function useJobs(filters: FilterState) {
  const { data, error, isLoading, mutate } = useSWR<JobPosting[]>('/api/jobs', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60_000,
  })

  const jobs = data ?? []
  const filteredJobs = filterJobs(jobs, filters)
  const counts = countByStatus(jobs)
  const companies = [...new Set(jobs.map(j => j.company))].sort()

  return { jobs, filteredJobs, counts, companies, isLoading, error, mutate }
}
