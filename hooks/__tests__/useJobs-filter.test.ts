import { describe, it, expect } from 'vitest'
import { filterJobs, countByStatus } from '../useJobs'
import type { JobPosting } from '../../lib/types'

function makeJob(overrides: Partial<JobPosting>): JobPosting {
  return {
    id: 'j1', title: 'Director', company: 'BMO', location: 'Toronto',
    url: '', description: '', source: 'workday', dateFound: '2026-05-31',
    matchScore: 85, requirementsMatch: 'Strong', status: 'New',
    yearsExperience: '10+', educationRequired: '', certificationsRequired: '',
    skillsToolsRequired: '', managementRequired: '', securityClearance: '',
    languages: '', notes: '', isRepost: false,
    ...overrides,
  }
}

describe('filterJobs', () => {
  const jobs = [
    makeJob({ id: 'j1', status: 'New', company: 'BMO', matchScore: 92 }),
    makeJob({ id: 'j2', status: 'Interested', company: 'RBC', matchScore: 80 }),
    makeJob({ id: 'j3', status: 'Skipped', company: 'BMO', matchScore: 60 }),
    makeJob({ id: 'j4', status: 'New', company: 'Shopify', matchScore: 55 }),
  ]

  it('filter=all returns all', () => {
    expect(filterJobs(jobs, { filter: 'all', company: null, minScore: null })).toHaveLength(4)
  })

  it('filter=new returns only New', () => {
    const result = filterJobs(jobs, { filter: 'new', company: null, minScore: null })
    expect(result.every(j => j.status === 'New')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('filter=interested returns only Interested', () => {
    const result = filterJobs(jobs, { filter: 'interested', company: null, minScore: null })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('j2')
  })

  it('company filter narrows by company', () => {
    const result = filterJobs(jobs, { filter: 'all', company: 'BMO', minScore: null })
    expect(result.every(j => j.company === 'BMO')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('minScore filters by score', () => {
    const result = filterJobs(jobs, { filter: 'all', company: null, minScore: 75 })
    expect(result.every(j => j.matchScore >= 75)).toBe(true)
  })
})

describe('countByStatus', () => {
  it('counts correctly', () => {
    const jobs = [
      makeJob({ status: 'New' }),
      makeJob({ status: 'New' }),
      makeJob({ status: 'Interested' }),
      makeJob({ status: 'Skipped' }),
    ]
    const counts = countByStatus(jobs)
    expect(counts).toEqual({ all: 4, new: 2, interested: 1, skipped: 1 })
  })
})
