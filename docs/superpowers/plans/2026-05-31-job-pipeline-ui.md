# Job Pipeline UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, accessible, dark-themed UI for triaging scraped job postings — with interest flagging, repost diffing, salary-in-list, and a split-panel layout that collapses to full-page detail on mobile.

**Architecture:** Feature-based components under `components/jobs/` and `components/pipeline/`, three SWR hooks connecting to three Next.js route handlers that read/write Google Sheets. URL search params (`?view=`, `?job=`, `?filter=`, `?company=`) carry all UI state — no React context needed.

**Tech Stack:** Next.js 16.2.6 App Router · React 19 · SWR · Google Sheets API (`googleapis`) · CSS Modules · Vitest + React Testing Library

---

> **IMPORTANT — Before writing any code:** Read `node_modules/next/dist/docs/` for Next.js 16-specific APIs. Key areas to check: route handler `params` (may be a `Promise` in Next.js 15+), `useSearchParams` Suspense requirements, and Client Component `'use client'` placement.

---

## File Map

```
lib/
  types.ts                        MODIFY — add repost fields, PipelineEntry, extend Status
  config.ts                       MODIFY — add 3 new JOBS_FEED_HEADERS, update appendJobs cols
  google-sheets.ts                MODIFY — add getJobs, getJobById, getPipelineEntries, appendPipelineEntry; update appendJobs

app/
  layout.tsx                      MODIFY — metadata, NavBar, dark bg
  page.tsx                        MODIFY — Suspense wrapper, view switching
  globals.css                     MODIFY — CSS custom properties, resets
  api/
    jobs/route.ts                 CREATE — GET /api/jobs
    jobs/[id]/route.ts            CREATE — PATCH /api/jobs/[id]
    pipeline/route.ts             CREATE — GET /api/pipeline

components/
  ui/
    Badge.tsx                     CREATE
    Button.tsx                    CREATE
    Skeleton.tsx                  CREATE
    EmptyState.tsx                CREATE
    NavBar.tsx                    CREATE
  jobs/
    MatchBadge.tsx                CREATE
    RepostBadge.tsx               CREATE
    InterestActions.tsx           CREATE
    FilterBar.tsx                 CREATE
    JobCard.tsx                   CREATE
    JobDetail.tsx                 CREATE
    JobList.tsx                   CREATE
    JobFeedView.tsx               CREATE
  pipeline/
    PipelineCard.tsx              CREATE
    PipelineView.tsx              CREATE

hooks/
  useJobs.ts                      CREATE
  useJobActions.ts                CREATE
  usePipeline.ts                  CREATE

vitest.config.ts                  CREATE
vitest.setup.ts                   CREATE
```

---

## Task 1: Test environment

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Expected: packages added to `devDependencies` in `package.json`.

- [ ] **Step 2: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Create vitest setup**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify test runner works**

```bash
npm test
```

Expected output: `No test files found` (or similar — zero failures).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "chore: add vitest + react testing library"
```

---

## Task 2: Schema updates

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/config.ts`

- [ ] **Step 1: Write failing test for new type shape**

Create `lib/__tests__/types.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — expect TypeScript errors (types don't exist yet)**

```bash
npm test -- lib/__tests__/types.test.ts
```

Expected: compile errors on `isRepost`, `repostChanges`, `PipelineEntry`.

- [ ] **Step 3: Update lib/types.ts**

Replace the full file:

```typescript
export interface ScrapedJob {
  title: string
  company: string
  location: string
  url: string
  description: string
  salaryMin?: number
  salaryMax?: number
  closingDate?: string
  source: string
}

export interface RepostChange {
  field: 'salary' | 'location' | 'title' | 'workArrangement'
  from: string
  to: string
}

export interface JobPosting extends ScrapedJob {
  id: string
  dateFound: string
  matchScore: number
  requirementsMatch: 'Strong' | 'Partial' | 'Stretch' | 'Unknown'
  status: 'New' | 'Reviewed' | 'Interested' | 'Skipped' | 'Added to Pipeline' | 'Dismissed'
  yearsExperience: string
  educationRequired: string
  certificationsRequired: string
  skillsToolsRequired: string
  managementRequired: string
  securityClearance: string
  languages: string
  notes: string
  // repost fields
  isRepost: boolean
  originalJobId?: string
  repostChanges?: RepostChange[]
}

export interface PipelineEntry {
  id: string
  company: string
  title: string
  stage: string
  dateApplied: string
  lastActivity: string
  nextFollowUp: string
  contactName: string
  contactEmail: string
  salaryOffered: string
  notes: string
}

export interface TargetCompany {
  company: string
  sector: string
  tier: 1 | 2 | 3
  atsPlatform: 'Workday' | 'Greenhouse' | 'Lever' | 'Taleo' | 'SuccessFactors' | 'Custom'
  careersUrl: string
  atsIdentifier: string
  compRangeEst: string
  notes: string
}

export interface CompBenchmark {
  roleTitle: string
  sector: string
  baseMin: number
  baseMax: number
  totalCompMin: number
  totalCompMax: number
  source: string
  notes: string
}

export interface StrategyMilestone {
  month: string
  phase: string
  actionItems: string
  status: 'Not Started' | 'In Progress' | 'Complete'
}

export interface UserProfile {
  yearsExperience: string
  currentTitle: string
  designations: string[]
  education: string
  tools: string[]
  spendPortfolio: string
  languages: string[]
  locationPreference: string[]
  managementExperience: boolean
  minTotalComp: number
  targetTotalComp: string
}

export interface ScrapeResult {
  source: string
  jobs: ScrapedJob[]
  errors: string[]
}

export interface FilterState {
  filter: 'all' | 'new' | 'interested' | 'skipped'
  company: string | null
  minScore: number | null
}
```

- [ ] **Step 4: Update lib/config.ts — add 3 new headers**

In `JOBS_FEED_HEADERS`, append after `"Notes"`:
```typescript
export const JOBS_FEED_HEADERS = [
  "ID", "Date Found", "Company", "Title", "Location",
  "Salary Min", "Salary Max", "URL", "Source", "Closing Date",
  "Match Score", "Requirements Match", "Status", "Description",
  "Years Experience Required", "Education Required", "Certifications Required",
  "Skills/Tools Required", "Management Required", "Security Clearance",
  "Languages", "Notes",
  // new columns W–Y
  "Is Repost", "Original Job ID", "Repost Changes",
]
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npm test -- lib/__tests__/types.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/config.ts lib/__tests__/types.test.ts
git commit -m "feat: extend JobPosting schema with repost fields and PipelineEntry type"
```

---

## Task 3: Google Sheets layer

**Files:**
- Modify: `lib/google-sheets.ts`

- [ ] **Step 1: Write failing tests for row mapping**

Create `lib/__tests__/google-sheets-mapping.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run — expect fail (functions not exported)**

