import type { Env, ScrapedJob } from "./types";
import { resolveModels } from "./models";
import { generateJobId, scoreJobWithModel } from "./scoring";
import { insertResult, listRuns } from "./store";
import { buildReport } from "./report";
import { SAMPLE_JOBS } from "./sample-jobs";

// ── Routes ──────────────────────────────────────────────────────────────────
//  GET  /health          → liveness + which models are registered
//  GET  /runs            → recent run ids
//  POST /run             → score a job batch across models, store metrics
//        body: { jobs?: ScrapedJob[], models?: string[], runId?: string }
//        (omit jobs to use the built-in sample batch)
//  GET  /report?run=<id> → cost / latency / agreement-vs-baseline per model
// ─────────────────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      if (req.method === "GET" && path === "/health") {
        const { MODELS } = await import("./models");
        return json({
          ok: true,
          baseline: env.BASELINE_MODEL,
          models: MODELS.map((m) => ({ id: m.id, label: m.label, slug: m.slug })),
        });
      }

      if (req.method === "GET" && path === "/runs") {
        return json(await listRuns(env));
      }

      if (req.method === "GET" && path === "/report") {
        const runId = url.searchParams.get("run");
        if (!runId) return json({ error: "missing ?run=<id>" }, 400);
        return json(await buildReport(env, runId));
      }

      if (req.method === "POST" && path === "/run") {
        const body = (await req.json().catch(() => ({}))) as {
          jobs?: ScrapedJob[];
          models?: string[];
          runId?: string;
        };

        const cap = Number(env.MAX_JOBS_PER_RUN || "25");
        const jobs = (body.jobs?.length ? body.jobs : SAMPLE_JOBS).slice(0, cap);
        const models = resolveModels(body.models);
        if (models.length === 0) return json({ error: "no valid models selected" }, 400);

        const runId = body.runId || `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;

        let scored = 0;
        let errors = 0;
        for (const job of jobs) {
          const jobId = await generateJobId(job);
          // Models run in parallel per job; jobs run sequentially to respect
          // Worker subrequest/CPU limits.
          const results = await Promise.all(
            models.map(async (model) => {
              const row = await scoreJobWithModel(env, model, job);
              await insertResult(env, runId, model, jobId, job, row);
              return row.error;
            }),
          );
          for (const err of results) err ? errors++ : scored++;
        }

        return json({
          runId,
          jobs: jobs.length,
          models: models.map((m) => m.id),
          scored,
          errors,
          report: `/report?run=${runId}`,
        });
      }

      return json({ error: "not found", routes: ["/health", "/runs", "POST /run", "/report?run="] }, 404);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  },
};
