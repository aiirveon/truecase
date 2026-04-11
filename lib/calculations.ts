// ─── Shared calculation logic ─────────────────────────────────────────────────
// No 'use client' — imported by both components and API routes.

import type { FinancialInputs, Projection } from './types'

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

  return {
    projectedGain,
    costOfInaction,
    netGain,
    roiPercent,
    systemCost,
    breakEvenValue,
    breakEvenUnit: 'months',
  }
}
