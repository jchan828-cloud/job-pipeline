import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MatchBadge } from '../MatchBadge'
import { RepostBadge } from '../RepostBadge'

describe('MatchBadge', () => {
  it('renders Strong with score', () => {
    render(<MatchBadge score={92} match="Strong" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
    expect(screen.getByText(/92/)).toBeInTheDocument()
  })

  it('renders Unknown', () => {
    render(<MatchBadge score={0} match="Unknown" />)
    expect(screen.getByText(/unknown/i)).toBeInTheDocument()
  })

  it('renders — when score is 0', () => {
    render(<MatchBadge score={0} match="Unknown" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('RepostBadge', () => {
  it('renders compact repost chip', () => {
    render(
      <RepostBadge
        originalDateFound="2026-04-01"
        changes={[]}
        expanded={false}
      />
    )
    expect(screen.getByLabelText(/repost/i)).toBeInTheDocument()
  })

  it('renders expanded with no changes', () => {
    render(
      <RepostBadge
        originalDateFound="2026-04-01"
        changes={[]}
        expanded
      />
    )
    expect(screen.getByText(/repost/i)).toBeInTheDocument()
    expect(screen.getByText(/originally posted/i)).toBeInTheDocument()
  })

  it('renders expanded diff with changes', () => {
    render(
      <RepostBadge
        originalDateFound="2026-04-01"
        changes={[{ field: 'salary', from: '$180k', to: '$195k' }]}
        expanded
      />
    )
    expect(screen.getByText('$180k')).toBeInTheDocument()
    expect(screen.getByText('$195k')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
  })
})
