// ─── Shared calculation logic ─────────────────────────────────────────────────
// No 'use client' — imported by both components and API routes.

import type { FinancialInputs, Projection } from './types'

// ─── Sanity ceiling for ROI display ───────────────────────────────────────────
// Above this, a literal percentage stops being informative and starts
// destroying credibility (the pathological case prints figures like 4,772,507%).
// 10,000% (a 100× return) is well beyond any realistic AI business case, so
// crossing it reliably indicates an implausible input — chiefly an aiSystemCost
// that is near-zero relative to the value generated. Normal inputs (even a
// strong £20k-system-saves-£250k case at ~1,150%) stay comfortably below it.
export const ROI_SANITY_CEILING = 10_000

/** Parse a string field to a number; returns 0 for empty / invalid. */
export function n(v: string | undefined): number {
  const parsed = parseFloat(v ?? '')
  return isFinite(parsed) ? parsed : 0
}

/** Format a number as £X,XXX,XXX — no decimals. */
export function fmt(value: number): string {
  const abs  = Math.round(Math.abs(value))
  const sign = value < 0 ? '-' : ''
  return sign + '£' + abs.toLocaleString('en-GB')
}

/**
 * Remove the SROI caveat from the end of a Section 3 narrative.
 *
 * Claude is instructed to end Section 3 with the SROI caveat verbatim, and both
 * exports (PDF and HTML) also render it as a dedicated block (guaranteed full,
 * never abbreviated). That double-prints it. Stripping it from the narrative
 * leaves the dedicated block as the single source. Deterministic — cuts from
 * the caveat's opening phrase regardless of minor punctuation/whitespace
 * variation in the model output.
 */
export function stripSroiCaveat(section3: string): string {
  const marker = 'truecase sdg mapping is directional'
  const idx = section3.toLowerCase().lastIndexOf(marker)
  return idx === -1 ? section3.trim() : section3.slice(0, idx).trim()
}

/** Format break-even value as "X months", or "—". */
export function formatBreakEven(projection: Projection): string {
  const { breakEvenValue, breakEvenUnit } = projection
  return isFinite(breakEvenValue) && breakEvenValue > 0
    ? `${Math.ceil(breakEvenValue)} ${breakEvenUnit}`
    : '—'
}

// ─── Universal calculation ────────────────────────────────────────────────────
//
// Formula (all use cases):
//   projectedGain = currentCost × (efficiencyGain / 100)
//                 + fineExposure × (errorReduction / 100) × 0.3
//   systemCost    = aiSystemCost
//   costOfInaction = projectedGain
//   netGain        = projectedGain − systemCost
//   roiPercent     = (netGain / systemCost) × 100
//   breakEven      = systemCost / (projectedGain / 12)  → expressed in months
//
// Returns null when aiSystemCost is 0 (inputs not yet complete).

export function calculate(inputs: FinancialInputs): Projection | null {
  const currentCost    = inputs.currentAnnualCost
  const efficiencyGain = inputs.efficiencyGain
  const errorReduction = inputs.errorReduction
  const fineExposure   = inputs.fineExposure
  const aiCost         = inputs.aiSystemCost

  if (aiCost === 0) return null

  const projectedGain  =
    currentCost * (efficiencyGain / 100) +
    fineExposure * (errorReduction / 100) * 0.3

  const systemCost     = aiCost
  const costOfInaction = projectedGain
  const netGain        = projectedGain - systemCost
  const roiPercent     = (netGain / systemCost) * 100
  const breakEvenValue = projectedGain > 0
    ? systemCost / (projectedGain / 12)
    : 0

  // Backstop only — the numbers above are unchanged for every input. This flag
  // lets the UI/PDF show an honest advisory instead of a runaway literal when
  // a near-zero systemCost makes roiPercent explode.
  const roiExceedsRange = roiPercent > ROI_SANITY_CEILING

  return {
    projectedGain,
    costOfInaction,
    netGain,
    roiPercent,
    systemCost,
    breakEvenValue,
    breakEvenUnit: 'months',
    roiExceedsRange,
  }
}
