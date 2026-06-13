// ─── Shared calculation logic ─────────────────────────────────────────────────
// No 'use client' — imported by both components and API routes.

import type { FinancialInputs, Projection } from './types'

// ─── Sanity ceiling for ROI display ───────────────────────────────────────────
// Secondary safety net only. ROI is now computed from REALISED savings vs system
// cost alone (the hypothetical fine term was removed from ROI — see calculate()
// and docs/CALCULATION_METHODOLOGY.md), so the old runaway path that produced
// figures like 1,350,980% can no longer occur from fine exposure. What remains
// is the ordinary failure mode of a mis-entered (too-low) system cost.
//
// Choosing the ceiling: realised-only ROI is bounded by realisedSavings/systemCost.
// Because efficiencyGain is capped at 100%, realisedSavings ≤ currentAnnualCost,
// so even genuinely strong automation (high efficiency, low-cost tool) can
// legitimately reach ~1,000–1,600% ROI (e.g. 50% efficiency on a £1M process
// against a £30k system ≈ 1,567%). A 500% ceiling would therefore false-positive
// on real, defensible cases — and since this flag now also disables the Generate
// button, a false positive blocks a legitimate report.
//
// 2,000% (net benefit > 20× the system cost ⇒ system cost under ~5% of realised
// savings) sits above realistic strong cases but below the absurd, so it reliably
// indicates a data-entry error rather than a real business case. It is far below
// the old 10,000% precisely because the explosive blended term is gone.
export const ROI_SANITY_CEILING = 2_000

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

/**
 * Format break-even for display.
 *  - realisedSavings ≤ 0 (no realised savings to recover the cost) → "—"
 *  - under one month → "< 1 month" (never show a misleading "0 months")
 *  - otherwise → "X months" (rounded up)
 *
 * Break-even is measured against REALISED savings only — recovering a system
 * cost from a hypothetical avoided fine is not a real payback period.
 */
export function formatBreakEven(projection: Projection): string {
  const { breakEvenValue, breakEvenUnit } = projection
  if (!isFinite(breakEvenValue) || breakEvenValue <= 0) return '—'
  if (breakEvenValue < 1) return '< 1 month'
  return `${Math.ceil(breakEvenValue)} ${breakEvenUnit}`
}

// ─── Universal calculation ────────────────────────────────────────────────────
//
// Realised savings and avoided risk are computed and reported SEPARATELY. They
// are never summed into a single headline figure, and only realised savings
// feed ROI and break-even. See docs/CALCULATION_METHODOLOGY.md for the rationale.
//
// Formula (all use cases):
//   realisedSavings  = currentAnnualCost × (efficiencyGain / 100)   ← money saved
//   riskReduction    = fineExposure × (errorReduction / 100) × 0.3  ← avoided risk
//   systemCost       = aiSystemCost
//   netAnnualBenefit = realisedSavings − systemCost   (risk reduction NOT added)
//   roiPercent       = (netAnnualBenefit / systemCost) × 100   (realised only)
//   breakEvenValue   = systemCost / (realisedSavings / 12)  → months (realised only)
//
// Because the hypothetical fine term is excluded from netAnnualBenefit and ROI,
// a large fineExposure can no longer dominate the gain or explode ROI/break-even.
//
// Returns null when aiSystemCost is 0 (inputs not yet complete).

export function calculate(inputs: FinancialInputs): Projection | null {
  const currentCost    = inputs.currentAnnualCost
  const efficiencyGain = inputs.efficiencyGain
  const errorReduction = inputs.errorReduction
  const fineExposure   = inputs.fineExposure
  const aiCost         = inputs.aiSystemCost

  if (aiCost === 0) return null

  // Realised efficiency savings — money actually saved per year.
  const realisedSavings = currentCost * (efficiencyGain / 100)

  // Avoided regulatory exposure — risk-adjusted hypothetical, shown separately
  // and deliberately excluded from net benefit and ROI. The 0.3 coefficient is
  // a directional, non-actuarial assumption (see methodology doc).
  const riskReduction = fineExposure * (errorReduction / 100) * 0.3

  const systemCost       = aiCost
  const netAnnualBenefit = realisedSavings - systemCost
  const roiPercent       = (netAnnualBenefit / systemCost) * 100
  const breakEvenValue   = realisedSavings > 0
    ? systemCost / (realisedSavings / 12)
    : 0

  // Secondary safety net only — with the fine term gone from ROI this should
  // essentially never fire on sane inputs. It still catches a mis-entered
  // (too-low) system cost that makes realised-only ROI implausibly large.
  const roiExceedsRange = roiPercent > ROI_SANITY_CEILING

  return {
    realisedSavings,
    riskReduction,
    netAnnualBenefit,
    roiPercent,
    systemCost,
    breakEvenValue,
    breakEvenUnit: 'months',
    roiExceedsRange,
  }
}
