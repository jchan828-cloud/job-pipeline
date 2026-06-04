import type { Env, ModelCallResult } from "./types";
import type { ModelSpec } from "./models";
import { SYSTEM_PROMPT } from "./prompt";

// All providers are reached through a single AI Gateway endpoint so that cost,
// latency, token usage, caching, and logs are captured uniformly in one place.
// Docs: https://developers.cloudflare.com/ai-gateway/
function gatewayBase(env: Env): string {
  return `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.AI_GATEWAY_NAME}`;
}

function pathFor(slug: ModelSpec["slug"]): string {
  switch (slug) {
    case "anthropic":
      return "/anthropic/v1/messages";
    case "openai":
      return "/openai/v1/chat/completions";
    case "groq":
      return "/groq/openai/v1/chat/completions";
    case "workers-ai":
      return "/workers-ai/v1/chat/completions";
  }
}

// Optional gateway-level auth (when the gateway is set to "Authenticated").
function withGatewayAuth(env: Env, headers: Record<string, string>) {
  if (env.CF_AIG_TOKEN) headers["cf-aig-authorization"] = `Bearer ${env.CF_AIG_TOKEN}`;
  return headers;
}

export async function callModel(
  env: Env,
  model: ModelSpec,
  userPrompt: string,
): Promise<ModelCallResult> {
  const url = gatewayBase(env) + pathFor(model.slug);
  const key = model.keyFor(env);
  const started = Date.now();

  if (model.contract === "anthropic") {
    const res = await fetch(url, {
      method: "POST",
      headers: withGatewayAuth(env, {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      }),
      body: JSON.stringify({
        model: model.model,
        max_tokens: 512,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    const data: any = await res.json();
    const text = (data.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    return {
      text,
      tokensIn: data.usage?.input_tokens ?? 0,
      tokensOut: data.usage?.output_tokens ?? 0,
      latencyMs,
    };
  }

  // OpenAI-compatible contract (OpenAI, Groq, Workers AI).
  const res = await fetch(url, {
    method: "POST",
    headers: withGatewayAuth(env, {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    }),
    body: JSON.stringify({
      model: model.model,
      temperature: 0,
      max_tokens: 512,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const latencyMs = Date.now() - started;
  if (!res.ok) throw new Error(`${model.slug} ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
    latencyMs,
  };
}