```bash
npm test -- lib/__tests__/google-sheets-mapping.test.ts
```

Expected: FAIL — `rowToJobPosting` and `rowToPipelineEntry` are not exported.

- [ ] **Step 3: Add helper functions and new exports to lib/google-sheets.ts**

Add these exports at the top of the file (after imports):

```typescript
import { JobPosting, PipelineEntry } from './types'

export function rowToJobPosting(row: string[]): JobPosting {
  return {
    id: row[0] ?? '',
    dateFound: row[1] ?? '',
    company: row[2] ?? '',
    title: row[3] ?? '',
    location: row[4] ?? '',
    salaryMin: row[5] ? Number(row[5]) : undefined,
    salaryMax: row[6] ? Number(row[6]) : undefined,
    url: row[7] ?? '',
    source: row[8] ?? '',
    closingDate: row[9] || undefined,
    matchScore: Number(row[10]) || 0,
    requirementsMatch: (row[11] as JobPosting['requirementsMatch']) || 'Unknown',
    status: (row[12] as JobPosting['status']) || 'New',
    description: row[13] ?? '',
    yearsExperience: row[14] ?? '',
    educationRequired: row[15] ?? '',
    certificationsRequired: row[16] ?? '',
    skillsToolsRequired: row[17] ?? '',
    managementRequired: row[18] ?? '',
    securityClearance: row[19] ?? '',
    languages: row[20] ?? '',
    notes: row[21] ?? '',
    isRepost: row[22] === 'TRUE',
    originalJobId: row[23] || undefined,
    repostChanges: (() => {
      try { return row[24] ? JSON.parse(row[24]) : [] } catch { return [] }
    })(),
  }
}

export function rowToPipelineEntry(row: string[]): PipelineEntry {
  return {
    id: row[0] ?? '',
    company: row[1] ?? '',
    title: row[2] ?? '',
    stage: row[3] ?? '',
    dateApplied: row[4] ?? '',
    lastActivity: row[5] ?? '',
    nextFollowUp: row[6] ?? '',
    contactName: row[7] ?? '',
    contactEmail: row[8] ?? '',
    salaryOffered: row[9] ?? '',
    notes: row[10] ?? '',
  }
}
```

- [ ] **Step 4: Add getJobs(), getJobById(), getPipelineEntries(), appendPipelineEntry() to lib/google-sheets.ts**

Append these functions after the existing exports:

```typescript
export async function getJobs(): Promise<JobPosting[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A2:Y`,
  })
  if (!res.data.values) return []
  return res.data.values
    .filter(row => row[0])
    .map(row => rowToJobPosting(row.map(String)))
}

export async function getJobById(
  id: string
): Promise<{ job: JobPosting; row: number } | null> {
  const sheets = getSheets()
  const idsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A:A`,
  })
  if (!idsRes.data.values) return null
  let rowNumber = -1
  for (let i = 1; i < idsRes.data.values.length; i++) {
    if (idsRes.data.values[i][0] === id) { rowNumber = i + 1; break }
  }
  if (rowNumber === -1) return null
  const rowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A${rowNumber}:Y${rowNumber}`,
  })
  if (!rowRes.data.values?.[0]) return null
  return { job: rowToJobPosting(rowRes.data.values[0].map(String)), row: rowNumber }
}

export async function getPipelineEntries(): Promise<PipelineEntry[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.PIPELINE}'!A2:K`,
  })
  if (!res.data.values) return []
  return res.data.values
    .filter(row => row[0])
    .map(row => rowToPipelineEntry(row.map(String)))
}

export async function appendPipelineEntry(job: JobPosting): Promise<void> {
  const sheets = getSheets()
  const salaryLabel =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
      : ''
  const today = new Date().toISOString().split('T')[0]
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.PIPELINE}'!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        job.id, job.company, job.title, 'To Apply',
        '', today, '', '', '', salaryLabel, '',
      ]],
    },
  })
}
```

- [ ] **Step 5: Update appendJobs() to include new columns**

In the existing `appendJobs` function, change the `rows` mapping to add 3 new fields after `j.notes`:

```typescript
const rows = jobs.map((j) => [
  j.id, j.dateFound, j.company, j.title, j.location,
  j.salaryMin ?? '', j.salaryMax ?? '', j.url, j.source,
  j.closingDate ?? '', j.matchScore, j.requirementsMatch, j.status,
  (j.description || '').slice(0, 500), j.yearsExperience,
  j.educationRequired, j.certificationsRequired, j.skillsToolsRequired,
  j.managementRequired, j.securityClearance, j.languages, j.notes,
  j.isRepost ? 'TRUE' : 'FALSE',
  j.originalJobId ?? '',
  j.repostChanges?.length ? JSON.stringify(j.repostChanges) : '',
])
```

- [ ] **Step 6: Run tests**

```bash
npm test -- lib/__tests__/google-sheets-mapping.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/google-sheets.ts lib/__tests__/google-sheets-mapping.test.ts
git commit -m "feat: add getJobs, getJobById, getPipelineEntries, appendPipelineEntry to Sheets layer"
```

---

## Task 4: API routes

**Files:**
- Create: `app/api/jobs/route.ts`
- Create: `app/api/jobs/[id]/route.ts`
- Create: `app/api/pipeline/route.ts`

> **NOTE:** Check `node_modules/next/dist/docs/` for the exact signature of route handler `params` in Next.js 16. In Next.js 15+, `params` may be `Promise<{ id: string }>` requiring `await params`.

- [ ] **Step 1: Create GET /api/jobs**

```typescript
// app/api/jobs/route.ts
import { NextResponse } from 'next/server'
import { getJobs } from '../../../lib/google-sheets'

