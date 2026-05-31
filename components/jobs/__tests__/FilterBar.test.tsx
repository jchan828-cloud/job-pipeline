import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FilterBar } from '../FilterBar'
import type { FilterState } from '../../../lib/types'

const counts = { all: 10, new: 5, interested: 3, skipped: 2 }

describe('FilterBar', () => {
  it('shows all filter tabs with counts', () => {
    render(
      <FilterBar
        activeFilter="all"
        activeCompany={null}
        minScore={null}
        counts={counts}
        companies={['BMO', 'RBC']}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole('tab', { name: /all.*10/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /new.*5/i })).toBeInTheDocument()
  })

  it('calls onChange when a tab is clicked', async () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        activeFilter="all"
        activeCompany={null}
        minScore={null}
        counts={counts}
        companies={[]}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('tab', { name: /interested/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'interested' })
    )
  })

  it('shows company select when companies provided', () => {
    render(
      <FilterBar
        activeFilter="all"
        activeCompany={null}
        minScore={null}
        counts={counts}
        companies={['BMO', 'RBC']}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole('combobox', { name: /filter by company/i })).toBeInTheDocument()
  })

  it('does not show company select when no companies', () => {
    render(
      <FilterBar
        activeFilter="all"
        activeCompany={null}
        minScore={null}
        counts={counts}
        companies={[]}
        onChange={vi.fn()}
      />
    )
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
