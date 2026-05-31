import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { InterestActions } from '../InterestActions'

const baseProps = {
  jobId: 'j1',
  currentStatus: 'New' as const,
  url: 'https://example.com/job',
  onAction: vi.fn(),
}

describe('InterestActions', () => {
  it('renders Interested and Skip buttons', () => {
    render(<InterestActions {...baseProps} />)
    expect(screen.getByRole('button', { name: /mark as interested/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip this job/i })).toBeInTheDocument()
  })

  it('calls onAction with "interested"', async () => {
    const onAction = vi.fn()
    render(<InterestActions {...baseProps} onAction={onAction} />)
    await userEvent.click(screen.getByRole('button', { name: /mark as interested/i }))
    expect(onAction).toHaveBeenCalledWith('interested')
  })

  it('calls onAction with "skipped"', async () => {
    const onAction = vi.fn()
    render(<InterestActions {...baseProps} onAction={onAction} />)
    await userEvent.click(screen.getByRole('button', { name: /skip this job/i }))
    expect(onAction).toHaveBeenCalledWith('skipped')
  })

  it('shows confirmed state when Interested', () => {
    render(<InterestActions {...baseProps} currentStatus="Interested" />)
    expect(screen.getByText(/interested ✓/i)).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(<InterestActions {...baseProps} loading />)
    expect(screen.getByRole('button', { name: /mark as interested/i })).toBeDisabled()
  })
})
