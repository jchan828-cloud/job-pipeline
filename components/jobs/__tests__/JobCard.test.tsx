import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { JobCard } from '../JobCard'
import type { JobPosting } from '../../lib/types'

const job: JobPosting = {
  id: 'j1', title: 'Director, Procurement', company: 'BMO Financial',
  location: 'Toronto', url: '', description: '', source: 'workday',
  dateFound: '2026-05-31', salaryMin: 185000, salaryMax: 210000,
  matchScore: 92, requirementsMatch: 'Strong', status: 'New',
  yearsExperience: '10+', educationRequired: '', certificationsRequired: '',
  skillsToolsRequired: '', managementRequired: '', securityClearance: '',
  languages: '', notes: '', isRepost: false,
}

describe('JobCard', () => {
  it('renders title, company, salary', () => {
    render(<JobCard job={job} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByText('Director, Procurement')).toBeInTheDocument()
    expect(screen.getByText(/BMO Financial/)).toBeInTheDocument()
    expect(screen.getByText(/\$185k/)).toBeInTheDocument()
  })

  it('shows repost badge when isRepost', () => {
    render(<JobCard job={{ ...job, isRepost: true, originalJobId: 'j0', repostChanges: [] }} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByLabelText(/repost/i)).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<JobCard job={job} isSelected={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has aria-pressed when selected', () => {
    render(<JobCard job={job} isSelected onClick={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows "Salary not listed" when no salary', () => {
    render(<JobCard job={{ ...job, salaryMin: undefined, salaryMax: undefined }} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByText(/salary not listed/i)).toBeInTheDocument()
  })
})
