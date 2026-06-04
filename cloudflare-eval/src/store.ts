import type { Env, ScrapedJob } from "./types";
import type { ModelSpec } from "./models";
import type { ScoredRow } from "./scoring";

export interface StoredRow {
  model_id: string;
  job_id: string;
  match_score: number | null;
  requirements_match: string | null;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  error: string | null;
}

export async function insertResult(
  env: Env,
  runId: string,
  model: ModelSpec,
  jobId: string,
  job: ScrapedJob,
  row: ScoredRow,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO eval_results
       (run_id, model_id, provider_model, job_id, job_title, job_company,
        match_score, requirements_match, rationale,
        latency_ms, tokens_in, tokens_out, cost_usd, error, raw_output)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      runId,
      model.id,
      model.model,
      jobId,
      job.title,
      job.company,
      row.verdict?.matchScore ?? null,
      row.verdict?.requirementsMatch ?? null,
      row.verdict?.rationale ?? null,
      row.latencyMs,
      row.tokensIn,
      row.tokensOut,
      row.costUsd,
      row.error,
      row.rawOutput,
    )
    .run();
}

export async function getRunRows(env: Env, runId: string): Promise<StoredRow[]> {
  const res = await env.DB.prepare(
    `SELECT model_id, job_id, match_score, requirements_match,
            latency_ms, tokens_in, tokens_out, cost_usd, error
       FROM eval_results WHERE run_id = ?`,
  )
    .bind(runId)
    .all<StoredRow>();
  return res.results ?? [];
}

export async function listRuns(env: Env): Promise<{ run_id: string; rows: number; created_at: string }[]> {
  const res = await env.DB.prepare(
    `SELECT run_id, COUNT(*) AS rows, MIN(created_at) AS created_at
       FROM eval_results GROUP BY run_id ORDER BY created_at DESC LIMIT 50`,
  ).all<{ run_id: string; rows: number; created_at: string }>();
  return res.results ?? [];
}