export async function GET() {
  try {
    const jobs = await getJobs()
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('GET /api/jobs error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load jobs' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Create PATCH /api/jobs/[id]**

```typescript
// app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server'
import { getJobById, updateJobStatus, appendPipelineEntry } from '../../../../lib/google-sheets'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15/16: params is a Promise — await it
    // If running Next.js 14, change to: const { id } = context.params
    const { id } = await context.params
    const body = await request.json()
    const { status } = body as { status: string }

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const result = await getJobById(id)
    if (!result) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await updateJobStatus(result.row, status)

    if (status === 'Interested') {
      await appendPipelineEntry(result.job)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/jobs/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Create GET /api/pipeline**

```typescript
// app/api/pipeline/route.ts
import { NextResponse } from 'next/server'
import { getPipelineEntries } from '../../../lib/google-sheets'

export async function GET() {
  try {
    const entries = await getPipelineEntries()
    return NextResponse.json(entries)
  } catch (error) {
    console.error('GET /api/pipeline error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load pipeline' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/jobs/route.ts "app/api/jobs/[id]/route.ts" app/api/pipeline/route.ts
git commit -m "feat: add GET /api/jobs, PATCH /api/jobs/[id], GET /api/pipeline routes"
```

---

## Task 5: Global styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css with dark theme tokens and resets**

```css
/* app/globals.css */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-base: #0a0a0a;
  --bg-card: #1a1a2e;
  --bg-card-active: #1e2a3a;
  --bg-card-skipped: #111111;
  --bg-elevated: #161625;
  --bg-input: #1a1a2e;

  --border: #1f2937;
  --border-active: #2d3748;

  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --green: #4ade80;
  --green-bg: #14532d;
  --amber: #f59e0b;
  --amber-bg: #78350f;
  --blue: #60a5fa;
  --blue-bg: #1e3a8a;
  --red: #ef4444;
  --red-bg: #7f1d1d;
  --orange: #f97316;

  --match-strong: #4ade80;
  --match-partial: #facc15;
  --match-stretch: #f97316;
  --match-unknown: #64748b;

  --radius-sm: 4px;
  --radius: 6px;
  --radius-lg: 8px;

  --font-sans: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
}

html, body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; font: inherit; border: none; background: none; }
input, select { font: inherit; }

/* Focus visible — keyboard navigation */
:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add dark theme CSS custom properties"
```

---

## Task 6: UI primitives

**Files:**
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Skeleton.tsx`
- Create: `components/ui/EmptyState.tsx`

- [ ] **Step 1: Write component tests**

Create `components/ui/__tests__/primitives.test.tsx`:

```typescript
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

describe('EmptyState', () => {
  it('renders message and optional action', () => {
    const onAction = vi.fn()
    render(<EmptyState message="No jobs found" actionLabel="Show all" onAction={onAction} />)
    expect(screen.getByText('No jobs found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show all' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/ui/__tests__/primitives.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create Badge**

```typescript
// components/ui/Badge.tsx
type BadgeVariant = 'default' | 'green' | 'amber' | 'red' | 'blue' | 'orange'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#1f2937', color: 'var(--text-secondary)' },
  green:   { background: 'var(--green-bg)', color: 'var(--green)' },
  amber:   { background: 'var(--amber-bg)', color: 'var(--amber)' },
  red:     { background: 'var(--red-bg)', color: '#fca5a5' },
  blue:    { background: 'var(--blue-bg)', color: 'var(--blue)' },
  orange:  { background: '#7c2d12', color: 'var(--orange)' },
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...VARIANT_STYLES[variant],
      }}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Create Button**

```typescript
// components/ui/Button.tsx
type ButtonVariant = 'primary' | 'danger' | 'ghost'

interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  'aria-label'?: string
  type?: 'button' | 'submit'
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--green-bg)', color: 'var(--green)', border: 'none' },
  danger:  { background: 'var(--red-bg)', color: '#fca5a5', border: 'none' },
  ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
}

export function Button({
  children, variant = 'primary', onClick, disabled, loading,
  'aria-label': ariaLabel, type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 'var(--radius)',
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'opacity 0.15s',
        ...VARIANT_STYLES[variant],
      }}
    >
      {loading ? (
        <span
          style={{
            width: 12, height: 12,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
}
```

Add spin keyframe to `app/globals.css`:
```css
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 5: Create Skeleton**

```typescript
// components/ui/Skeleton.tsx
interface SkeletonProps {
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-active) 50%, var(--bg-card) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 'var(--radius-sm)',
        ...style,
      }}
    />
  )
}
```

Add shimmer keyframe to `app/globals.css`:
```css
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
```

- [ ] **Step 6: Create EmptyState**

```typescript
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '40px 20px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 14 }}>{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            fontSize: 13,
            color: 'var(--blue)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run tests**

```bash
npm test -- components/ui/__tests__/primitives.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add components/ui/ app/globals.css
git commit -m "feat: add Badge, Button, Skeleton, EmptyState UI primitives"
```

---

## Task 7: NavBar

**Files:**
- Create: `components/ui/NavBar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create NavBar**

```typescript
// components/ui/NavBar.tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'

