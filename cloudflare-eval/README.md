# LLM Eval Harness (Cloudflare Worker)

A standalone Cloudflare Worker for benchmarking **non-Claude LLMs against the
Claude baseline** on the job-pipeline scoring step — measuring **cost**,
**latency**, and **quality (agreement with the baseline)** on the *same* job
batch and the *same* prompt.

> Why standalone? The Next.js app is on Next 16 (see the repo's `AGENTS.md`
> warning). Keeping the harness as its own Worker avoids coupling the eval to
> the app's deploy story and lets it run independently.

## Why Cloudflare for this

- **AI Gateway** is the centerpiece: one endpoint in front of Anthropic, OpenAI,
  Groq, and Workers AI. It logs cost, tokens, latency, and full requests, and
  can cache identical prompts — so the "compare providers" data is captured for
  free, uniformly. <https://developers.cloudflare.com/ai-gateway/>
- **Workers AI** supplies the cheap open challenger models (Llama, etc.) on
  Cloudflare's own network.
- **D1** persists every `(run, model, job)` result for offline analysis.

```
POST /run ─► scoreJobWithModel ─► AI Gateway ─► {Anthropic, OpenAI, Groq, Workers AI}
                                      │ logs cost/latency/tokens
                                      ▼
                                     D1 ─► GET /report  (cost/1k, p50/p95, agreement)
```

## Setup

```bash
cd cloudflare-eval
npm install

# 1. Create the D1 db and paste its id into wrangler.toml (database_id)
npm run db:create

# 2. Apply the schema
npm run db:migrate          # remote
# npm run db:migrate:local  # for `wrangler dev`

# 3. Fill in wrangler.toml [vars]: CF_ACCOUNT_ID, AI_GATEWAY_NAME
#    (create the gateway in dashboard: AI > AI Gateway)

# 4. Set provider secrets
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put CF_WORKERS_AI_TOKEN     # token with Workers AI read
# npx wrangler secret put CF_AIG_TOKEN          # only if gateway is "Authenticated"

# 5. Deploy (or run locally)
npm run deploy
# npm run dev
```

For local dev, put secrets in a `.dev.vars` file (git-ignored) instead of
`wrangler secret put`.

## Usage

```bash
# What's registered?
curl https://<worker-url>/health

# Run the built-in sample batch across all models
curl -X POST https://<worker-url>/run

# Run a real batch / subset of models
curl -X POST https://<worker-url>/run \
  -H 'content-type: application/json' \
  --data @jobs.sample.json

# Get the comparison report
curl "https://<worker-url>/report?run=<runId>"
```

### Report fields (per model)

| field | meaning |
|---|---|
| `costPer1kJobs` | USD to score 1,000 jobs — the headline cost-efficiency number |
| `latencyP50` / `latencyP95` | response latency in ms |
| `scoreMae` | mean absolute difference of `matchScore` vs the baseline |
| `requirementsAgreementPct` | % of jobs where the `requirementsMatch` label equals the baseline's |
| `errors` | failed calls / unparseable outputs |

The baseline model is set by `BASELINE_MODEL` in `wrangler.toml` (default
`claude-haiku`). Treat Claude as the reference; for ground-truth quality, add a
few hand-labeled jobs and compare each model to those too — don't only measure
"who agrees with Claude."

## Adding / changing models

Edit `src/models.ts`. Each entry declares its gateway slug, provider contract
(`anthropic` or OpenAI-compatible), model id, which secret authenticates it, and
**editable pricing** used for the cost math.

> ⚠️ The `pricing` numbers are starting estimates — verify them against each
> provider's current pricing page. AI Gateway's dashboard also shows
> authoritative per-request cost.
