// ─── Shared types used across client components, server routes, and lib ───────
// This file must not contain 'use client' — it is imported by API routes.

// ─── Guided input answer types ────────────────────────────────────────────────

export type Q1Answer = 'individuals' | 'organisations' | 'internal' | 'automation'
export type Q2Answer = 'personal' | 'aggregated' | 'operational' | 'public'
export type Q3Answer = 'under100' | 'hundreds' | 'tens_of_thousands' | 'unknown'
export type Q4Answer =
  | 'financial_services'
  | 'media_broadcasting'
  | 'healthcare'
  | 'retail_ecommerce_ticketing'
  | 'real_estate'
  | 'recruitment_employment'
  | 'public_sector'
  | 'technology_platform'
  | 'other'

export interface GuidedAnswers {
  q1: Q1Answer
  q2: Q2Answer
  q3: Q3Answer
  q4: Q4Answer
}

// ─── Typed financial inputs (replaces Record<string, string>) ─────────────────

export interface FinancialInputs {
  currentAnnualCost: number
  efficiencyGain:    number
  errorReduction:    number
  fineExposure:      number
  aiSystemCost:      number
  contextNote:       string
}

// ─── Projection output ────────────────────────────────────────────────────────

export interface Projection {
  projectedGain: number
  costOfInaction: number
  netGain: number
  roiPercent: number
  systemCost: number
  breakEvenValue: number
  breakEvenUnit: string
}

export type ElementStatus = 'confirmed' | 'partial' | 'missing' | 'not_applicable'

export type ElementSummary = {
  element_id: string
  name: string
  status: ElementStatus
  consequence: string
  regulatory_anchors: {
    regulation: string
    clause: string
    url: string
  }[]
  context_note: string
}

// Kept for PDF API route (not yet rebuilt)
export interface GovernanceElementSummary {
  name: string
  status: 'confirmed' | 'partial' | 'missing' | 'not-applicable'
  warning: string
}

export interface SDGItem {
  number: number
  name: string
  primary: boolean
}

export interface NarrativeResult {
  section1: string
  section2: string
  section3: string
}

export interface GenerateRequest {
  useCase:           string
  financialInputs:   FinancialInputs
  guidedAnswers?:    GuidedAnswers
  governanceElements: GovernanceElementSummary[]
  reliabilityScore:  number
  sdgMapping:        SDGItem[]
  projectedGain:     number
  adjustedGain:      number
  netGain:           number
  breakEven:         string
}

// ─── Generate-narrative route request (v2) ────────────────────────────────────

export interface FinancialOutputs {
  projectedGain:    number
  adjustedGain:     number
  netGain:          number
  roiPercent:       number
  breakEven:        string
  reliabilityScore: number
}

export interface ReliabilityBreakdownItem {
  elementName: string
  status:      ElementStatus
  reduction:   number
}

export interface GenerateNarrativeRequest {
  financialInputs:          FinancialInputs
  financialOutputs:         FinancialOutputs
  governanceElements:       ElementSummary[]
  reliabilityScore:         number
  reliabilityScoreBreakdown: ReliabilityBreakdownItem[]
  guidedAnswers:            GuidedAnswers
  knowledgeBaseEntries:     object[]
  benchmarkEntries:         object
  contextNote:              string
}
