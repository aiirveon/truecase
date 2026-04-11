'use client'

import { useEffect, useState } from 'react'
import kb from '@/lib/governance-kb.json'
import type { ElementStatus, ElementSummary, GuidedAnswers } from '@/lib/types'

// ─── Internal row state ───────────────────────────────────────────────────────

interface RowState {
  status: ElementStatus
  context_note: string
}

interface GovernanceGateProps {
  onScoreChange: (score: number, count: number, elements: ElementSummary[]) => void
  q2Answer: string
  guidedAnswers?: GuidedAnswers
}

// ─── Typed kb element (includes new fields) ───────────────────────────────────

interface KbAnchor {
  regulation: string
  clause: string
  url: string
  plain_english: string
  sector_priority?: string[]
}

interface KbElement {
  element_id: string
  name: string
  plain_english: string
  why_it_matters: string
  what_confirmed_means?: string
  what_partial_means?: string
  what_missing_means?: string
  technical_standard?: string
  regulatory_anchors: KbAnchor[]
  consequence_if_missing: string
  consequence_if_partial: string
  not_applicable_note?: string
  reliability_reduction_missing: number
  reliability_reduction_partial: number
  applicable_to: string[]
  sectors: string[]
}

// ─── Score calculation — reads reductions from kb ─────────────────────────────

function calcScore(rows: RowState[]): number {
  let score = 100
  kb.elements.forEach((el, i) => {
    const { status } = rows[i]
    if (status === 'missing') score -= el.reliability_reduction_missing
    if (status === 'partial') score -= el.reliability_reduction_partial
  })
  return Math.max(0, score)
}

// ─── Score colour classes by band ────────────────────────────────────────────

function scoreTextClass(score: number): string {
  if (score >= 80) return 'text-score-high'
  if (score >= 50) return 'text-score-mid'
  return 'text-score-low'
}

// ─── Dot colour by status ─────────────────────────────────────────────────────

function dotClass(status: ElementStatus): string {
  switch (status) {
    case 'confirmed':      return 'bg-confirmed'
    case 'partial':        return 'bg-partial'
    case 'missing':        return 'bg-missing'
    case 'not_applicable': return 'bg-border'
  }
}

// ─── Abbreviated element names for breakdown pills ────────────────────────────

const ABBREV: Record<string, string> = {
  hard_output_cap:            'Output Limit',
  human_override:             'Human Review',
  explainability:             'Audit Trail',
  regulation_identified:      'Compliance Map',
  training_data_documented:   'Performance Docs',
  personalisation_boundary:   'Data Boundary',
}

// ─── Shared toggle class strings ──────────────────────────────────────────────

const toggleBase =
  'px-3 py-1 text-xs font-medium rounded border transition-colors duration-150 ' +
  'focus:outline-none focus:ring-0'

const toggleActive   = 'bg-brand border-brand text-white'
const toggleInactive =
  'bg-surface border-border text-foreground-muted hover:border-border-strong'

// ─── Default row state ────────────────────────────────────────────────────────

const DEFAULT_ROWS: RowState[] = kb.elements.map(() => ({
  status: 'missing' as ElementStatus,
  context_note: '',
}))

// ─── Chevron icon ─────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-4 h-4 text-foreground-subtle flex-shrink-0 transition-transform duration-200 ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

// ─── Status indicator (collapsed row) ────────────────────────────────────────

