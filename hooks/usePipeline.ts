// hooks/usePipeline.ts
'use client'
import useSWR from 'swr'
import type { PipelineEntry } from '../lib/types'

function getAuthHeader(): Record<string, string> {
  const token = process.env.NEXT_PUBLIC_API_TOKEN
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fetcher = (url: string) =>
  fetch(url, { headers: getAuthHeader() }).then(r => {
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
