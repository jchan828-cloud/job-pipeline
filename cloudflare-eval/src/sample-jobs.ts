import type { ScrapedJob } from "./types";

// A small, deliberately varied batch (clear-fit, stretch, and clear-miss) so a
// run exercises the full 0-5 range. Replace via the POST /run body for real
// evals pulled from the Google Sheet.
export const SAMPLE_JOBS: ScrapedJob[] = [
  {
    title: "Senior Category Manager, Labor & Professional Services",
    company: "Acme Bank",
    location: "Toronto, ON (Hybrid)",
    url: "https://example.com/jobs/1",
    source: "sample",
    description:
      "Lead strategic sourcing for a $250M contingent labor and professional services portfolio. " +
      "10+ years procurement experience, SCMP or equivalent designation preferred, bachelor's degree required. " +
      "Experience with SAP Ariba and Coupa. Manage a team of 4 sourcing analysts. English required.",
  },
  {
    title: "Procurement Transformation Lead (AI & Digital)",
    company: "Globex",
    location: "Remote, Canada",
    url: "https://example.com/jobs/2",
    source: "sample",
    description:
      "Drive digital procurement transformation leveraging AI and automation. 8+ years in procurement, " +
      "strong stakeholder management, ServiceNow experience an asset. Bachelor's degree. People leadership required.",
  },
  {
    title: "Procurement Coordinator",
    company: "Initech",
    location: "Calgary, AB",
    url: "https://example.com/jobs/3",
    source: "sample",
    description:
      "Entry-level coordinator supporting the purchasing team with PO creation and vendor data entry. " +
      "1-2 years experience. Diploma preferred. Bilingual (English/French) required.",
  },
  {
    title: "Director, Strategic Sourcing",
    company: "Umbrella Corp",
    location: "Vancouver, BC",
    url: "https://example.com/jobs/4",
    source: "sample",
    description:
      "Own the enterprise sourcing strategy. 12+ years, MBA preferred, MCIPS or SCMP. Lead a department of 15. " +
      "Direct reports include category managers. Total comp $170k-$200k.",
  },
  {
    title: "Software Engineer, Backend",
    company: "DevHouse",
    location: "Remote",
    url: "https://example.com/jobs/5",
    source: "sample",
    description:
      "Build distributed systems in Go and Rust. 5+ years backend experience. Unrelated to procurement.",
  },
];
