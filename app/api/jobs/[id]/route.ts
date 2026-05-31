import { NextResponse } from 'next/server'
import { getJobById, updateJobStatus, appendPipelineEntry } from '../../../../lib/google-sheets'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15/16: params is a Promise — await it
    const { id } = await params
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