function StatusIndicator({ status }: { status: ElementStatus }) {
  const label =
    status === 'confirmed'      ? 'Confirmed'
    : status === 'partial'      ? 'Partial'
    : status === 'not_applicable' ? 'Not applicable'
    : 'Not confirmed'

  return (
    <span className="flex items-center gap-1 text-xs text-foreground-muted">
      <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${dotClass(status)}`} />
      {label}
    </span>
  )
}

// ─── Sort anchors: sector-specific first, then "all", then rest ───────────────

function sortAnchors(anchors: KbAnchor[], q4?: string): KbAnchor[] {
  return anchors.slice().sort((a, b) => {
    const aMatch = q4 && a.sector_priority?.includes(q4) ? 0
      : a.sector_priority?.includes('all') ? 1
      : 2
    const bMatch = q4 && b.sector_priority?.includes(q4) ? 0
      : b.sector_priority?.includes('all') ? 1
      : 2
    return aMatch - bMatch
  })
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GovernanceGate({ onScoreChange, q2Answer, guidedAnswers }: GovernanceGateProps) {
  const [rows, setRows]           = useState<RowState[]>(DEFAULT_ROWS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Derive q2 from guidedAnswers if available, fall back to q2Answer prop
  const q2 = guidedAnswers?.q2 ?? q2Answer

  // Auto-confirm Element 6 when q2 indicates no individual personal data
  useEffect(() => {
    setRows((prev) => {
      const next = [...prev]
      if (q2 && q2 !== 'personal') {
        next[5] = { ...next[5], status: 'not_applicable' }
      } else if (prev[5].status === 'not_applicable') {
        next[5] = { ...next[5], status: 'missing' }
      }
      return next
    })
  }, [q2])

  // Notify parent whenever rows change
  useEffect(() => {
    const score = calcScore(rows)
    const confirmedCount = rows.filter(
      (row) => row.status === 'confirmed' || row.status === 'not_applicable',
    ).length
    const elements: ElementSummary[] = rows.map((row, i) => {
      const el = kb.elements[i]
      return {
        element_id: el.element_id,
        name: el.name,
        status: row.status,
        consequence:
          row.status === 'partial' ? el.consequence_if_partial : el.consequence_if_missing,
        regulatory_anchors: el.regulatory_anchors.map((a) => ({
          regulation: a.regulation,
          clause: a.clause,
          url: a.url,
        })),
        context_note: row.context_note,
      }
    })
    onScoreChange(score, confirmedCount, elements)
  }, [rows, onScoreChange])

  function handleStatusChange(index: number, status: ElementStatus) {
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], status }
      return next
    })
    // Auto-expand on missing or partial
    if (status === 'missing' || status === 'partial') {
      setExpandedId(kb.elements[index].element_id)
    }
  }

  function handleContextChange(index: number, note: string) {
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], context_note: note }
      return next
    })
  }

  function toggleExpanded(elementId: string) {
    setExpandedId((prev) => (prev === elementId ? null : elementId))
  }

  const score = calcScore(rows)
  const confirmedCount = rows.filter(
    (row) => row.status === 'confirmed' || row.status === 'not_applicable',
  ).length

  return (
    <section className="space-y-5">

      {/* Section heading */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        Governance Assessment
      </h2>

      {/* Six element rows — accordion */}
      <div>
        {(kb.elements as KbElement[]).map((el, i) => {
          const row            = rows[i]
          const isOpen         = expandedId === el.element_id
          const isNotApplicable = row.status === 'not_applicable'
          const showConsequence =
            !isNotApplicable &&
            (row.status === 'missing' || row.status === 'partial')
          const consequence =
            row.status === 'partial' ? el.consequence_if_partial : el.consequence_if_missing
          const notApplicableNote = el.not_applicable_note

          // Decision guidance text for current status
          const guidanceText =
            row.status === 'confirmed'  ? el.what_confirmed_means
            : row.status === 'partial'  ? el.what_partial_means
            : row.status === 'missing'  ? el.what_missing_means
            : undefined

          // Sort anchors by sector relevance and take top 2
          const sortedAnchors = sortAnchors(el.regulatory_anchors, guidedAnswers?.q4).slice(0, 2)

          return (
            <div key={el.element_id}>
              {/* ── Collapsed row — always visible ── */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpanded(el.element_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleExpanded(el.element_id)
                  }
                }}
                className={`flex items-center justify-between px-0 py-4 cursor-pointer
                  border-t border-border hover:bg-surface transition-colors
                  ${i === 0 ? 'border-t-0' : ''}`}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-base font-semibold text-foreground">
                    {i + 1}. {el.name}
                  </span>
                  <StatusIndicator status={row.status} />
                </div>
                <Chevron open={isOpen} />
              </div>

              {/* ── Expanded content ── */}
              {isOpen && (
                <div className="border-t border-border bg-surface px-4 py-5">

                  {/* Plain English question */}
                  <p className="text-sm text-foreground-muted mt-0 mb-3 leading-relaxed">
                    {el.plain_english}
                  </p>

                  {/* Decision guidance block — shown when not_applicable */}
                  {!isNotApplicable && guidanceText && (
                    <>
                      {row.status === 'confirmed' && (
                        <p className="text-xs text-confirmed bg-confirmed-bg px-3 py-2 rounded mb-3">
                          ✓ {guidanceText}
                        </p>
                      )}
                      {row.status === 'partial' && (
                        <p className="text-xs text-partial bg-partial-bg px-3 py-2 rounded mb-3">
                          ⚠ {guidanceText}
                        </p>
                      )}
                      {row.status === 'missing' && (
                        <p className="text-xs text-missing bg-missing-bg px-3 py-2 rounded mb-3">
                          ✗ {guidanceText}
                        </p>
                      )}
                    </>
                  )}

                  {/* Technical standard — explainability element only */}
                  {!isNotApplicable && el.technical_standard && (
                    <p className="text-xs text-foreground-subtle italic mt-1 mb-3">
                      {el.technical_standard}
                    </p>
                  )}

                  {/* Three-state toggle buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(['confirmed', 'partial', 'missing'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={isNotApplicable}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(i, s)
                        }}
                        className={`${toggleBase} ${
                          !isNotApplicable && row.status === s ? toggleActive : toggleInactive
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {s === 'confirmed' ? 'Confirmed'
                          : s === 'partial' ? 'Partial'
                          : 'Not Confirmed'}
                      </button>
                    ))}
                  </div>

                  {/* Not-applicable note */}
                  {isNotApplicable && notApplicableNote && (
                    <p className="mb-3 text-xs text-confirmed">
                      {notApplicableNote}
                    </p>
                  )}

                  {/* Consequence text + sector-sorted regulatory citations */}
                  {showConsequence && (
                    <div className="mb-3">
                      <p className="text-xs text-missing leading-relaxed mb-1">
                        {consequence}
                      </p>
                      <div className="flex flex-wrap">
                        {sortedAnchors.map((anchor, ai) => (
                          <a
                            key={ai}
                            href={anchor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-brand
                              hover:text-brand-hover underline underline-offset-2 mr-3 mb-1"
                          >
                            {anchor.regulation}, {anchor.clause} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Context note — always visible */}
                  <div>
                    <label className="block text-xs text-foreground-subtle mb-1">
                      Add context (optional)
                    </label>
                    <input
                      type="text"
                      value={row.context_note}
                      onChange={(e) => handleContextChange(i, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="e.g. We use SHAP for explainability, reviewed by legal in March 2026"
                      className="text-xs border border-border px-2 py-1 w-full bg-background
                                 focus:border-brand focus:outline-none rounded"
                    />
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Reliability score — redesigned clean layout ── */}
      <div className="mb-6">

        {/* Section label */}
        <p className="text-xs uppercase tracking-widest text-foreground-subtle mb-3">
          GOVERNANCE ASSESSMENT
        </p>

        {/* Score row */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className={`font-mono text-6xl font-bold ${scoreTextClass(score)}`}>
            {score}
          </span>
          <span className="text-lg text-foreground-muted">
            % reliability
          </span>
        </div>

        {/* Confirmed count */}
        <p className="text-sm text-foreground-muted mb-4">
          {confirmedCount} of 6 governance elements confirmed
        </p>

        {/* Score breakdown pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {kb.elements.map((el, i) => {
            const row = rows[i]
            return (
              <span
                key={el.element_id}
                className="flex items-center gap-1.5 px-2.5 py-1 border border-border
                  rounded-full text-xs text-foreground-muted bg-background"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass(row.status)}`} />
                {ABBREV[el.element_id] ?? el.name}
              </span>
            )
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-4" />

        {/* Self-assessment note */}
        <p className="text-xs text-foreground-subtle italic mb-6">
          Self-reported · TrueCase cannot verify these answers
        </p>

      </div>

    </section>
  )
}
