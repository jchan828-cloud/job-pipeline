import { google, sheets_v4 } from "googleapis";
import {
  SHEET_TABS,
  JOBS_FEED_HEADERS,
  PIPELINE_HEADERS,
  COMPANIES_HEADERS,
  COMP_DATA_HEADERS,
  STRATEGY_HEADERS,
} from "./config";
import { JobPosting, PipelineEntry } from "./types";
import { TARGET_COMPANIES } from "../data/companies";
import { COMP_BENCHMARKS } from "../data/comp-data";
import { STRATEGY_MILESTONES } from "../data/strategy";

export function rowToJobPosting(row: string[]): JobPosting {
  return {
    id: row[0] ?? '',
    dateFound: row[1] ?? '',
    company: row[2] ?? '',
    title: row[3] ?? '',
    location: row[4] ?? '',
    salaryMin: row[5] ? Number(row[5]) : undefined,
    salaryMax: row[6] ? Number(row[6]) : undefined,
    url: row[7] ?? '',
    source: row[8] ?? '',
    closingDate: row[9] || undefined,
    matchScore: Number(row[10]) || 0,
    requirementsMatch: (row[11] as JobPosting['requirementsMatch']) || 'Unknown',
    status: (row[12] as JobPosting['status']) || 'New',
    description: row[13] ?? '',
    yearsExperience: row[14] ?? '',
    educationRequired: row[15] ?? '',
    certificationsRequired: row[16] ?? '',
    skillsToolsRequired: row[17] ?? '',
    managementRequired: row[18] ?? '',
    securityClearance: row[19] ?? '',
    languages: row[20] ?? '',
    notes: row[21] ?? '',
    isRepost: row[22] === 'TRUE',
    originalJobId: row[23] || undefined,
    repostChanges: (() => {
      try { return row[24] ? JSON.parse(row[24]) : [] } catch { return [] }
    })(),
  }
}

export function rowToPipelineEntry(row: string[]): PipelineEntry {
  return {
    id: row[0] ?? '',
    company: row[1] ?? '',
    title: row[2] ?? '',
    stage: row[3] ?? '',
    dateApplied: row[4] ?? '',
    lastActivity: row[5] ?? '',
    nextFollowUp: row[6] ?? '',
    contactName: row[7] ?? '',
    contactEmail: row[8] ?? '',
    salaryOffered: row[9] ?? '',
    notes: row[10] ?? '',
  }
}

function getAuth() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const credentials = JSON.parse(Buffer.from(key, "base64").toString("utf-8"));
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}

function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID not set");
  return id;
}

export async function createSpreadsheet(
  userEmail: string
): Promise<{ spreadsheetId: string; url: string }> {
  const sheets = getSheets();
  const drive = google.drive({ version: "v3", auth: getAuth() });

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: "Job Search Pipeline" },
      sheets: [
        { properties: { title: SHEET_TABS.JOBS_FEED } },
        { properties: { title: SHEET_TABS.PIPELINE } },
        { properties: { title: SHEET_TABS.COMPANIES } },
        { properties: { title: SHEET_TABS.COMP_DATA } },
        { properties: { title: SHEET_TABS.STRATEGY } },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;

  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: { type: "user", role: "writer", emailAddress: userEmail },
  });

  await populateHeaders(spreadsheetId);
  await populateCompanies(spreadsheetId);
  await populateCompData(spreadsheetId);
  await populateStrategy(spreadsheetId);

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

async function populateHeaders(spreadsheetId: string) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        {
          range: `'${SHEET_TABS.JOBS_FEED}'!A1`,
          values: [JOBS_FEED_HEADERS],
        },
        {
          range: `'${SHEET_TABS.PIPELINE}'!A1`,
          values: [PIPELINE_HEADERS],
        },
        {
          range: `'${SHEET_TABS.COMPANIES}'!A1`,
          values: [COMPANIES_HEADERS],
        },
        {
          range: `'${SHEET_TABS.COMP_DATA}'!A1`,
          values: [COMP_DATA_HEADERS],
        },
        {
          range: `'${SHEET_TABS.STRATEGY}'!A1`,
          values: [STRATEGY_HEADERS],
        },
      ],
    },
  });
}

