export interface ScrapedJob {
  title: string
  company: string
  location: string
  url: string
  description: string
  salaryMin?: number
  salaryMax?: number
  closingDate?: string
  source: string
}

export interface RepostChange {
  field: 'salary' | 'location' | 'title' | 'workArrangement'
  from: string
  to: string
}

export interface JobPosting extends ScrapedJob {
  id: string
  dateFound: string
  matchScore: number
  requirementsMatch: 'Strong' | 'Partial' | 'Stretch' | 'Unknown'
  status: 'New' | 'Reviewed' | 'Interested' | 'Skipped' | 'Added to Pipeline' | 'Dismissed'
  yearsExperience: string
  educationRequired: string
  certificationsRequired: string
  skillsToolsRequired: string
  managementRequired: string
  securityClearance: string
  languages: string
  notes: string
  // repost fields
  isRepost: boolean
  originalJobId?: string
  repostChanges?: RepostChange[]
}

export interface PipelineEntry {
  id: string
  company: string
  title: string
  stage: string
  dateApplied: string
  lastActivity: string
  nextFollowUp: string
  contactName: string
  contactEmail: string
  salaryOffered: string
  notes: string
}

export interface TargetCompany {
  company: string
  sector: string
  tier: 1 | 2 | 3
  atsPlatform: 'Workday' | 'Greenhouse' | 'Lever' | 'Taleo' | 'SuccessFactors' | 'Custom'
  careersUrl: string
  atsIdentifier: string
  compRangeEst: string
  notes: string
}

export interface CompBenchmark {
  roleTitle: string
  sector: string
  baseMin: number
  baseMax: number
  totalCompMin: number
  totalCompMax: number
  source: string
  notes: string
}

export interface StrategyMilestone {
  month: string
  phase: string
  actionItems: string
  status: 'Not Started' | 'In Progress' | 'Complete'
}

export interface UserProfile {
  yearsExperience: string
  currentTitle: string
  designations: string[]
  education: string
  tools: string[]
  spendPortfolio: string
  languages: string[]
  locationPreference: string[]
  managementExperience: boolean
  minTotalComp: number
  targetTotalComp: string
}

export interface ScrapeResult {
  source: string
  jobs: ScrapedJob[]
  errors: string[]
}

export interface FilterState {
  filter: 'all' | 'new' | 'interested' | 'skipped'
  company: string | null
  minScore: number | null
}
