import type { Env } from "./types";

// How we talk to the provider once the request reaches it through the gateway.
//  - "anthropic": native /v1/messages contract
//  - "openai":    OpenAI-compatible /chat/completions contract (OpenAI, Groq,
//                 and Workers AI all speak this through the gateway)
export type ProviderContract = "anthropic" | "openai";

// The gateway "provider slug" — the path segment after the gateway id that
// tells AI Gateway where to forward the request.
export type GatewaySlug = "anthropic" | "openai" | "groq" | "workers-ai";

export interface ModelSpec {
  id: string; // friendly key used in the API and stored in D1
  label: string;
  contract: ProviderContract;
  slug: GatewaySlug;
  model: string; // the provider's model identifier
  keyFor: (env: Env) => string; // which secret authenticates this provider
  // Pricing per 1,000,000 tokens (USD). VERIFY against each provider's current
  // pricing page — these are starting estimates for cost-efficiency math, not
  // billing truth. AI Gateway also logs authoritative per-request cost.
  pricing: { inputPer1M: number; outputPer1M: number };
}

export const MODELS: ModelSpec[] = [
  // ---- Claude baseline (what the pipeline notionally uses today) ----
  {
    id: "claude-haiku",
    label: "Claude Haiku 4.5",
    contract: "anthropic",
    slug: "anthropic",
    model: "claude-haiku-4-5-20251001",
    keyFor: (e) => e.ANTHROPIC_API_KEY,
    pricing: { inputPer1M: 1.0, outputPer1M: 5.0 },
  },

  // ---- Cheap open models on Cloudflare's own network (Workers AI) ----
  {
    id: "wai-llama-3.3-70b",
    label: "Llama 3.3 70B (Workers AI)",
    contract: "openai",
    slug: "workers-ai",
    model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    keyFor: (e) => e.CF_WORKERS_AI_TOKEN,
    pricing: { inputPer1M: 0.29, outputPer1M: 2.25 },
  },
  {
    id: "wai-llama-3.1-8b",
    label: "Llama 3.1 8B (Workers AI)",
    contract: "openai",
    slug: "workers-ai",
    model: "@cf/meta/llama-3.1-8b-instruct",
    keyFor: (e) => e.CF_WORKERS_AI_TOKEN,
    pricing: { inputPer1M: 0.028, outputPer1M: 0.226 },
  },

  // ---- OpenAI challenger ----
  {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    contract: "openai",
    slug: "openai",
    model: "gpt-4o-mini",
    keyFor: (e) => e.OPENAI_API_KEY,
    pricing: { inputPer1M: 0.15, outputPer1M: 0.6 },
  },

  // ---- Groq-hosted open model (fast inference) ----
  {
    id: "groq-llama-3.3-70b",
    label: "Llama 3.3 70B (Groq)",
    contract: "openai",
    slug: "groq",
    model: "llama-3.3-70b-versatile",
    keyFor: (e) => e.GROQ_API_KEY,
    pricing: { inputPer1M: 0.59, outputPer1M: 0.79 },
  },
];

export function getModel(id: string): ModelSpec | undefined {
  return MODELS.find((m) => m.id === id);
}

export function resolveModels(ids?: string[]): ModelSpec[] {
  if (!ids || ids.length === 0) return MODELS;
  return ids.map(getModel).filter((m): m is ModelSpec => Boolean(m));
}
