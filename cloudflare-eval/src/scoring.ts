import type { Env, ScrapedJob, ScoreResult, RequirementsMatch } from "./types";
import type { ModelSpec } from "./models";
import { callModel } from "./gateway";
import { buildScoringPrompt } from "./prompt";

// Same id strategy as the app's lib/scoring.ts generateJobId(): sha256 of
// company|title|url, first 16 hex chars — so eval rows line up with real jobs.
export async function generateJobId(job: ScrapedJob): Promise<string> {
  const raw = `${job.company}|${job.title}|${job.url ?? ""}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

const VALID_MATCH: RequirementsMatch[] = ["Strong", "Partial", "Stretch", "Unknown"];

function parseVerdict(text: string): ScoreResult {
  // Models occasionally wrap JSON in code fences or stray prose; grab the
  // outermost object.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`no JSON object in model output: ${text.slice(0, 200)}`);
  }
  const parsed = JSON.parse(text.slice(start, end + 1));

  const score = Math.round(Number(parsed.matchScore));
  if (!Number.isFinite(score) || score < 0 || score > 5) {
    throw new Error(`matchScore out of range: ${parsed.matchScore}`);
  }
  const match: RequirementsMatch = VALID_MATCH.includes(parsed.requirementsMatch)
    ? parsed.requirementsMatch
    : "Unknown";

  return {
    matchScore: score,
    requirementsMatch: match,
    rationale: String(parsed.rationale ?? "").slice(0, 1000),
  };
}

export interface ScoredRow {
  verdict: ScoreResult | null;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  error: string | null;
  rawOutput: string;
}

export async function scoreJobWithModel(
  env: Env,
  model: ModelSpec,
  job: ScrapedJob,
): Promise<ScoredRow> {
  try {
    const call = await callModel(env, model, buildScoringPrompt(job));
    const verdict = parseVerdict(call.text);
    const costUsd =
      (call.tokensIn / 1_000_000) * model.pricing.inputPer1M +
      (call.tokensOut / 1_000_000) * model.pricing.outputPer1M;
    return {
      verdict,
      latencyMs: call.latencyMs,
      tokensIn: call.tokensIn,
      tokensOut: call.tokensOut,
      costUsd,
      error: null,
      rawOutput: call.text.slice(0, 2000),
    };
  } catch (err) {
    return {
      verdict: null,
      latencyMs: 0,
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      error: err instanceof Error ? err.message : String(err),
      rawOutput: "",
    };
  }
}