export function NavBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = searchParams.get('view') ?? 'feed'

  function switchView(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', next)
    params.delete('job')
    router.replace(`/?${params.toString()}`)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? 'var(--bg-card-active)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    border: 'none',
    transition: 'background 0.15s, color 0.15s',
  })

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-base)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
        Job Pipeline
      </span>
      <div role="tablist" style={{ display: 'flex', gap: 4 }}>
        <button
          role="tab"
          aria-selected={view === 'feed'}
          onClick={() => switchView('feed')}
          style={tabStyle(view === 'feed')}
        >
          Feed
        </button>
        <button
          role="tab"
          aria-selected={view === 'pipeline'}
          onClick={() => switchView('pipeline')}
          style={tabStyle(view === 'pipeline')}
        >
          My Pipeline
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update app/layout.tsx**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { NavBar } from '../components/ui/NavBar'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Job Pipeline',
  description: 'Automated job search pipeline for senior procurement roles in Canada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Suspense fallback={<div style={{ height: 49, borderBottom: '1px solid var(--border)' }} />}>
          <NavBar />
        </Suspense>
        <main style={{ flex: 1, overflow: 'hidden' }}>{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/NavBar.tsx app/layout.tsx
git commit -m "feat: add NavBar with Feed/Pipeline tab switching"
```

---

## Task 8: SWR hooks

**Files:**
- Create: `hooks/useJobs.ts`
- Create: `hooks/useJobActions.ts`
- Create: `hooks/usePipeline.ts`

- [ ] **Step 1: Install SWR**

```bash
npm install swr
```

- [ ] **Step 2: Write tests for filter logic**

Create `hooks/__tests__/useJobs-filter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { filterJobs, countByStatus } from '../useJobs'
import type { JobPosting } from '../../lib/types'

function makeJob(overrides: Partial<JobPosting>): JobPosting {
  return {
    id: 'j1', title: 'Director', company: 'BMO', location: 'Toronto',
    url: '', description: '', source: 'workday', dateFound: '2026-05-31',
    matchScore: 85, requirementsMatch: 'Strong', status: 'New',
    yearsExperience: '10+', educationRequired: '', certificationsRequired: '',
    skillsToolsRequired: '', managementRequired: '', securityClearance: '',
    languages: '', notes: '', isRepost: false,
    ...overrides,
  }
}

describe('filterJobs', () => {
  const jobs = [
    makeJob({ id: 'j1', status: 'New', company: 'BMO', matchScore: 92 }),
    makeJob({ id: 'j2', status: 'Interested', company: 'RBC', matchScore: 80 }),
    makeJob({ id: 'j3', status: 'Skipped', company: 'BMO', matchScore: 60 }),
    makeJob({ id: 'j4', status: 'New', company: 'Shopify', matchScore: 55 }),
  ]

  it('filter=all returns all', () => {
    expect(filterJobs(jobs, { filter: 'all', company: null, minScore: null })).toHaveLength(4)
  })

  it('filter=new returns only New', () => {
    const result = filterJobs(jobs, { filter: 'new', company: null, minScore: null })
    expect(result.every(j => j.status === 'New')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('filter=interested returns only Interested', () => {
    const result = filterJobs(jobs, { filter: 'interested', company: null, minScore: null })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('j2')
  })

  it('company filter narrows by company', () => {
    const result = filterJobs(jobs, { filter: 'all', company: 'BMO', minScore: null })
    expect(result.every(j => j.company === 'BMO')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('minScore filters by score', () => {
    const result = filterJobs(jobs, { filter: 'all', company: null, minScore: 75 })
    expect(result.every(j => j.matchScore >= 75)).toBe(true)
  })
})

describe('countByStatus', () => {
  it('counts correctly', () => {
    const jobs = [
      makeJob({ status: 'New' }),
      makeJob({ status: 'New' }),
      makeJob({ status: 'Interested' }),
      makeJob({ status: 'Skipped' }),
    ]
    const counts = countByStatus(jobs)
    expect(counts).toEqual({ all: 4, new: 2, interested: 1, skipped: 1 })
  })
})
```

- [ ] **Step 3: Run — expect fail**

```bash
npm test -- hooks/__tests__/useJobs-filter.test.ts
```

Expected: FAIL — `filterJobs` and `countByStatus` not found.

- [ ] **Step 4: Create hooks/useJobs.ts**

```typescript
// hooks/useJobs.ts
'use client'
import useSWR from 'swr'
import type { JobPosting, FilterState } from '../lib/types'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch jobs')
    return r.json() as Promise<JobPosting[]>
  })

export function filterJobs(jobs: JobPosting[], filters: FilterState): JobPosting[] {
  return jobs.filter(job => {
    if (filters.filter === 'new' && job.status !== 'New') return false
    if (filters.filter === 'interested' && job.status !== 'Interested') return false
    if (filters.filter === 'skipped' && job.status !== 'Skipped') return false
    if (filters.company && job.company !== filters.company) return false
    if (filters.minScore !== null && job.matchScore < filters.minScore) return false
    return true
  })
}

export function countByStatus(jobs: JobPosting[]) {
  return {
    all: jobs.length,
    new: jobs.filter(j => j.status === 'New').length,
    interested: jobs.filter(j => j.status === 'Interested').length,
    skipped: jobs.filter(j => j.status === 'Skipped').length,
  }
}

export function useJobs(filters: FilterState) {
  const { data, error, isLoading, mutate } = useSWR<JobPosting[]>('/api/jobs', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60_000,
  })

  const jobs = data ?? []
  const filteredJobs = filterJobs(jobs, filters)
  const counts = countByStatus(jobs)
  const companies = [...new Set(jobs.map(j => j.company))].sort()

  return { jobs, filteredJobs, counts, companies, isLoading, error, mutate }
}
```

- [ ] **Step 5: Create hooks/useJobActions.ts**

```typescript
// hooks/useJobActions.ts
'use client'
import { useState } from 'react'
import { mutate } from 'swr'
import type { JobPosting } from '../lib/types'

export function useJobActions() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function updateStatus(job: JobPosting, status: JobPosting['status']) {
    setLoadingId(job.id)
    // Optimistic update
    await mutate(
      '/api/jobs',
      (current: JobPosting[] | undefined) =>
        current?.map(j => j.id === job.id ? { ...j, status } : j) ?? [],
      { revalidate: false }
    )
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch (err) {
      // Rollback on error
      await mutate('/api/jobs')
      throw err
    } finally {
      setLoadingId(null)
      await mutate('/api/jobs')
    }
  }

  return {
    markInterested: (job: JobPosting) => updateStatus(job, 'Interested'),
    markSkipped: (job: JobPosting) => updateStatus(job, 'Skipped'),
    loadingId,
  }
}
```

- [ ] **Step 6: Create hooks/usePipeline.ts**

```typescript
// hooks/usePipeline.ts
'use client'
import useSWR from 'swr'
import type { PipelineEntry } from '../lib/types'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch pipeline')
    return r.json() as Promise<PipelineEntry[]>
  })

export function usePipeline() {
  const { data, error, isLoading } = useSWR<PipelineEntry[]>('/api/pipeline', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60_000,
  })
  return { entries: data ?? [], isLoading, error }
}
```

- [ ] **Step 7: Run tests**

```bash
npm test -- hooks/__tests__/useJobs-filter.test.ts
```

Expected: PASS (5 tests in `filterJobs`, 1 in `countByStatus`).

- [ ] **Step 8: Commit**

```bash
git add hooks/ package.json package-lock.json
git commit -m "feat: add useJobs, useJobActions, usePipeline SWR hooks"
```

---

## Task 9: MatchBadge + RepostBadge

**Files:**
- Create: `components/jobs/MatchBadge.tsx`
- Create: `components/jobs/RepostBadge.tsx`

- [ ] **Step 1: Write tests**

Create `components/jobs/__tests__/badges.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MatchBadge } from '../MatchBadge'
import { RepostBadge } from '../RepostBadge'

