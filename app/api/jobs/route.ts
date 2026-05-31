import { NextResponse } from 'next/server'
import { getJobs } from '../../../lib/google-sheets'

// Clients must send Authorization: Bearer $SETUP_TOKEN
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.SETUP_TOKEN || authHeader !== `Bearer ${process.env.SETUP_TOKEN}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

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
