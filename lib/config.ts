import { UserProfile } from "./types";

export const SEARCH_QUERIES = [
  "senior procurement manager",
  "senior category manager",
  "strategic sourcing manager",
  "principal category manager",
  "procurement lead",
  "sourcing lead",
  "procurement transformation",
  "digital procurement",
  "AI procurement",
];

export const TITLE_POSITIVE_KEYWORDS = [
  "senior",
  "principal",
  "lead",
  "manager",
  "director",
  "head",
];

export const TITLE_NEGATIVE_KEYWORDS = [
  "junior",
  "coordinator",
  "clerk",
  "intern",
  "analyst",
  "assistant",
  "associate",
  "entry",
];

export const CATEGORY_KEYWORDS = [
  "procurement",
  "sourcing",
  "category manager",
  "supply chain",
  "vendor management",
  "supplier",
  "purchasing",
  "contract",
];

export const LOCATION_KEYWORDS = [
  "canada",
  "toronto",
  "vancouver",
  "calgary",
  "ottawa",
  "montreal",
  "remote",
  "hybrid",
];

export const USER_PROFILE: UserProfile = {
  yearsExperience: "10+",
  currentTitle: "Senior Category Manager",
  designations: ["SCMP"],
  education: "Bachelor's degree",
  tools: ["SAP Ariba", "Coupa", "ServiceNow"],
  spendPortfolio: "$200M+ labor services",
  languages: ["English"],
  locationPreference: ["Remote", "Toronto", "Vancouver"],
  managementExperience: true,
  minTotalComp: 148000,
  targetTotalComp: "$155,000-$185,000",
};

export const SHEET_TABS = {
  JOBS_FEED: "Jobs Feed",
  PIPELINE: "Pipeline",
  COMPANIES: "Companies",
  COMP_DATA: "Comp Data",
  STRATEGY: "Strategy",
} as const;

export const JOBS_FEED_HEADERS = [
  "ID",
  "Date Found",
  "Company",
  "Title",
  "Location",
  "Salary Min",
  "Salary Max",
  "URL",
  "Source",
  "Closing Date",
  "Match Score",
  "Requirements Match",
  "Status",
  "Description",
  "Years Experience Required",
  "Education Required",
  "Certifications Required",
  "Skills/Tools Required",
  "Management Required",
  "Security Clearance",
  "Languages",
  "Notes",
  // new columns W–Y
  "Is Repost",
  "Original Job ID",
  "Repost Changes",
];

export const PIPELINE_HEADERS = [
  "ID",
  "Company",
  "Title",
  "Stage",
  "Date Applied",
  "Last Activity",
  "Next Follow-up",
  "Contact Name",
  "Contact Email",
  "Salary Offered",
  "Notes",
];

export const COMPANIES_HEADERS = [
  "Company",
  "Sector",
  "Tier",
  "ATS Platform",
  "Careers URL",
  "ATS Identifier",
  "Comp Range Est.",
  "Notes",
];

export const COMP_DATA_HEADERS = [
  "Role Title",
  "Sector",
  "Base Min",
  "Base Max",
  "Total Comp Min",
  "Total Comp Max",
  "Source",
  "Notes",
];

export const STRATEGY_HEADERS = [
  "Month",
  "Phase",
  "Action Items",
  "Status",
];
