# Job Pipeline UI — Design Spec
**Date:** 2026-05-31
**Status:** Approved

---

## Overview

A production-ready, accessible, responsive UI for a personal automated job search pipeline. Targets senior procurement roles across 28 Canadian companies. The UI surfaces daily scraped jobs, lets the user triage interest, detects reposts with a change diff, and tracks active applications in a pipeline view.

**Stack:** Next.js 16 App Router · React 19 · SWR · Google Sheets (source of truth) · No component library (custom `ui/` primitives)

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Layout | List + Detail (split panel) | Desktop: side-by-side. Mobile: full-page push on tap. |
| Mobile detail | Full-page push (`?job=id`) | Simplest, accessible, back-button native, shareable URL |
| Interest model | Flag in place + promote to Pipeline | Stays in feed with indicator; also appears in Pipeline view |
| Repost display | Badge + inline diff | Shows what changed (salary, location, title) without leaving the list |
| Salary placement | Inline metadata row | Compact: Company · City · Salary · Score on one line under title |
| Data layer | Sheets-first + SWR | No extra infrastructure; SWR caches client-side after first fetch |
| State management | URL search params | No React context; `?view=`, `?job=`, `?filter=`, `?company=` |
| Architecture | Feature-based components | `components/jobs/`, `components/pipeline/`, `components/ui/` |

---

## File Structure

```
app/
├── page.tsx                     # Renders JobFeedView or PipelineView via ?view=
├── layout.tsx                   # NavBar wrapper
│
components/
├── jobs/
│   ├── JobFeedView.tsx          # List + detail split; collapses to list-only on mobile
│   ├── JobList.tsx              # Scrollable list, receives filtered JobPosting[]
│   ├── JobCard.tsx              # Row: title, inline meta (company·city·salary·score), badges
│   ├── JobDetail.tsx            # Right panel desktop / full page mobile
│   ├── FilterBar.tsx            # All·New·Interested·Skipped tabs + Company/Score filters
│   ├── InterestActions.tsx      # Interested / Skip / Open JD — reusable
│   ├── RepostBadge.tsx          # Compact chip in list; expanded diff in detail
│   └── MatchBadge.tsx           # Strong / Partial / Stretch / Unknown chip
├── pipeline/
│   ├── PipelineView.tsx         # My Pipeline list
│   └── PipelineCard.tsx         # Stage, dates, contact, salary offered
└── ui/
    ├── Badge.tsx                # Generic status/label chip
    ├── Button.tsx               # Primary / ghost / destructive variants
    ├── Skeleton.tsx             # Loading placeholders
    ├── EmptyState.tsx           # Zero-results and error surfaces
    └── NavBar.tsx               # Feed / Pipeline tab switcher

hooks/
├── useJobs.ts                   # SWR → GET /api/jobs; exposes filtered/sorted slice
├── useJobActions.ts             # PATCH /api/jobs/[id]; optimistic updates
└── usePipeline.ts               # SWR → GET /api/pipeline

app/api/
├── jobs/route.ts                # GET: read Jobs Feed sheet → JobPosting[]
├── jobs/[id]/route.ts           # PATCH: update status; if status → Interested, appends to Pipeline sheet server-side
└── pipeline/route.ts            # GET: read Pipeline sheet → PipelineEntry[]

# PipelineEntry (add to lib/types.ts):
# { id, company, title, stage, dateApplied, lastActivity, nextFollowUp,
#   contactName, contactEmail, salaryOffered, notes }
```

---

## Props Design

### `JobCard`
```ts
interface JobCardProps {
  job: JobPosting
  isSelected: boolean
  onClick: () => void
}
```
Renders title, inline metadata row (Company · City · Salary · Score), `MatchBadge`, and compact `RepostBadge` if `job.isRepost`. Is a `<button>` with `aria-pressed={isSelected}`.

### `JobDetail`
```ts
interface JobDetailProps {
  job: JobPosting
  onInterest: (id: string, action: 'interested' | 'skipped') => void
  onClose: () => void   // mobile back / Esc
}
```
Full job description, expanded `RepostBadge` diff, `InterestActions`. On mobile renders as a full page; on desktop renders in the right panel.

### `RepostBadge`
```ts
interface RepostBadgeProps {
  originalDateFound: string
  changes: { field: string; from: string; to: string }[]
  expanded?: boolean    // false = compact chip; true = full diff
}
```
Compact mode: amber pill "⟳ repost" in the `JobCard`. Expanded mode: shows `<dl>` diff of changed fields in `JobDetail`. If `changes` is empty, shows "Repost · originally posted Xw ago" with no diff section.

### `InterestActions`
```ts
interface InterestActionsProps {
  jobId: string
  currentStatus: JobPosting['status']
  url: string
  onAction: (action: 'interested' | 'skipped') => void
  loading?: boolean
}
```
Renders Interested / Skip / Open JD buttons. Disables and shows spinner during mutation. Button labels update to reflect current status ("Marked Interested ✓" / "Undo").

### `FilterBar`
```ts
interface FilterBarProps {
  activeFilter: 'all' | 'new' | 'interested' | 'skipped'
  activeCompany: string | null
  minScore: number | null
  counts: { all: number; new: number; interested: number; skipped: number }
  onChange: (filters: FilterState) => void
}
```
Tab strip with counts. Company and score dropdowns. Filter state is reflected in URL params.

