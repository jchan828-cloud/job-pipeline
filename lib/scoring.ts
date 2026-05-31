import { ScrapedJob, JobPosting } from "./types";
import { USER_PROFILE, TITLE_NEGATIVE_KEYWORDS } from "./config";
import { createHash } from "crypto";

export function generateJobId(job: ScrapedJob): string {
  const raw = `${job.company}|${job.title}|${job.url}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

export function scoreJob(job: ScrapedJob): {
  matchScore: number;
  requirementsMatch: "Strong" | "Partial" | "Stretch" | "Unknown";
} {
  let score = 0;
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || "").toLowerCase();

  for (const neg of TITLE_NEGATIVE_KEYWORDS) {
    if (titleLower.includes(neg)) return { matchScore: 0, requirementsMatch: "Stretch" };
  }

  if (/senior|principal|lead|head/i.test(titleLower)) score += 1;
  if (/procurement|sourcing|category/i.test(titleLower)) score += 1;
  if (/manager|director/i.test(titleLower)) score += 1;

  if (descLower.includes("ai") || descLower.includes("artificial intelligence") || descLower.includes("digital transformation")) score += 1;
  if (descLower.includes("labor") || descLower.includes("labour") || descLower.includes("contingent") || descLower.includes("outsourc")) score += 1;

  score = Math.min(score, 5);

  const reqMatch = assessRequirementsMatch(job);

  return { matchScore: score, requirementsMatch: reqMatch };
}

function assessRequirementsMatch(
  job: ScrapedJob
): "Strong" | "Partial" | "Stretch" | "Unknown" {
  const desc = (job.description || "").toLowerCase();
  if (!desc || desc.length < 100) return "Unknown";

  let matchPoints = 0;
  let totalPoints = 0;

  const yearsMatch = desc.match(/(\d+)\+?\s*(?:years?|yrs?)/);
  if (yearsMatch) {
    totalPoints++;
    const required = parseInt(yearsMatch[1]);
    if (required <= 10) matchPoints++;
  }

  if (/scmp|cpsm|cscp|cpp|cpm/i.test(desc)) {
    totalPoints++;
    if (/scmp/i.test(desc)) matchPoints++;
  }

  if (/bachelor|degree|university|post-secondary/i.test(desc)) {
    totalPoints++;
    matchPoints++;
  }

  if (/mba|master/i.test(desc)) {
    totalPoints++;
    // Partial — user has Bachelor's
  }

  if (/sap ariba|coupa|servicenow/i.test(desc)) {
    totalPoints++;
    matchPoints++;
  }

  if (/french|bilingual|bilingue/i.test(desc)) {
    totalPoints++;
    // User is English only
  }

  if (/manage.*team|direct report|people leader|supervisory/i.test(desc)) {
    totalPoints++;
    matchPoints++; // User has management experience from ICBC
  }

  if (totalPoints === 0) return "Unknown";
  const ratio = matchPoints / totalPoints;
  if (ratio >= 0.75) return "Strong";
  if (ratio >= 0.5) return "Partial";
  return "Stretch";
}

export function parseRequirements(description: string): {
  yearsExperience: string;
  educationRequired: string;
  certificationsRequired: string;
  skillsToolsRequired: string;
  managementRequired: string;
  securityClearance: string;
  languages: string;
} {
  const desc = description || "";

  const yearsMatch = desc.match(
    /(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?/i
  );
  const yearsExperience = yearsMatch
    ? yearsMatch[2]
      ? `${yearsMatch[1]}-${yearsMatch[2]} years`
      : `${yearsMatch[1]}+ years`
    : "";

  const eduPatterns = [
    /(?:bachelor'?s?|b\.?a\.?|b\.?sc\.?|b\.?comm?\.?)\s*(?:degree)?/i,
    /(?:master'?s?|mba|m\.?sc\.?)\s*(?:degree)?/i,
    /(?:post-secondary|university|college)\s*(?:degree|diploma|education)?/i,
  ];
  const eduMatches: string[] = [];
  for (const p of eduPatterns) {
    const m = desc.match(p);
    if (m) eduMatches.push(m[0].trim());
  }
  const educationRequired = eduMatches.join(", ");

  const certPatterns =
    /\b(SCMP|CPSM|CPP|CSCP|CPIM|PMP|CPA|CIPS|MCIPS|CSCMP|APICS|Six Sigma|Lean)\b/gi;
  const certMatches = [...new Set((desc.match(certPatterns) || []).map((c) => c.toUpperCase()))];
  const certificationsRequired = certMatches.join(", ");

  const toolPatterns =
    /\b(SAP\s*(?:Ariba|MM|SRM)?|Coupa|Jaggaer|Ivalua|ServiceNow|Oracle\s*(?:Procurement|ERP)?|Workday|GEP\s*SMART|Zycus|Basware|Aravo|JIRA|Salesforce)\b/gi;
  const toolMatches = [...new Set((desc.match(toolPatterns) || []))];
  const skillsToolsRequired = toolMatches.join(", ");

  const mgmtMatch =
    /(?:manage|lead|supervise|oversee).*?(?:team|staff|report|direct report|analyst|coordinator)/i.test(
      desc
    );
  const reportMatch = desc.match(/(\d+)\s*(?:direct\s*)?report/i);
  const managementRequired = mgmtMatch
    ? reportMatch
      ? `Yes - ${reportMatch[1]} reports`
      : "Yes"
    : "";

  const secMatch =
    /(?:security clearance|secret clearance|reliability status|enhanced reliability)/i.test(
      desc
    );
  const securityClearance = secMatch ? "Required" : "";

  const langMatches: string[] = [];
  if (/\benglish\b/i.test(desc)) langMatches.push("English");
  if (/\bfrench\b|bilingue|bilingual/i.test(desc)) langMatches.push("French");
  const languages = langMatches.join(", ");

  return {
    yearsExperience,
    educationRequired,
    certificationsRequired,
    skillsToolsRequired,
    managementRequired,
    securityClearance,
    languages,
  };
}

export function processScrapedJob(job: ScrapedJob): JobPosting {
  const { matchScore, requirementsMatch } = scoreJob(job);
  const reqs = parseRequirements(job.description);

  return {
    ...job,
    id: generateJobId(job),
    dateFound: new Date().toISOString().split("T")[0],
    matchScore,
    requirementsMatch,
    status: "New",
    ...reqs,
    notes: "",
    isRepost: false,
  };
}
