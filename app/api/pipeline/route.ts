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
