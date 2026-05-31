import { describe, it, expect } from 'vitest'
import { rowToJobPosting, rowToPipelineEntry } from '../google-sheets'

describe('rowToJobPosting', () => {
  it('maps a full row including repost fields', () => {
    const row = [
      'job-1', '2026-05-31', 'BMO', 'Director', 'Toronto',
      '185000', '210000', 'https://bmo.com/job', 'workday', '2026-06-30',
      '92', 'Strong', 'New', 'Lead procurement...', '10+', "Bachelor's",
      'SCMP', 'Ariba', 'Yes', 'None', 'English', 'Notes here',
      'TRUE', 'job-0', '[{"field":"salary","from":"$180k","to":"$195k"}]',
    ]
    const job = rowToJobPosting(row)
    expect(job.id).toBe('job-1')
    expect(job.salaryMin).toBe(185000)
    expect(job.salaryMax).toBe(210000)
    expect(job.matchScore).toBe(92)
    expect(job.isRepost).toBe(true)
    expect(job.originalJobId).toBe('job-0')
    expect(job.repostChanges).toEqual([{ field: 'salary', from: '$180k', to: '$195k' }])
  })

  it('handles missing repost columns gracefully', () => {
    const row = [
      'job-2', '2026-05-31', 'RBC', 'VP', 'Toronto',
      '', '', 'https://rbc.com/job', 'greenhouse', '',
      '80', 'Partial', 'New', '', '', '', '', '', '', '', '', '',
    ]
    const job = rowToJobPosting(row)
    expect(job.isRepost).toBe(false)
    expect(job.repostChanges).toEqual([])
    expect(job.salaryMin).toBeUndefined()
  })
})

describe('rowToPipelineEntry', () => {
  it('maps a pipeline row', () => {
    const row = ['job-1', 'BMO', 'Director', 'To Apply', '', '2026-05-31', '', '', '', '$185–210k', '']
    const entry = rowToPipelineEntry(row)
    expect(entry.id).toBe('job-1')
    expect(entry.stage).toBe('To Apply')
    expect(entry.salaryOffered).toBe('$185–210k')
  })
})
