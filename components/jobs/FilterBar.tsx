import type { FilterState } from '../../lib/types'

interface FilterBarProps {
  activeFilter: FilterState['filter']
  activeCompany: string | null
  minScore: number | null  // accepted for state passthrough; no UI control yet
  counts: { all: number; new: number; interested: number; skipped: number }
  companies: string[]
  onChange: (filters: FilterState) => void
}

const TABS: { key: FilterState['filter']; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'interested', label: 'Interested' },
  { key: 'skipped', label: 'Skipped' },
]

export function FilterBar({
  activeFilter, activeCompany, minScore, counts, companies, onChange,
}: FilterBarProps) {
  function setFilter(filter: FilterState['filter']) {
    onChange({ filter, company: activeCompany, minScore })
  }

  function setCompany(company: string) {
    onChange({ filter: activeFilter, company: company || null, minScore })
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 'var(--radius)',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    background: active ? 'var(--bg-card-active)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    border: active ? '1px solid var(--border-active)' : '1px solid transparent',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        flexWrap: 'nowrap',
      }}
    >
      <div role="tablist" aria-label="Filter jobs" style={{ display: 'flex', gap: 4 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeFilter === tab.key}
            onClick={() => setFilter(tab.key)}
            style={tabStyle(activeFilter === tab.key)}
            aria-label={`${tab.label} ${counts[tab.key]}`}
          >
            {tab.label} <span style={{ opacity: 0.6 }}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {companies.length > 0 && (
        <select
          value={activeCompany ?? ''}
          onChange={e => setCompany(e.target.value)}
          aria-label="Filter by company"
          style={{
            marginLeft: 'auto',
            background: 'var(--bg-input)',
            color: activeCompany ? 'var(--text-primary)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '4px 8px',
            fontSize: 12,
          }}
        >
          <option value="">All companies</option>
          {companies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}
    </div>
  )
}
