'use client'

import { calculate, fmt, formatBreakEven } from '@/lib/calculations'
import type { FinancialInputs } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectionCardsProps {
  financialInputs: FinancialInputs
  reliabilityScore: number
  confirmedCount:   number
}

// ─── Score band class maps (full static strings required for Tailwind JIT) ────

type ScoreBand = 'high' | 'mid' | 'low'

function scoreBand(score: number): ScoreBand {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

const bandText: Record<ScoreBand, string> = {
  high: 'text-score-high',
  mid:  'text-score-mid',
  low:  'text-score-low',
}
const bandBg: Record<ScoreBand, string> = {
  high: 'bg-score-high-bg',
  mid:  'bg-score-mid-bg',
  low:  'bg-score-low-bg',
}
const bandBorder: Record<ScoreBand, string> = {
  high: 'border-score-high',
  mid:  'border-score-mid',
  low:  'border-score-low',
}

// ─── Sub-component: single output card ───────────────────────────────────────

interface CardProps {
  label:          string
  value:          string
  valueClass?:    string
  sublabel?:      string
  footnote?:      string
  footnote2?:     string
  coloredBg?:     string
  coloredBorder?: string
}

function OutputCard({
  label,
  value,
  valueClass = 'font-mono text-2xl text-foreground',
  sublabel,
  footnote,
  footnote2,
  coloredBg,
  coloredBorder,
}: CardProps) {
  const bgClass     = coloredBg     ?? 'bg-surface-raised'
  const borderClass = coloredBorder ?? 'border-border'

  return (
    <div
      className={
        `rounded border p-5 flex flex-col justify-between min-h-[120px] ` +
        `${bgClass} ${borderClass}`
      }
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {label}
        </p>
        <p className={`mt-2 tabular-nums ${valueClass}`}>{value}</p>
        {sublabel && (
          <p className="mt-1 text-xs text-foreground-subtle">{sublabel}</p>
        )}
      </div>
      {footnote && (
        <p className="mt-3 text-xs text-foreground-muted">{footnote}</p>
      )}
      {footnote2 && (
        <p className="mt-1 text-xs text-foreground-subtle">{footnote2}</p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectionCards({
  financialInputs,
  reliabilityScore,
  confirmedCount,
}: ProjectionCardsProps) {
  const projection = calculate(financialInputs)

  // Should not be reached — parent only renders after allFilled, but guard anyway
  if (!projection) {
    return (
      <section className="rounded border border-border bg-surface p-10 text-center">
        <p className="text-sm text-foreground-muted">
          Complete the inputs above to see your projection.
        </p>
      </section>
    )
  }

  const { projectedGain, costOfInaction, netGain, roiPercent } = projection

  // ── Reliability-adjusted figures ──
  const factor        = reliabilityScore / 100
  const adjustedGain  = projectedGain * factor
  const governanceGap = projectedGain - adjustedGain

  // ── Break-even display ──
  const breakEvenDisplay = formatBreakEven(projection)

  // ── Score band classes ──
  const band     = scoreBand(reliabilityScore)
  const scText   = bandText[band]
  const scBg     = bandBg[band]
  const scBorder = bandBorder[band]

  return (
    <section className="space-y-6">

      {/* ── Reliability score badge ──────────────────────────── */}
      <div className={`flex items-center gap-5 rounded border p-5 ${scBg} ${scBorder}`}>
        <p className={`font-mono text-4xl font-bold tabular-nums ${scText}`}>
          {reliabilityScore}%
        </p>
        <div>
          <p className={`text-sm font-semibold ${scText}`}>
            Reliability Score
          </p>
          <p className="text-xs text-foreground-muted">
            {confirmedCount} of 6 governance elements confirmed
          </p>
        </div>
      </div>

      {/* ── Output cards — 2 × 3 grid ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Card 1 — Projected Annual Gain */}
        <OutputCard
          label="Projected Annual Gain"
          value={fmt(projectedGain)}
          valueClass="font-mono text-3xl font-bold text-foreground"
          footnote={`${fmt(governanceGap)} governance gap`}
          footnote2={`Based on ${confirmedCount} of 6 governance elements confirmed`}
        />

        {/* Card 2 — Reliability-Adjusted Gain (same dimensions, coloured) */}
        <OutputCard
          label="Reliability-Adjusted Gain"
          value={fmt(adjustedGain)}
          valueClass={`font-mono text-3xl font-bold ${scText}`}
          sublabel={`At ${reliabilityScore}% reliability`}
          coloredBg={scBg}
          coloredBorder={scBorder}
        />

        {/* Card 3 — Cost of Inaction */}
        <OutputCard
          label="Annual Cost of Inaction"
          value={fmt(costOfInaction)}
          valueClass="font-mono text-2xl text-foreground"
          sublabel={
            financialInputs.fineExposure > 0
              ? `Includes ${fmt(financialInputs.fineExposure)} regulatory exposure`
              : 'Revenue lost without AI'
          }
        />

        {/* Card 4 — Net Annual Gain */}
        <OutputCard
          label="Net Annual Gain After System Cost"
          value={fmt(netGain)}
          valueClass={`font-mono text-2xl ${netGain < 0 ? 'text-destructive' : 'text-foreground'}`}
        />

        {/* Card 5 — ROI % */}
        <OutputCard
          label="Return on Investment"
          value={`${roiPercent >= 0 ? '+' : ''}${Math.round(roiPercent).toLocaleString('en-GB')}%`}
          valueClass="font-mono text-2xl text-brand"
        />

        {/* Card 6 — Break-Even Point */}
        <OutputCard
          label="Break-Even Point"
          value={breakEvenDisplay}
          valueClass="font-mono text-2xl text-foreground"
        />

      </div>
    </section>
  )
}