describe('MatchBadge', () => {
  it('renders Strong with green', () => {
    render(<MatchBadge score={92} match="Strong" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
    expect(screen.getByText(/92/)).toBeInTheDocument()
  })

  it('renders Unknown', () => {
    render(<MatchBadge score={0} match="Unknown" />)
    expect(screen.getByText(/unknown/i)).toBeInTheDocument()
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
    expect(screen.getByText(/repost/i)).toBeInTheDocument()
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
  })
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/jobs/__tests__/badges.test.tsx
```

- [ ] **Step 3: Create MatchBadge**

```typescript
// components/jobs/MatchBadge.tsx
import type { JobPosting } from '../../lib/types'

interface MatchBadgeProps {
  score: number
  match: JobPosting['requirementsMatch']
}

const MATCH_COLORS: Record<JobPosting['requirementsMatch'], string> = {
  Strong:  'var(--match-strong)',
  Partial: 'var(--match-partial)',
  Stretch: 'var(--match-stretch)',
  Unknown: 'var(--match-unknown)',
}

export function MatchBadge({ score, match }: MatchBadgeProps) {
  const color = MATCH_COLORS[match]
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color, lineHeight: 1 }}>
        {score > 0 ? score : '—'}
      </span>
      <span style={{ fontSize: 10, color, lineHeight: 1 }}>
        {match}
      </span>
    </span>
  )
}
```

- [ ] **Step 4: Create RepostBadge**

```typescript
// components/jobs/RepostBadge.tsx
import type { RepostChange } from '../../lib/types'

interface RepostBadgeProps {
  originalDateFound: string
  changes: RepostChange[]
  expanded?: boolean
}

function weeksAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const weeks = Math.round(diff / (7 * 24 * 60 * 60 * 1000))
  return weeks <= 1 ? '1 week ago' : `${weeks} weeks ago`
}

const FIELD_LABELS: Record<RepostChange['field'], string> = {
  salary: 'Salary',
  location: 'Location',
  title: 'Title',
  workArrangement: 'Work arrangement',
}