async function populateCompanies(spreadsheetId: string) {
  const sheets = getSheets();
  const rows = TARGET_COMPANIES.map((c) => [
    c.company,
    c.sector,
    c.tier,
    c.atsPlatform,
    c.careersUrl,
    c.atsIdentifier,
    c.compRangeEst,
    c.notes,
  ]);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${SHEET_TABS.COMPANIES}'!A2`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

async function populateCompData(spreadsheetId: string) {
  const sheets = getSheets();
  const rows = COMP_BENCHMARKS.map((c) => [
    c.roleTitle,
    c.sector,
    c.baseMin,
    c.baseMax,
    c.totalCompMin,
    c.totalCompMax,
    c.source,
    c.notes,
  ]);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${SHEET_TABS.COMP_DATA}'!A2`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

async function populateStrategy(spreadsheetId: string) {
  const sheets = getSheets();
  const rows = STRATEGY_MILESTONES.map((m) => [
    m.month,
    m.phase,
    m.actionItems,
    m.status,
  ]);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${SHEET_TABS.STRATEGY}'!A2`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

export async function getExistingJobIds(): Promise<Set<string>> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A:A`,
  });
  const ids = new Set<string>();
  if (res.data.values) {
    for (const row of res.data.values.slice(1)) {
      if (row[0]) ids.add(row[0]);
    }
  }
  return ids;
}

export async function appendJobs(jobs: JobPosting[]): Promise<number> {
  if (jobs.length === 0) return 0;
  const sheets = getSheets();
  const rows = jobs.map((j) => [
    j.id,
    j.dateFound,
    j.company,
    j.title,
    j.location,
    j.salaryMin ?? "",
    j.salaryMax ?? "",
    j.url,
    j.source,
    j.closingDate ?? "",
    j.matchScore,
    j.requirementsMatch,
    j.status,
    (j.description || "").slice(0, 500),
    j.yearsExperience,
    j.educationRequired,
    j.certificationsRequired,
    j.skillsToolsRequired,
    j.managementRequired,
    j.securityClearance,
    j.languages,
    j.notes,
    j.isRepost ? 'TRUE' : 'FALSE',
    j.originalJobId ?? '',
    j.repostChanges?.length ? JSON.stringify(j.repostChanges) : '',
  ]);
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A:A`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
  return jobs.length;
}

export async function getPipelineUrls(): Promise<
  { url: string; row: number }[]
> {
  const sheets = getSheets();
  const feedRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!H:M`,
  });
  const results: { url: string; row: number }[] = [];
  if (feedRes.data.values) {
    for (let i = 1; i < feedRes.data.values.length; i++) {
      const row = feedRes.data.values[i];
      const url = row[0];
      const status = row[5];
      if (url && status !== "Dismissed") {
        results.push({ url, row: i + 1 });
      }
    }
  }
  return results;
}

export async function updateJobStatus(
  row: number,
  status: string
): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!M${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
}

export async function getJobs(): Promise<JobPosting[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A2:Y`,
  })
  if (!res.data.values) return []
  return res.data.values
    .filter(row => row[0])
    .map(row => rowToJobPosting(row.map(String)))
}

export async function getJobById(
  id: string
): Promise<{ job: JobPosting; row: number } | null> {
  const sheets = getSheets()
  const idsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A:A`,
  })
  if (!idsRes.data.values) return null
  let rowNumber = -1
  for (let i = 1; i < idsRes.data.values.length; i++) {
    if (idsRes.data.values[i][0] === id) { rowNumber = i + 1; break }
  }
  if (rowNumber === -1) return null
  const rowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.JOBS_FEED}'!A${rowNumber}:Y${rowNumber}`,
  })
  if (!rowRes.data.values?.[0]) return null
  return { job: rowToJobPosting(rowRes.data.values[0].map(String)), row: rowNumber }
}

export async function getPipelineEntries(): Promise<PipelineEntry[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.PIPELINE}'!A2:K`,
  })
  if (!res.data.values) return []
  return res.data.values
    .filter(row => row[0])
    .map(row => rowToPipelineEntry(row.map(String)))
}

export async function appendPipelineEntry(job: JobPosting): Promise<void> {
  const sheets = getSheets()
  const salaryLabel =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
      : ''
  const today = new Date().toISOString().split('T')[0]
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TABS.PIPELINE}'!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        job.id, job.company, job.title, 'To Apply',
        '', today, '', '', '', salaryLabel, '',
      ]],
    },
  })
}
