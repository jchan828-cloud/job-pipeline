// Mirrors the relevant slice of the Next.js app's lib/types.ts so the eval
// harness scores the same shape of input the real pipeline produces.

export interface ScrapedJob {
  title: string;
  company: string;
  location?: string;
  url?: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  source?: string;
}

export type RequirementsMatch = "Strong" | "Partial" | "Stretch" | "Unknown";

// The structured verdict we ask every model to produce. Same semantics as
// lib/scoring.ts so a model's output is directly comparable to the heuristic
// and to the Claude baseline.
export interface ScoreResult {
  matchScore: number; // 0..5
  requirementsMatch: RequirementsMatch;
  rationale: string;
}

export interface ModelCallResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface Env {
  DB: D1Database;
  AI: Ai;
  CF_ACCOUNT_ID: string;
  AI_GATEWAY_NAME: string;
  BASELINE_MODEL: string;
  MAX_JOBS_PER_RUN: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  GROQ_API_KEY: string;
  CF_WORKERS_AI_TOKEN: string;
  CF_AIG_TOKEN?: string;
}
