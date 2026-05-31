import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Skeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Strong</Badge>)
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when loading', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('Skeleton', () => {
  it('renders without crashing and is hidden from assistive tech', () => {
    const { container } = render(<Skeleton height={20} />)
    const el = container.firstChild as HTMLElement
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-hidden')
  })
})

describe('EmptyState', () => {
  it('renders message and optional action', () => {
    const onAction = vi.fn()
    render(<EmptyState message="No jobs found" actionLabel="Show all" onAction={onAction} />)
    expect(screen.getByText('No jobs found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show all' })).toBeInTheDocument()
  })
})