export function RepostBadge({ originalDateFound, changes, expanded = false }: RepostBadgeProps) {
  if (!expanded) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: '1px 6px',
          borderRadius: 9999,
          fontSize: 10,
          fontWeight: 600,
          background: 'var(--amber-bg)',
          color: 'var(--amber)',
        }}
        aria-label="This is a repost"
      >
        ⟳ repost
      </span>
    )
  }

  return (
    <div
      style={{
        background: '#1a1208',
        border: '1px solid var(--amber-bg)',
        borderRadius: 'var(--radius)',
        padding: '10px 12px',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 6 }}>
        ⟳ Repost · Originally posted {weeksAgo(originalDateFound)}
      </p>
      {changes.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            What changed:
          </p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {changes.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <dt style={{ color: 'var(--text-muted)', minWidth: 100 }}>
                  {FIELD_LABELS[c.field] ?? c.field}
                </dt>
                <dd style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{c.from}</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ color: 'var(--green)' }}>{c.to}</span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- components/jobs/__tests__/badges.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add components/jobs/MatchBadge.tsx components/jobs/RepostBadge.tsx components/jobs/__tests__/badges.test.tsx
git commit -m "feat: add MatchBadge and RepostBadge components"
```

---

## Task 10: InterestActions

**Files:**
- Create: `components/jobs/InterestActions.tsx`

- [ ] **Step 1: Write tests**

Create `components/jobs/__tests__/InterestActions.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/jobs/__tests__/InterestActions.test.tsx
```

- [ ] **Step 3: Create InterestActions**

```typescript
// components/jobs/InterestActions.tsx
import type { JobPosting } from '../../lib/types'
import { Button } from '../ui/Button'

interface InterestActionsProps {
  jobId: string
  currentStatus: JobPosting['status']
  url: string
  onAction: (action: 'interested' | 'skipped') => void
  loading?: boolean
}

export function InterestActions({
  currentStatus, url, onAction, loading,
}: InterestActionsProps) {
  const isInterested = currentStatus === 'Interested'
  const isSkipped = currentStatus === 'Skipped'

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button
        variant="primary"
        onClick={() => onAction('interested')}
        disabled={loading}
        loading={loading && !isInterested}
        aria-label="Mark as interested"
        aria-pressed={isInterested}
      >
        {isInterested ? 'Interested ✓' : 'Interested'}
      </Button>

      <Button
        variant="danger"
        onClick={() => onAction('skipped')}
        disabled={loading}
        loading={loading && !isSkipped}
        aria-label="Skip this job"
        aria-pressed={isSkipped}
      >
        {isSkipped ? 'Skipped ✓' : 'Skip'}
      </Button>

      <Button
        variant="ghost"
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        aria-label="Open job description (opens in new tab)"
      >
        Open JD ↗
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- components/jobs/__tests__/InterestActions.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/jobs/InterestActions.tsx components/jobs/__tests__/InterestActions.test.tsx
git commit -m "feat: add InterestActions component"
```

---

## Task 11: FilterBar

**Files:**
- Create: `components/jobs/FilterBar.tsx`

- [ ] **Step 1: Write tests**

Create `components/jobs/__tests__/FilterBar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FilterBar } from '../FilterBar'
import type { FilterState } from '../../lib/types'

const defaultFilter: FilterState = { filter: 'all', company: null, minScore: null }
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
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/jobs/__tests__/FilterBar.test.tsx
```

- [ ] **Step 3: Create FilterBar**

```typescript
// components/jobs/FilterBar.tsx
import type { FilterState } from '../../lib/types'

interface FilterBarProps {
  activeFilter: FilterState['filter']
  activeCompany: string | null
  minScore: number | null
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
```

- [ ] **Step 4: Run tests**

```bash
npm test -- components/jobs/__tests__/FilterBar.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/jobs/FilterBar.tsx components/jobs/__tests__/FilterBar.test.tsx
git commit -m "feat: add FilterBar component"
```

---

## Task 12: JobCard

**Files:**
- Create: `components/jobs/JobCard.tsx`

- [ ] **Step 1: Write tests**

Create `components/jobs/__tests__/JobCard.test.tsx`:

```typescript
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
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/jobs/__tests__/JobCard.test.tsx
```

- [ ] **Step 3: Create JobCard**

```typescript
// components/jobs/JobCard.tsx
import type { JobPosting } from '../../lib/types'
import { MatchBadge } from './MatchBadge'
import { RepostBadge } from './RepostBadge'

interface JobCardProps {
  job: JobPosting
  isSelected: boolean
  onClick: () => void
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary not listed'
  if (min && max) return `$${(min / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k`
  if (min) return `$${(min / 1000).toFixed(0)}k+`
  return ''
}

const STATUS_INDICATORS: Partial<Record<JobPosting['status'], string>> = {
  Interested: '●',
  Skipped: '●',
  'Added to Pipeline': '●',
}

const STATUS_COLORS: Partial<Record<JobPosting['status'], string>> = {
  Interested: 'var(--green)',
  Skipped: 'var(--text-muted)',
  'Added to Pipeline': 'var(--blue)',
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const salaryText = formatSalary(job.salaryMin, job.salaryMax)
  const hasSalary = !!(job.salaryMin || job.salaryMax)
  const indicator = STATUS_INDICATORS[job.status]

  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${job.title} at ${job.company}`}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 12px',
        borderLeft: `3px solid ${isSelected ? 'var(--blue)' : job.status === 'Skipped' ? 'var(--border)' : 'var(--bg-card-active)'}`,
        background: isSelected
          ? 'var(--bg-card-active)'
          : job.status === 'Skipped'
            ? 'var(--bg-card-skipped)'
            : 'var(--bg-card)',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        opacity: job.status === 'Skipped' ? 0.5 : 1,
        transition: 'background 0.1s, opacity 0.1s',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {job.title}
        </span>
        <MatchBadge score={job.matchScore} match={job.requirementsMatch} />
      </div>

      {/* Metadata row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{job.company}</span>

        {job.location && (
          <>
            <span style={{ color: 'var(--border-active)', fontSize: 10 }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.location}</span>
          </>
        )}

        <span style={{ color: 'var(--border-active)', fontSize: 10 }}>·</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: hasSalary ? 'var(--green)' : 'var(--amber)',
          }}
        >
          {salaryText}
        </span>

        {job.isRepost && job.originalJobId && (
          <>
            <span style={{ color: 'var(--border-active)', fontSize: 10 }}>·</span>
            <RepostBadge
              originalDateFound={job.dateFound}
              changes={job.repostChanges ?? []}
              expanded={false}
            />
          </>
        )}

        {indicator && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 8,
              color: STATUS_COLORS[job.status],
            }}
          >
            {indicator}
          </span>
        )}
      </div>
    </button>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- components/jobs/__tests__/JobCard.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/jobs/JobCard.tsx components/jobs/__tests__/JobCard.test.tsx
git commit -m "feat: add JobCard with inline salary, match badge, repost indicator"
```

---

## Task 13: JobDetail

**Files:**
- Create: `components/jobs/JobDetail.tsx`

- [ ] **Step 1: Write tests**

Create `components/jobs/__tests__/JobDetail.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { JobDetail } from '../JobDetail'
import type { JobPosting } from '../../lib/types'

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
  it('renders title and company', () => {
    render(<JobDetail job={job} onInterest={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Director, Procurement' })).toBeInTheDocument()
    expect(screen.getByText(/BMO Financial/)).toBeInTheDocument()
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

  it('hides Open JD button when posting is closed', () => {
    render(<JobDetail job={{ ...job, status: 'Dismissed' }} onInterest={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /open job description/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/jobs/__tests__/JobDetail.test.tsx
```

- [ ] **Step 3: Create JobDetail**

```typescript
// components/jobs/JobDetail.tsx
import type { JobPosting } from '../../lib/types'
import { RepostBadge } from './RepostBadge'
import { InterestActions } from './InterestActions'
import { MatchBadge } from './MatchBadge'

interface JobDetailProps {
  job: JobPosting
  onInterest: (id: string, action: 'interested' | 'skipped') => void
  onClose: () => void
  loading?: boolean
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary not listed'
  if (min && max) return `$${(min / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k`
  if (min) return `$${(min / 1000).toFixed(0)}k+`
  return ''
}

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

const META_FIELDS: { key: keyof JobPosting; label: string }[] = [
  { key: 'yearsExperience', label: 'Experience' },
  { key: 'educationRequired', label: 'Education' },
  { key: 'certificationsRequired', label: 'Certifications' },
  { key: 'skillsToolsRequired', label: 'Tools' },
  { key: 'managementRequired', label: 'Management' },
  { key: 'securityClearance', label: 'Security' },
  { key: 'languages', label: 'Languages' },
]

export function JobDetail({ job, onInterest, onClose, loading }: JobDetailProps) {
  const hasSalary = !!(job.salaryMin || job.salaryMax)
  const isClosed = job.status === 'Dismissed'

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '20px',
        gap: 16,
      }}
      aria-label={`${job.title} at ${job.company}`}
    >
      {/* Mobile back button */}
      <button
        onClick={onClose}
        aria-label="Back to job list"
        style={{
          display: 'none',
          alignItems: 'center',
          gap: 6,
          color: 'var(--blue)',
          fontSize: 13,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: 4,
        }}
        className="job-detail-back"
      >
        ← Back
      </button>

      {/* Header */}
      <div>
        <h1
          style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}
          tabIndex={-1}
        >
          {job.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{job.company}</span>
          {job.location && (
            <>
              <span style={{ color: 'var(--border-active)' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{job.location}</span>
            </>
          )}
          <span style={{ color: 'var(--border-active)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Found {daysAgo(job.dateFound)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: hasSalary ? 'var(--green)' : 'var(--amber)',
            }}
          >
            {formatSalary(job.salaryMin, job.salaryMax)}
          </span>
          <MatchBadge score={job.matchScore} match={job.requirementsMatch} />
          {isClosed && (
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'var(--red-bg)',
                color: '#fca5a5',
              }}
            >
              Posting closed
            </span>
          )}
        </div>
      </div>

      {/* Repost diff */}
      {job.isRepost && (
        <RepostBadge
          originalDateFound={job.dateFound}
          changes={job.repostChanges ?? []}
          expanded
        />
      )}

      {/* Interest actions */}
      {!isClosed && (
        <InterestActions
          jobId={job.id}
          currentStatus={job.status}
          url={job.url}
          onAction={action => onInterest(job.id, action)}
          loading={loading}
        />
      )}

      {/* Requirements metadata */}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '6px 16px',
          fontSize: 12,
        }}
      >
        {META_FIELDS.map(({ key, label }) => {
          const value = job[key] as string
          if (!value) return null
          return (
            <div key={key} style={{ display: 'contents' }}>
              <dt style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</dt>
              <dd style={{ color: 'var(--text-secondary)' }}>{value}</dd>
            </div>
          )
        })}
      </dl>

      {/* Description */}
      {job.description && (
        <section>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Description
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {job.description}
          </p>
        </section>
      )}

      {job.closingDate && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Closes: {job.closingDate}
        </p>
      )}
    </article>
  )
}
```

Add to `app/globals.css`:
```css
/* Show back button only on mobile */
@media (max-width: 767px) {
  .job-detail-back { display: flex !important; }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- components/jobs/__tests__/JobDetail.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/jobs/JobDetail.tsx components/jobs/__tests__/JobDetail.test.tsx app/globals.css
git commit -m "feat: add JobDetail with repost diff, requirements, interest actions"
```

---

## Task 14: JobList + JobFeedView

**Files:**
- Create: `components/jobs/JobList.tsx`
- Create: `components/jobs/JobFeedView.tsx`

- [ ] **Step 1: Create JobList**

```typescript
// components/jobs/JobList.tsx
import type { JobPosting } from '../../lib/types'
import { JobCard } from './JobCard'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

interface JobListProps {
  jobs: JobPosting[]
  selectedId: string | null
  isLoading: boolean
  onSelect: (job: JobPosting) => void
  onShowAll: () => void
}

export function JobList({ jobs, selectedId, isLoading, onSelect, onShowAll }: JobListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
            <Skeleton height={14} style={{ marginBottom: 6, width: '65%' }} />
            <Skeleton height={11} style={{ width: '45%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        message="No jobs match this filter"
        actionLabel="Show all"
        onAction={onShowAll}
      />
    )
  }

  return (
    <div
      role="list"
      aria-label="Job listings"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {jobs.map(job => (
        <div key={job.id} role="listitem">
          <JobCard
            job={job}
            isSelected={job.id === selectedId}
            onClick={() => onSelect(job)}
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create JobFeedView**

```typescript
// components/jobs/JobFeedView.tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import type { FilterState, JobPosting } from '../../lib/types'
import { useJobs } from '../../hooks/useJobs'
import { useJobActions } from '../../hooks/useJobActions'
import { FilterBar } from './FilterBar'
import { JobList } from './JobList'
import { JobDetail } from './JobDetail'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

export function JobFeedView() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeFilter = (searchParams.get('filter') ?? 'all') as FilterState['filter']
  const activeCompany = searchParams.get('company')
  const selectedId = searchParams.get('job')

  const filters: FilterState = {
    filter: activeFilter,
    company: activeCompany,
    minScore: null,
  }

  const { filteredJobs, counts, companies, isLoading, error } = useJobs(filters)
  const { markInterested, markSkipped, loadingId } = useJobActions()

  const selectedJob = filteredJobs.find(j => j.id === selectedId) ?? null

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  function handleFilterChange(f: FilterState) {
    updateParams({
      filter: f.filter === 'all' ? null : f.filter,
      company: f.company,
      job: null,
    })
  }

  function handleSelect(job: JobPosting) {
    updateParams({ job: job.id })
  }

  function handleClose() {
    updateParams({ job: null })
  }

  async function handleInterest(id: string, action: 'interested' | 'skipped') {
    const job = filteredJobs.find(j => j.id === id)
    if (!job) return
    if (action === 'interested') await markInterested(job)
    else await markSkipped(job)
  }

  // Keyboard navigation
  // NOTE: include searchParams and router in deps to avoid stale closure when URL changes
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

    if (e.key === 'Escape') { handleClose(); return }

    const currentIdx = filteredJobs.findIndex(j => j.id === selectedId)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = filteredJobs[currentIdx + 1]
      if (next) updateParams({ job: next.id })
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = filteredJobs[currentIdx - 1]
      if (prev) updateParams({ job: prev.id })
    }
    if (e.key === 'i' && selectedJob) {
      handleInterest(selectedJob.id, 'interested')
    }
    if (e.key === 's' && selectedJob) {
      handleInterest(selectedJob.id, 'skipped')
    }
  }, [filteredJobs, selectedId, selectedJob, searchParams, router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (error) {
    return (
      <EmptyState
        message="Failed to load jobs. Check your Google Sheets connection."
        actionLabel="Retry"
        onAction={() => router.refresh()}
      />
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* List panel — hidden on mobile when a job is selected */}
      <div
        style={{
          width: '38%',
          minWidth: 280,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        className={selectedId ? 'job-list-panel--has-selection' : ''}
      >
        <FilterBar
          activeFilter={activeFilter}
          activeCompany={activeCompany}
          minScore={null}
          counts={counts}
          companies={companies}
          onChange={handleFilterChange}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <JobList
            jobs={filteredJobs}
            selectedId={selectedId}
            isLoading={isLoading}
            onSelect={handleSelect}
            onShowAll={() => handleFilterChange({ filter: 'all', company: null, minScore: null })}
          />
        </div>
      </div>

      {/* Detail panel */}
      <div
        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        className="job-detail-panel"
      >
        {selectedJob ? (
          <JobDetail
            job={selectedJob}
            onInterest={handleInterest}
            onClose={handleClose}
            loading={loadingId === selectedJob.id}
          />
        ) : (
          <EmptyState message="Select a job to read details" />
        )}
      </div>
    </div>
  )
}
```

Add responsive styles to `app/globals.css`:
```css
/* Mobile: hide list when job selected, show detail full-width */
@media (max-width: 767px) {
  .job-list-panel--has-selection { display: none !important; }
  .job-detail-panel { width: 100% !important; }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/jobs/JobList.tsx components/jobs/JobFeedView.tsx app/globals.css
git commit -m "feat: add JobList and JobFeedView with keyboard nav, responsive split"
```

---

## Task 15: Pipeline view

**Files:**
- Create: `components/pipeline/PipelineCard.tsx`
- Create: `components/pipeline/PipelineView.tsx`

- [ ] **Step 1: Write tests**

Create `components/pipeline/__tests__/PipelineCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PipelineCard } from '../PipelineCard'
import type { PipelineEntry } from '../../lib/types'

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
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/pipeline/__tests__/PipelineCard.test.tsx
```

- [ ] **Step 3: Create PipelineCard**

```typescript
// components/pipeline/PipelineCard.tsx
import type { PipelineEntry } from '../../lib/types'

interface PipelineCardProps {
  entry: PipelineEntry
}

const STAGE_COLORS: Record<string, string> = {
  'To Apply': 'var(--blue)',
  'Applied': 'var(--amber)',
  'Interview': 'var(--orange)',
  'Offer': 'var(--green)',
  'Declined': 'var(--text-muted)',
  'Rejected': 'var(--red)',
}

export function PipelineCard({ entry }: PipelineCardProps) {
  const stageColor = STAGE_COLORS[entry.stage] ?? 'var(--text-muted)'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '4px 16px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {entry.title}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
          {entry.company}
        </p>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {entry.lastActivity && <span>Active: {entry.lastActivity}</span>}
          {entry.nextFollowUp && <span>Follow up: {entry.nextFollowUp}</span>}
          {entry.contactName && <span>Contact: {entry.contactName}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: stageColor,
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 8px',
            borderRadius: 9999,
            border: `1px solid ${stageColor}`,
          }}
        >
          {entry.stage}
        </span>
        {entry.salaryOffered && (
          <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
            {entry.salaryOffered}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create PipelineView**

```typescript
// components/pipeline/PipelineView.tsx
'use client'
import { usePipeline } from '../../hooks/usePipeline'
import { PipelineCard } from './PipelineCard'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { useRouter } from 'next/navigation'

export function PipelineView() {
  const { entries, isLoading, error } = usePipeline()
  const router = useRouter()

  if (error) {
    return (
      <EmptyState
        message="Failed to load pipeline"
        actionLabel="Retry"
        onAction={() => router.refresh()}
      />
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <Skeleton height={14} style={{ marginBottom: 6, width: '50%' }} />
            <Skeleton height={11} style={{ width: '30%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        message="No active applications yet — mark jobs as Interested to add them here"
      />
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {entries.length} active application{entries.length !== 1 ? 's' : ''}
        </h2>
      </div>
      <div>
        {entries.map(entry => (
          <PipelineCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- components/pipeline/__tests__/PipelineCard.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add components/pipeline/ 
git commit -m "feat: add PipelineCard and PipelineView"
```

---

## Task 16: Wire up page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx**

```typescript
// app/page.tsx
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { JobFeedView } from '../components/jobs/JobFeedView'
import { PipelineView } from '../components/pipeline/PipelineView'

// Parse view from URL server-side to avoid Suspense flash
async function getView(): Promise<string> {
  // In Next.js 16 App Router, searchParams are available via the page props
  // The actual view switching is client-side via useSearchParams in the components
  return 'feed'
}

interface PageProps {
  searchParams: Promise<{ view?: string; job?: string; filter?: string; company?: string }>
}

export default async function Home({ searchParams }: PageProps) {
  // Next.js 15/16: searchParams is a Promise — await it
  // If on Next.js 14, change to: const { view } = searchParams
  const params = await searchParams
  const view = params.view ?? 'feed'

  return (
    <div style={{ height: 'calc(100vh - 49px)', overflow: 'hidden' }}>
      <Suspense
        fallback={
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '50vh', color: 'var(--text-muted)', fontSize: 13,
          }}>
            Loading...
          </div>
        }
      >
        {view === 'pipeline' ? <PipelineView /> : <JobFeedView />}
      </Suspense>
    </div>
  )
}
```

> **NOTE:** If the app displays a hydration error about `searchParams` being a Promise, check `node_modules/next/dist/docs/` for the correct approach for Next.js 16. The `await searchParams` pattern is for Next.js 15+; for Next.js 14 use `searchParams` directly without `await`.

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```

Expected: All tests pass. Note any failures and fix before proceeding.

- [ ] **Step 3: Start the dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:3000` in a browser and verify:
- [ ] Dark background renders, NavBar shows "Feed" and "My Pipeline" tabs
- [ ] Feed tab: FilterBar shows "All / New / Interested / Skipped" tabs
- [ ] Job list shows skeleton rows while loading (or error state if Sheets not configured)
- [ ] Clicking a job selects it and shows detail in the right panel
- [ ] On a narrow window (< 768px), the list hides when a job is selected
- [ ] Keyboard: `↑↓` navigates list, `i` marks interested, `s` skips, `Esc` closes detail
- [ ] "My Pipeline" tab shows pipeline or empty state
- [ ] Salary visible in every job card row

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire up page.tsx with JobFeedView and PipelineView"
```

- [ ] **Step 5: Push to remote**

```bash
git push origin main
```

---

## Post-Implementation Checklist

- [ ] All `npm test` passes
- [ ] NavBar tab switching works in browser
- [ ] Feed loads jobs (or shows correct error/empty state if Sheets not configured)
- [ ] Interest actions optimistically update the UI
- [ ] Interested jobs appear in My Pipeline
- [ ] Repost badge shows in list, expanded diff shows in detail
- [ ] Salary visible in all job cards (amber "Salary not listed" when absent)
- [ ] Mobile: selecting a job hides the list and shows full-page detail
- [ ] Keyboard shortcuts work (↑↓, i, s, Esc)
- [ ] `npm run build` completes without errors
