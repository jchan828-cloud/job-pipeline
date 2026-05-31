// Security: protect this deployment with Vercel Deployment Protection
// (vercel.com/docs/security/deployment-protection) before exposing to the internet.
// Application-level auth is intentionally omitted for this single-user personal tool.
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
