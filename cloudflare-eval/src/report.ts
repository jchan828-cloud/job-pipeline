import type { Env } from "./types";
import { getRunRows, type StoredRow } from "./store";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export interface ModelReport {
  modelId: string;
  jobs: number;
  errors: number;
  latencyP50: number;
  latencyP95: number;
  totalCostUsd: number;
  costPer1kJobs: number;
  avgTokensIn: number;
  avgTokensOut: number;
  // Quality vs the baseline model (only over jobs both scored successfully).
  comparedJobs: number;
  scoreMae: number; // mean |matchScore - baselineScore|
  requirementsAgreementPct: number; // % identical requirementsMatch labels
}

export interface RunReport {
  runId: string;
  baselineModel: string;
  models: ModelReport[];
}

export async function buildReport(env: Env, runId: string): Promise<RunReport> {
  const rows = await getRunRows(env, runId);
  const baseline = env.BASELINE_MODEL;

  // Baseline verdicts keyed by job for comparison.
  const baselineByJob = new Map<string, StoredRow>();
  for (const r of rows) {
    if (r.model_id === baseline && r.error === null) baselineByJob.set(r.job_id, r);
  }

  const byModel = new Map<string, StoredRow[]>();
  for (const r of rows) {
    const list = byModel.get(r.model_id) ?? [];
    list.push(r);
    byModel.set(r.model_id, list);
  }

  const models: ModelReport[] = [];
  for (const [modelId, list] of byModel) {
    const ok = list.filter((r) => r.error === null);
    const latencies = ok.map((r) => r.latency_ms).sort((a, b) => a - b);
    const totalCost = ok.reduce((s, r) => s + (r.cost_usd ?? 0), 0);

    let compared = 0;
    let scoreAbsErr = 0;
    let reqAgree = 0;
    for (const r of ok) {
      const base = baselineByJob.get(r.job_id);
      if (!base || modelId === baseline) continue;
      compared++;
      scoreAbsErr += Math.abs((r.match_score ?? 0) - (base.match_score ?? 0));
      if (r.requirements_match === base.requirements_match) reqAgree++;
    }

    models.push({
      modelId,
      jobs: list.length,
      errors: list.length - ok.length,
      latencyP50: percentile(latencies, 50),
      latencyP95: percentile(latencies, 95),
      totalCostUsd: Number(totalCost.toFixed(6)),
      costPer1kJobs: ok.length ? Number(((totalCost / ok.length) * 1000).toFixed(4)) : 0,
      avgTokensIn: ok.length ? Math.round(ok.reduce((s, r) => s + r.tokens_in, 0) / ok.length) : 0,
      avgTokensOut: ok.length ? Math.round(ok.reduce((s, r) => s + r.tokens_out, 0) / ok.length) : 0,
      comparedJobs: compared,
      scoreMae: compared ? Number((scoreAbsErr / compared).toFixed(3)) : 0,
      requirementsAgreementPct: compared ? Number(((reqAgree / compared) * 100).toFixed(1)) : 0,
    });
  }

  // Baseline first, then cheapest cost-per-1k.
  models.sort((a, b) => {
    if (a.modelId === baseline) return -1;
    if (b.modelId === baseline) return 1;
    return a.costPer1kJobs - b.costPer1kJobs;
  });

  return { runId, baselineModel: baseline, models };
}