```ts
interface FilterState {
  filter: 'all' | 'new' | 'interested' | 'skipped'
  company: string | null
  minScore: number | null
}
```

---

## Schema Changes

### `JobPosting` type additions
Three new optional fields appended to the existing type (additive — no existing data breaks):

```ts
isRepost: boolean                   // default false
originalJobId?: string
repostChanges?: {
  field: 'salary' | 'location' | 'title' | 'workArrangement'
  from: string
  to: string
}[]

// Status extended with two new values:
status: 'New' | 'Reviewed' | 'Interested' | 'Skipped' | 'Added to Pipeline' | 'Dismissed'
```

### New Sheets columns (Jobs Feed, columns W–Y)
- **W — Is Repost:** `TRUE` / `FALSE`
- **X — Original Job ID:** string (ID of the earlier posting)
- **Y — Repost Changes:** JSON string, e.g. `[{"field":"salary","from":"$180k","to":"$195k"}]`

Existing rows have these columns empty; the API treats empty as `false` / `[]`.

### Repost detection logic (in scraper)
Match = same company + normalised title (lowercase, punctuation stripped) within 90 days, OR same URL with a new `dateFound`. On match, scraper diffs salary, location, title, and work arrangement keywords against the original row and writes `repostChanges`.

---

## Data Flow

```
Google Sheets "Jobs Feed"
        │
        ▼
GET /api/jobs  (server → Sheets API → map rows → JobPosting[])
        │
        ▼
useJobs()  (SWR, 60s revalidate)
        │
   client-side filter/sort
        │
        ▼
JobList → JobCard (×n)
        │  (click / ?job=id)
        ▼
JobDetail
        │  (Interested / Skip)
        ▼
useJobActions() → PATCH /api/jobs/[id]
  ├── optimistic update in SWR cache (client)
  ├── server: write Status to Sheets col M
  ├── server: if status → Interested, append row to "Pipeline" sheet (no separate client call)
  └── mutate() to revalidate on settle
```

---

## URL State

| Param | Values | Effect |
|---|---|---|
| `?view=` | `feed` (default) · `pipeline` | Switches between JobFeedView and PipelineView |
| `?job=` | job ID string | Opens that job in detail panel / full page on mobile |
| `?filter=` | `all` · `new` · `interested` · `skipped` | Filters job list |
| `?company=` | company name string | Filters to single company |

All params are read via `useSearchParams()` and written via `router.replace()` — no full navigation, no scroll reset.

---

## Loading States

| Surface | Loading treatment |
|---|---|
| `JobList` initial load | 5 `Skeleton` rows matching `JobCard` height |
| `JobDetail` before selection | Placeholder: "Select a job to read details" |
| `JobDetail` during navigation | Skeleton for title/meta/body |
| `InterestActions` during PATCH | Buttons disabled, spinner on active button |
| `PipelineView` initial load | 3 `Skeleton` rows |

---

## Edge Cases

| Case | Behaviour |
|---|---|
| Salary not scraped | Shows "Salary not listed" in amber — never hidden, so user knows it's missing vs. not loaded |
| Repost, no changes detected | Badge shows "Repost · originally posted Xw ago" with no diff section |
| All jobs filtered out | `EmptyState` with label matching filter ("No interested jobs yet") and a "Show all" link |
| Sheets API error | `EmptyState` with "Failed to load — Retry" button; SWR retries with exponential backoff |
| Job posting closed (flagged by refresh-deadlines cron) | `JobCard` shows "Posting closed" chip; `JobDetail` hides "Open JD" button |
| `?job=` ID not in current list (e.g. filtered out) | Detail shows "Job not found in current filter" with a "Show all" link |

---

## Accessibility

- `JobCard` is a `<button>` with `aria-pressed={isSelected}` and `aria-label="{title} at {company}"`
- `InterestActions` buttons: `aria-label="Mark as interested"` / `"Skip this job"` / `"Open job description (opens in new tab)"`
- `RepostBadge` expanded diff uses `<dl>/<dt>/<dd>` markup
- `MatchBadge` uses both colour and text — never colour alone
- `FilterBar` tabs use `role="tablist"` / `role="tab"` / `aria-selected`
- Keyboard shortcuts (implemented as `keydown` on `document`): `↑↓` navigate list, `Enter` open detail, `i` = interested, `s` = skip, `Esc` close detail on mobile
- Focus management: on mobile, navigating to `?job=id` moves focus to the detail heading; pressing Esc / back returns focus to the previously selected `JobCard`
- Colour contrast: all text meets WCAG AA (4.5:1 minimum) against dark backgrounds

---

## Responsive Behaviour

| Breakpoint | Layout |
|---|---|
| `< 768px` (mobile) | Full-width `JobList`. Tap → push to `?job=id` full page. NavBar collapses to icon tabs. |
| `768px–1024px` (tablet) | 40/60 split. Detail panel visible alongside list. |
| `> 1024px` (desktop) | 38/62 split. FilterBar on one row. Full detail with sidebar. |

`JobCard` metadata row wraps naturally on narrow widths — no truncation of salary.

---

## Out of Scope

- Editing job details (title, description, company) — Sheets is the edit surface
- Push notifications for new jobs — handled by Apps Script email digest
- Dark/light mode toggle — dark only (personal tool)
- Authentication — single-user, no auth layer
