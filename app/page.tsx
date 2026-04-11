'use client'

import { Suspense, useCallback, useState } from 'react'
import GuidedInput from '@/components/GuidedInput'
import GovernanceGate from '@/components/GovernanceGate'
import ProjectionCards from '@/components/ProjectionCards'
import NarrativeDisplay from '@/components/NarrativeDisplay'
import { calculate, formatBreakEven } from '@/lib/calculations'
import kb from '@/lib/governance-kb.json'
import benchmarks from '@/lib/benchmarks.json'
import type {
  FinancialInputs,
  GuidedAnswers,
  ElementSummary,
  NarrativeResult,
  ReliabilityBreakdownItem,
} from '@/lib/types'

export default function Home() {

  // ── Page-level state ──────────────────────────────────────────────────────
  const [reliabilityScore,    setReliabilityScore]    = useState(0)
  const [confirmedCount,      setConfirmedCount]      = useState(0)
  const [governanceElements,  setGovernanceElements]  = useState<ElementSummary[]>([])
  const [financialInputs,     setFinancialInputs]     = useState<FinancialInputs | null>(null)
  const [guidedAnswers,       setGuidedAnswers]       = useState<GuidedAnswers | null>(null)

  // Controls whether projection cards are visible — only shown after
  // the user explicitly clicks Calculate ROI in GuidedInput
  const [hasCalculated,       setHasCalculated]       = useState(false)

  const [narrative,           setNarrative]           = useState<NarrativeResult | null>(null)
  const [isGenerating,        setIsGenerating]        = useState(false)
  const [narrativeError,      setNarrativeError]      = useState<string | null>(null)
  const [isExportingPDF,      setIsExportingPDF]      = useState(false)

  // ── Stable callbacks ──────────────────────────────────────────────────────
  const handleInputsComplete = useCallback(
    (inputs: FinancialInputs, answers: GuidedAnswers) => {
      setFinancialInputs(inputs)
      setGuidedAnswers(answers)
      setHasCalculated(true)
    },
    [],
  )

  const handleScoreChange = useCallback(
    (score: number, count: number, elements: ElementSummary[]) => {
      setReliabilityScore(score)
      setConfirmedCount(count)
      setGovernanceElements(elements)
    },
    [],
  )

  // ── Derived state ─────────────────────────────────────────────────────────
  const projection  = financialInputs ? calculate(financialInputs) : null
  const canGenerate = hasCalculated && projection !== null && !isGenerating

  // ── Derive a safe filename slug from the context note ────────────────────
  function descriptionSlug(): string {
    const desc = financialInputs?.contextNote ?? ''
    return desc.trim()
      ? desc.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)
      : 'truecase'
  }

  // ── Generate business case ────────────────────────────────────────────────
  async function handleGenerate() {
    if (!projection || !guidedAnswers) return

    const adjustedGain = projection.projectedGain * (reliabilityScore / 100)

    // Build score breakdown from current element statuses + KB reductions
    const reliabilityScoreBreakdown: ReliabilityBreakdownItem[] =
      governanceElements.map((el, i) => {
        const kbEl = kb.elements[i]
        const reduction =
          el.status === 'missing' ? kbEl.reliability_reduction_missing
          : el.status === 'partial' ? kbEl.reliability_reduction_partial
          : 0
        return { elementName: el.name, status: el.status, reduction }
      })

    // Pass full KB — Claude uses only what is relevant
    const knowledgeBaseEntries = kb.elements

    // Filter benchmarks to sector + general
    const sector = guidedAnswers.q4
    const benchmarkEntries = {
      fine_exposure: (benchmarks.fine_exposure as Record<string, unknown>).sectors
        ? Object.fromEntries(
            Object.entries(
              (benchmarks.fine_exposure as { sectors: Record<string, unknown> }).sectors
            ).filter(([k]) => k === sector || k === 'general')
          )
        : {},
      efficiency_gain: benchmarks.efficiency_gain,
      error_reduction: benchmarks.error_reduction,
    }

    setIsGenerating(true)
    setNarrativeError(null)
    setNarrative(null)

    try {
      const res = await fetch('/api/generate-narrative', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialInputs,
          financialOutputs: {
            projectedGain:    projection.projectedGain,
            adjustedGain,
            netGain:          projection.netGain,
            roiPercent:       projection.roiPercent,
            breakEven:        formatBreakEven(projection),
            reliabilityScore,
          },
          governanceElements,
          reliabilityScore,
          reliabilityScoreBreakdown,
          guidedAnswers,
          knowledgeBaseEntries,
          benchmarkEntries,
          contextNote: financialInputs?.contextNote || '',
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setNarrativeError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setNarrative(data as NarrativeResult)
      }
    } catch {
      setNarrativeError('Network error. Please check your connection and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Download PDF ──────────────────────────────────────────────────────────
  async function handleDownloadPDF() {
    if (!narrative || !projection) return

    const adjustedGain   = projection.projectedGain * (reliabilityScore / 100)
    const generationDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    // Build score breakdown for PDF page 2
    const reliabilityScoreBreakdown: ReliabilityBreakdownItem[] =
      governanceElements.map((el, i) => {
        const kbEl = kb.elements[i]
        const reduction =
          el.status === 'missing' ? kbEl.reliability_reduction_missing
          : el.status === 'partial' ? kbEl.reliability_reduction_partial
          : 0
        return { elementName: el.name, status: el.status, reduction }
      })

    setIsExportingPDF(true)

    try {
      const res = await fetch('/api/generate-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section1:                  narrative.section1,
          section2:                  narrative.section2,
          section3:                  narrative.section3,
          financialOutputs: {
            projectedGain:  projection.projectedGain,
            adjustedGain,
            costOfInaction: projection.costOfInaction,
            netGain:        projection.netGain,
            roiPercent:     projection.roiPercent,
            breakEven:      formatBreakEven(projection),
          },
          governanceElements,
          reliabilityScore,
          reliabilityScoreBreakdown,
          confirmedCount,
          useCase:          financialInputs?.contextNote || 'custom',
          generationDate,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setNarrativeError(data.error ?? 'Failed to generate PDF.')
        return
      }

      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      const safeDate = generationDate.replace(/[^0-9]+/g, '-')
      a.href         = url
      a.download     = `truecase-${descriptionSlug()}-${safeDate}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setNarrativeError('Network error generating PDF. Please try again.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  // ── Export HTML ───────────────────────────────────────────────────────────
  function handleExportHTML() {
    if (!narrative || !projection) return

    const adjustedGain   = projection.projectedGain * (reliabilityScore / 100)
    const generationDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    const html = buildHTMLReport({
      narrative,
      projection,
      adjustedGain,
      reliabilityScore,
      confirmedCount,
      governanceElements,
      useCaseDescription: financialInputs?.contextNote || 'Custom AI System',
      generationDate,
    })

    const blob     = new Blob([html], { type: 'text/html' })
    const url      = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    const safeDate = generationDate.replace(/[^0-9]+/g, '-')
    a.href         = url
    a.download     = `truecase-${descriptionSlug()}-${safeDate}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-20 space-y-16">

        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            TrueCase
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Build business cases you can actually trust.
          </p>
        </div>

        {/* ── Layer 1: Guided input (4 questions + summary + financial inputs) */}
        <Suspense fallback={null}>
          <GuidedInput onInputsComplete={handleInputsComplete} />
        </Suspense>

        {/* ── Layer 2: Governance gate ────────────────────────── */}
        <GovernanceGate onScoreChange={handleScoreChange} q2Answer={guidedAnswers?.q2 ?? ''} />

        {/* ── Layer 3: Projection output cards ───────────────── */}
        {/* Only rendered after the user clicks Calculate ROI */}
        {hasCalculated && financialInputs && (
          <div>
            <ProjectionCards
              financialInputs={financialInputs}
              reliabilityScore={reliabilityScore}
              confirmedCount={confirmedCount}
            />
          </div>
        )}

        {/* ── Layer 4: Generate business case ────────────────── */}
        <div className="space-y-4">

          {/* Grounding disclosure — shown above the generate button */}
          <p className="text-xs text-foreground-muted leading-relaxed">
            This business case will be generated by Claude (Anthropic) using your financial
            inputs and the TrueCase regulatory knowledge base (v1.0, verified April 2026).
            Financial figures are calculated from your inputs. Regulatory references come
            from the knowledge base. Claude does not add claims beyond these sources.
            TrueCase stores nothing.
          </p>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full rounded bg-brand px-6 py-3 text-sm font-medium
                       text-white transition-colors duration-150
                       hover:bg-brand-hover
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? 'Building your business case...' : 'Generate Business Case'}
          </button>
        </div>

        {/* ── Narrative output + export buttons ───────────────── */}
        <NarrativeDisplay
          section1={narrative?.section1  ?? ''}
          section2={narrative?.section2  ?? ''}
          section3={narrative?.section3  ?? ''}
          isLoading={isGenerating}
          error={narrativeError}
          onDownloadPDF={narrative ? handleDownloadPDF : undefined}
          onExportHTML={narrative ? handleExportHTML : undefined}
          isExportingPDF={isExportingPDF}
        />

      </div>
    </main>
  )
}

// ─── HTML report builder ──────────────────────────────────────────────────────

interface HTMLReportOptions {
  narrative:           NarrativeResult
  projection:          NonNullable<ReturnType<typeof calculate>>
  adjustedGain:        number
  reliabilityScore:    number
  confirmedCount:      number
  governanceElements:  ElementSummary[]
  useCaseDescription:  string
  generationDate:      string
}

function fmtGBP(value: number): string {
  return '£' + Math.round(Math.abs(value)).toLocaleString('en-GB')
}

function scoreColor(score: number): string {
  if (score >= 80) return '#16A34A'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

function statusLabel(status: string): string {
  switch (status) {
    case 'confirmed':      return 'Confirmed'
    case 'partial':        return 'Partially Confirmed'
    case 'missing':        return 'Not Confirmed'
    case 'not_applicable': return 'N/A'
    default:               return status
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'confirmed':      return '#16A34A'
    case 'partial':        return '#D97706'
    case 'missing':        return '#DC2626'
    case 'not_applicable': return '#6B7280'
    default:               return '#111827'
  }
}

function statusBgColor(status: string): string {
  switch (status) {
    case 'confirmed':      return '#F0FDF4'
    case 'partial':        return '#FFFBEB'
    case 'missing':        return '#FEF2F2'
    case 'not_applicable': return '#F9FAFB'
    default:               return '#FFFFFF'
  }
}

function buildHTMLReport({
  narrative,
  projection,
  adjustedGain,
  reliabilityScore,
  confirmedCount,
  governanceElements,
  useCaseDescription,
  generationDate,
}: HTMLReportOptions): string {

  const sc      = scoreColor(reliabilityScore)
  const scBgHex = reliabilityScore >= 80 ? '#F0FDF4'
                : reliabilityScore >= 50 ? '#FFFBEB'
                : '#FEF2F2'

  const govRows = governanceElements.map(el => {
    const anchor      = el.regulatory_anchors?.[0] ?? null
    const anchorHtml  = anchor
      ? `<a href="${anchor.url}" target="_blank" rel="noopener noreferrer"
            style="color:#1D4ED8;text-decoration:none;font-size:13px">
           ${anchor.regulation}, ${anchor.clause}
         </a>`
      : '—'
    const consequence = el.status === 'missing' || el.status === 'partial'
      ? el.consequence : ''
    const contextNote = el.context_note ?? ''
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:14px">${el.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB">
          <span style="background:${statusBgColor(el.status)};color:${statusColor(el.status)};padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap;font-weight:600">
            ${statusLabel(el.status)}
          </span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px">${anchorHtml}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#6B7280">${consequence}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#6B7280">${contextNote}</td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TrueCase — ${generationDate}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      background: #FFFFFF;
      color: #111827;
      line-height: 1.6;
      padding: 48px 24px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 16px;
      margin-bottom: 40px;
    }
    .wordmark { font-size: 16px; font-weight: 700; letter-spacing: 0.1em; }
    .kb-note { font-size: 12px; color: #6B7280; margin-top: 4px; }
    .date { font-size: 13px; color: #6B7280; }
    .section { margin-bottom: 48px; }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6B7280;
      margin-bottom: 12px;
    }
    .section-body { font-size: 14px; color: #111827; white-space: pre-wrap; }
    .card-row { display: flex; gap: 16px; margin: 20px 0 12px; }
    .card {
      flex: 1;
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
      padding: 16px;
      border-radius: 6px;
    }
    .card-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6B7280;
      margin-bottom: 8px;
    }
    .card-value { font-size: 28px; font-family: 'Courier New', Courier, monospace; font-weight: 700; }
    .card-note { font-size: 12px; color: #6B7280; margin-top: 4px; }
    .break-even { font-size: 13px; color: #6B7280; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; }
    thead { background: #F9FAFB; }
    th {
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6B7280;
      border-bottom: 1px solid #E5E7EB;
    }
    .reliability-box {
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0 12px;
    }
    .reliability-score { font-size: 36px; font-family: 'Courier New', Courier, monospace; font-weight: 700; }
    .reliability-label { font-size: 15px; font-weight: 700; }
    .reliability-sub { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .self-note { font-size: 12px; color: #6B7280; font-style: italic; margin-top: 8px; }
    .sroi-box {
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
      padding: 16px;
      border-radius: 6px;
      margin-top: 16px;
    }
    .sroi-text { font-size: 13px; color: #6B7280; font-style: italic; line-height: 1.6; }
    .footer { border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 64px; }
    .footer-main { font-size: 12px; color: #6B7280; margin-bottom: 6px; }
    .footer-disclaimer { font-size: 11px; color: #9CA3AF; line-height: 1.5; }
    .ai-note { font-size: 12px; color: #9CA3AF; margin-top: 20px; font-style: italic; }
    @media (max-width: 600px) {
      .card-row { flex-direction: column; }
      .header { flex-direction: column; align-items: flex-start; gap: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <div>
        <span class="wordmark">TRUECASE</span>
        <p class="kb-note">Generated using TrueCase knowledge base v1.0 (verified April 2026).</p>
      </div>
      <span class="date">${generationDate}</span>
    </div>

    <div class="section">
      <p class="section-label">Business Case Summary</p>
      <p class="section-body">${narrative.section1}</p>
      <div class="card-row">
        <div class="card">
          <p class="card-label">Projected Annual Gain</p>
          <p class="card-value" style="color:#111827">${fmtGBP(projection.projectedGain)}</p>
        </div>
        <div class="card" style="border-color:${sc};background:${scBgHex}">
          <p class="card-label" style="color:${sc}">Reliability-Adjusted Gain</p>
          <p class="card-value" style="color:${sc}">${fmtGBP(adjustedGain)}</p>
          <p class="card-note" style="color:${sc}">At ${reliabilityScore}% reliability</p>
        </div>
      </div>
      <p class="break-even">${projection.breakEvenValue > 0 ? Math.ceil(projection.breakEvenValue) + ' ' + projection.breakEvenUnit : '—'} to break even</p>
    </div>

    <div class="section">
      <p class="section-label">Governance Assessment</p>
      <table>
        <thead>
          <tr><th>Element</th><th>Status</th><th>Regulatory Anchor</th><th>Consequence</th><th>Context Note</th></tr>
        </thead>
        <tbody>${govRows}</tbody>
      </table>
      <div class="reliability-box" style="border-color:${sc};background:${scBgHex}">
        <span class="reliability-score" style="color:${sc}">${reliabilityScore}%</span>
        <div>
          <p class="reliability-label" style="color:${sc}">Reliability Score</p>
          <p class="reliability-sub">${confirmedCount} of 6 governance elements confirmed</p>
        </div>
      </div>
      <p class="self-note">This assessment is based on self-reported answers. TrueCase cannot verify governance claims.</p>
    </div>

    <div class="section">
      <p class="section-label">Social Return &amp; SDG Alignment</p>
      <p class="section-body">${narrative.section3}</p>
      <div class="sroi-box">
        <p class="sroi-text">
          TrueCase SDG mapping is directional signal only. It is not an
          investment-grade SROI assessment. Organisations requiring formal
          SROI should commission a full assessment using the UK Cabinet
          Office SROI methodology.
        </p>
      </div>
    </div>

    <p class="ai-note">Generated by Claude (Anthropic) based on the inputs and governance assessment you provided.</p>

    <div class="footer">
      <p class="footer-main">Generated by TrueCase — truecase.vercel.app &nbsp;|&nbsp; ${generationDate}</p>
      <p class="footer-disclaimer">
        This document is directional. TrueCase does not provide investment-grade financial modelling,
        legal advice, or certified SROI assessment. No user data was stored in generating this document.
      </p>
    </div>

  </div>
</body>
</html>`
}
