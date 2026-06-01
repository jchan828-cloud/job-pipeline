// Security: protect this deployment with Vercel Deployment Protection
// (vercel.com/docs/security/deployment-protection) before exposing to the internet.
// Application-level auth is intentionally omitted for this single-user personal tool.
import { NextResponse } from 'next/server'
import { getJobById, updateJobStatus, appendPipelineEntry } from '../../../../lib/google-sheets'

const VALID_STATUSES = ['New', 'Reviewed', 'Interested', 'Skipped', 'Added to Pipeline', 'Dismissed'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15/16: params is a Promise — await it
    const { id } = await params
    const body = await request.json()
    const { status } = body as { status: string }

    if (!status || typeof status !== 'string' || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    const result = await getJobById(id)
    if (!result) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await updateJobStatus(result.row, status)

    // Only append to pipeline if transitioning TO Interested (not if already Interested)
    if (status === 'Interested' && result.job.status !== 'Interested') {
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
