import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PipelineCard } from '../PipelineCard'
import type { PipelineEntry } from '../../../lib/types'

const entry: PipelineEntry = {
  id: 'j1', company: 'BMO Financial', title: 'Director, Procurement',
  stage: 'To Apply', dateApplied: '', lastActivity: '2026-05-31',
  nextFollowUp: '2026-06-07', contactName: 'Jane Smith',
  contactEmail: 'jane@bmo.com', salaryOffered: '$185k–$210k', notes: '',
}

describe('PipelineCard', () => {
  it('renders company, title and stage', () => {
    render(<PipelineCard entry={entry} />)
    expect(screen.getByText('BMO Financial')).toBeInTheDocument()
    expect(screen.getByText('Director, Procurement')).toBeInTheDocument()
    expect(screen.getByText('To Apply')).toBeInTheDocument()
  })

  it('shows salary when available', () => {
    render(<PipelineCard entry={entry} />)
    expect(screen.getByText('$185k–$210k')).toBeInTheDocument()
  })

  it('does not render contact when empty', () => {
    render(<PipelineCard entry={{ ...entry, contactName: '' }} />)
    expect(screen.queryByText(/Contact:/i)).not.toBeInTheDocument()
  })
})
