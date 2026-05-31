import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { JobDetail } from '../JobDetail'
import type { JobPosting } from '../../../lib/types'

const job: JobPosting = {
  id: 'j1', title: 'Director, Procurement', company: 'BMO Financial',
  location: 'Toronto', url: 'https://bmo.com/job', description: 'Lead procurement strategy...',
  source: 'workday', dateFound: '2026-04-01', salaryMin: 185000, salaryMax: 210000,
  matchScore: 92, requirementsMatch: 'Strong', status: 'New',
  yearsExperience: '10+', educationRequired: "Bachelor's", certificationsRequired: 'SCMP',
  skillsToolsRequired: 'Ariba, Coupa', managementRequired: 'Yes',
  securityClearance: 'None', languages: 'English', notes: '',
  isRepost: false,
}

describe('JobDetail', () => {
  it('renders title as heading', () => {
    render(<JobDetail job={job} onInterest={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Director, Procurement' })).toBeInTheDocument()
  })

  it('shows salary', () => {
    render(<JobDetail job={job} onInterest={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText(/\$185k/)).toBeInTheDocument()
  })

  it('shows repost badge when isRepost', () => {
    render(
      <JobDetail
        job={{ ...job, isRepost: true, originalJobId: 'j0', repostChanges: [{ field: 'salary', from: '$180k', to: '$195k' }] }}
        onInterest={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/repost/i)).toBeInTheDocument()
    expect(screen.getByText('$180k')).toBeInTheDocument()
  })

  it('calls onInterest when action is taken', async () => {
    const onInterest = vi.fn()
    render(<JobDetail job={job} onInterest={onInterest} onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /mark as interested/i }))
    expect(onInterest).toHaveBeenCalledWith('j1', 'interested')
  })

  it('shows "Posting closed" and hides interest actions when Dismissed', () => {
    render(<JobDetail job={{ ...job, status: 'Dismissed' }} onInterest={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText(/posting closed/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mark as interested/i })).not.toBeInTheDocument()
  })
})
