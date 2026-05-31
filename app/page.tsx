// app/page.tsx
import { Suspense } from 'react'
import { JobFeedView } from '../components/jobs/JobFeedView'
import { PipelineView } from '../components/pipeline/PipelineView'

interface PageProps {
  searchParams: Promise<{ view?: string; job?: string; filter?: string; company?: string }>
}

export default async function Home({ searchParams }: PageProps) {
  // Next.js 15/16: searchParams is a Promise — await it
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
