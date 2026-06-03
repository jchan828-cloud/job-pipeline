import type { ScrapedJob } from "./types";

// Kept in sync with the Next.js app's lib/config.ts USER_PROFILE. Edit both
// together if the candidate profile changes.
const USER_PROFILE = {
  yearsExperience: "10+",
  currentTitle: "Senior Category Manager",
  designations: ["SCMP"],
  education: "Bachelor's degree",
  tools: ["SAP Ariba", "Coupa", "ServiceNow"],
  spendPortfolio: "$200M+ labor services",
  languages: ["English"],
  locationPreference: ["Remote", "Toronto", "Vancouver"],
  managementExperience: true,
  targetTotalComp: "$155,000-$185,000",
};

export const SYSTEM_PROMPT =
  "You are a job-fit scoring engine for a single candidate's job pipeline. " +
  "You receive one job posting and return a strict JSON verdict. Be calibrated " +
  "and consistent: identical inputs must yield identical scores.";

// Same scoring semantics as lib/scoring.ts: a 0..5 match score and a
// Strong/Partial/Stretch/Unknown requirements assessment. Asking every model
// for this exact contract is what makes their outputs comparable.
export function buildScoringPrompt(job: ScrapedJob): string {
  return [
    "Score how well this job fits the candidate below.",
    "",
    "CANDIDATE PROFILE:",
    JSON.stringify(USER_PROFILE, null, 2),
    "",
    "SCORING RULES:",
    "- matchScore: integer 0-5. 0 = clearly wrong (e.g. junior/coordinator/analyst",
    "  level, or unrelated field). 5 = senior procurement/sourcing/category role",
    "  strongly aligned with the profile.",
    "- requirementsMatch: one of Strong | Partial | Stretch | Unknown based on how",
    "  the posting's hard requirements (years, education, certifications, tools,",
    "  language, management) align with the candidate. Use Unknown only when the",
    "  description is too thin to judge.",
    "- rationale: one or two sentences, concrete.",
    "",
    "JOB POSTING:",
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    job.location ? `Location: ${job.location}` : "",
    `Description: ${job.description || "(none provided)"}`,
    "",
    'Respond with ONLY a JSON object: {"matchScore": <0-5>, "requirementsMatch":',
    '"Strong|Partial|Stretch|Unknown", "rationale": "<text>"}. No markdown, no prose.',
  ]
    .filter(Boolean)
    .join("\n");
}
