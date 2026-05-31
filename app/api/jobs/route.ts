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
