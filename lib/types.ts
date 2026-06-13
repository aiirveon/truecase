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
//
// Realised savings and avoided risk are kept as SEPARATE figures and are never
// blended. realisedSavings is money actually saved per year; riskReduction is a
// risk-adjusted hypothetical (avoided downside) shown alongside but never added
// into the headline benefit or into ROI. See docs/CALCULATION_METHODOLOGY.md.

export interface Projection {
  // Realised efficiency savings: currentAnnualCost × (efficiencyGain / 100).
  // Money actually saved per year. This is the only term used for ROI.
  realisedSavings: number
  // Avoided regulatory exposure: fineExposure × (errorReduction / 100) × 0.3.
  // Risk-adjusted, directional. NEVER added into ROI or net benefit.
  riskReduction: number
  // realisedSavings − systemCost. Risk reduction is deliberately NOT in this.
  netAnnualBenefit: number
  // (netAnnualBenefit / systemCost) × 100 — computed from realised savings only.
  roiPercent: number
  systemCost: number
  // Months to recover systemCost from realised savings alone (raw value;
  // format with formatBreakEven, which applies the "< 1 month" / "—" floors).
  breakEvenValue: number
  breakEvenUnit: string
  // True when roiPercent exceeds the sane ceiling — signals the UI/PDF to
  // present an honest advisory rather than a literal runaway figure. With the
  // fine term removed from ROI this should essentially never fire on sane
  // inputs; it remains as a secondary safety net for mis-entered system costs.
  roiExceedsRange: boolean
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
  // Realised efficiency savings — money actually saved per year.
  realisedSavings:    number
  // Avoided regulatory exposure — risk-adjusted hypothetical, NOT realised
  // income and NOT counted in ROI. Kept separate from realisedSavings.
  riskReduction:      number
  // realisedSavings − systemCost.
  netAnnualBenefit:   number
  // Reliability-adjusted net benefit (netAnnualBenefit × reliabilityScore/100).
  adjustedNetBenefit: number
  // (netAnnualBenefit / systemCost) × 100 — realised savings only.
  roiPercent:         number
  // True when roiPercent exceeds the sane ceiling. When set, the narrative
  // prompt must not cite a literal ROI/break-even figure.
  roiExceedsRange:    boolean
  breakEven:          string
  reliabilityScore:   number
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
