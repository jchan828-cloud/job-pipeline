-- D1 schema for the LLM eval harness.
-- One row per (run, model, job). Metrics let us compute cost/1k, latency
-- percentiles, and agreement-with-baseline downstream.

CREATE TABLE IF NOT EXISTS eval_results (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id             TEXT    NOT NULL,
  model_id           TEXT    NOT NULL,   -- friendly key from the model registry
  provider_model     TEXT    NOT NULL,   -- the actual provider model string
  job_id             TEXT    NOT NULL,   -- stable hash of the job
  job_title          TEXT,
  job_company        TEXT,

  match_score        INTEGER,            -- 0..5, null on error
  requirements_match TEXT,               -- Strong|Partial|Stretch|Unknown, null on error
  rationale          TEXT,

  latency_ms         INTEGER,
  tokens_in          INTEGER,
  tokens_out         INTEGER,
  cost_usd           REAL,               -- computed from registry pricing

  error              TEXT,               -- non-null if the call/parse failed
  raw_output         TEXT,               -- truncated model text for auditing
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_eval_run   ON eval_results (run_id);
CREATE INDEX IF NOT EXISTS idx_eval_model ON eval_results (run_id, model_id);
CREATE INDEX IF NOT EXISTS idx_eval_job   ON eval_results (run_id, job_id);
