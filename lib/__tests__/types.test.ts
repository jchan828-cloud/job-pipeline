import { describe, it, expect } from 'vitest'
import type { JobPosting, PipelineEntry } from '../types'

describe('JobPosting', () => {
  it('accepts the new repost fields', () => {
    const job: JobPosting = {
      id: 'test-1',
      title: 'Director',
      company: 'BMO',
      location: 'Toronto',
      url: 'https://example.com',
      description: '',
      source: 'workday',
      dateFound: '2026-05-31',
      matchScore: 90,
      requirementsMatch: 'Strong',
      status: 'Interested',
      yearsExperience: '10+',
      educationRequired: "Bachelor's",
      certificationsRequired: 'SCMP',
      skillsToolsRequired: 'Ariba',
      managementRequired: 'Yes',
      securityClearance: 'None',
      languages: 'English',
      notes: '',
      isRepost: true,
      originalJobId: 'test-0',
      repostChanges: [{ field: 'salary', from: '$180k', to: '$195k' }],
    }
    expect(job.isRepost).toBe(true)
    expect(job.repostChanges?.[0].field).toBe('salary')
    expect(job.status).toBe('Interested')
  })

  it('accepts PipelineEntry shape', () => {
    const entry: PipelineEntry = {
      id: 'test-1',
      company: 'BMO',
      title: 'Director',
      stage: 'To Apply',
      dateApplied: '',
      lastActivity: '2026-05-31',
      nextFollowUp: '',
      contactName: '',
      contactEmail: '',
      salaryOffered: '',
      notes: '',
    }
    expect(entry.stage).toBe('To Apply')
  })
})
