import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { GenerateNarrativeRequest } from '@/lib/types'
import sdgKb from '@/lib/sdg-kb.json'

// ─── System prompt — use exactly as specified in CLAUDE.md Layer 4 ────────────

const SYSTEM_PROMPT = `You are TrueCase, an AI business case builder.
Your job is to synthesise a business case from the verified inputs and knowledge base provided.

STRICT RULES:
1. Every regulatory claim in your output must come from the knowledge_base object provided to you. Do not add regulatory claims from your training data that are not present in that object.
2. Every financial figure must come from the financial_inputs object. Do not recalculate or reinterpret the numbers.
3. Do not add market context, industry benchmarks, or sector observations that are not in the knowledge_base or benchmarks objects provided.
4. If you are uncertain about a claim, omit it. Do not substitute inference for fact.
5. Section 2 must reference the reliability score breakdown exactly as provided. Do not summarise the governance assessment — state each element status as given.

Return valid JSON only. No markdown. No preamble.
Format: { section1, section2, section3 }

SECTION SPECS:

Section 1 — Business Case Summary (200-250 words):
Plain English. CFO-readable. Must reference both the headline projection AND the reliability-adjusted projection. Must state what the reliability score means in plain terms. Never use: "leveraging", "synergies", "driving value", "unlock potential".

Section 2 — Governance Assessment (150-200 words):
State each element status — confirmed, partial, or missing. For each missing or partial element: one sentence stating the specific consequence from the knowledge base. End with the reliability score and the reliability-adjusted projection figure. Name regulations specifically — do not use generic "regulations" or "compliance".

Section 3 — Social Return Signal (100-150 words):
For Section 3, use ONLY the SDG mapping provided in the user message. Do not determine SDGs from your training data.
State the primary SDG number, name, and target. State the connection as provided. State the level of impact (micro/meso/macro).
Also reference the secondary SDG with its target and connection.
If governance dependencies are not all confirmed, include the negative_condition statement exactly as provided.
End with the sroi_caveat exactly as provided.`

// ─── User message builder ─────────────────────────────────────────────────────

function fmtGBP(n: number): string {
  return `£${Math.round(n).toLocaleString('en-GB')}`
}

function statusLabel(status: string): string {
  switch (status) {
    case 'confirmed':       return 'Confirmed'
    case 'partial':         return 'Partially Confirmed'
    case 'missing':         return 'Not Confirmed'
    case 'not_applicable':  return 'Not Applicable'
    default:                return status
  }
}

function buildUserMessage(body: GenerateNarrativeRequest): string {
  const {
    financialOutputs,
    governanceElements,
    reliabilityScore,
    reliabilityScoreBreakdown,
    guidedAnswers,
    knowledgeBaseEntries,
    benchmarkEntries,
    contextNote,
  } = body

  const lines: string[] = []

  // Context and guided answers
  lines.push(`Use case context: ${contextNote || 'Not provided'}`)
  lines.push(`Sector: ${guidedAnswers.q4}`)
  lines.push(`Decision type: ${guidedAnswers.q1}`)
  lines.push(`Data type: ${guidedAnswers.q2}`)
  lines.push(`Scale: ${guidedAnswers.q3}`)
  lines.push('')

  // Pre-calculated financial outputs — Claude must not recalculate
  lines.push('Financial outputs (do not recalculate):')
  lines.push(`Projected annual gain: ${fmtGBP(financialOutputs.projectedGain)}`)
  lines.push(`Reliability-adjusted gain: ${fmtGBP(financialOutputs.adjustedGain)}`)
  lines.push(`Net annual gain: ${fmtGBP(financialOutputs.netGain)}`)
  lines.push(`ROI: ${Math.round(financialOutputs.roiPercent)}%`)
  lines.push(`Break-even: ${financialOutputs.breakEven}`)
  lines.push(`Reliability score: ${reliabilityScore}%`)
  lines.push('')

  // Score breakdown — Claude must state each element exactly as given
  lines.push('Reliability score breakdown:')
  reliabilityScoreBreakdown.forEach(({ elementName, status, reduction }) => {
    const reductionStr = reduction === 0 ? '0 reduction' : `-${reduction}`
    lines.push(`  ${elementName}: ${statusLabel(status)} — ${reductionStr}`)
  })
  lines.push('')

  // Governance elements with consequence text from the knowledge base
  lines.push('Governance elements:')
  governanceElements.forEach((el) => {
    lines.push(`  Name: ${el.name}`)
    lines.push(`  Status: ${statusLabel(el.status)}`)
    if (el.consequence) {
      lines.push(`  Consequence: ${el.consequence}`)
    }
    if (el.context_note) {
      lines.push(`  Context note: ${el.context_note}`)
    }
    if (el.regulatory_anchors?.length) {
      const anchors = el.regulatory_anchors
        .map(a => `${a.regulation}, ${a.clause}`)
        .join('; ')
      lines.push(`  Regulatory anchors: ${anchors}`)
    }
  })
  lines.push('')

  // Knowledge base — verified regulatory facts only
  lines.push('Knowledge base (verified regulatory facts — use only these for regulatory claims):')
  lines.push(JSON.stringify(knowledgeBaseEntries, null, 2))
  lines.push('')

  // Benchmark references
  lines.push('Benchmark references:')
  lines.push(JSON.stringify(benchmarkEntries, null, 2))
  lines.push('')

  // SDG mapping — verified from sdg-kb.json based on q1 and q4
  const q1 = guidedAnswers?.q1
  const q4 = guidedAnswers?.q4

  const sdgEntry =
    sdgKb.mappings.find((m) => m.q1 === q1 && m.q4 === q4) ??
    sdgKb.mappings.find((m) => m.q1 === q1 && m.q4 === 'all')

  if (sdgEntry) {
    const dependencyStatuses = sdgEntry.governance_dependencies.map((depId) => {
      const el = governanceElements?.find((e) => e.element_id === depId)
      return {
        element: depId,
        status: el?.status ?? 'missing',
      }
    })

    const allDependenciesMet = dependencyStatuses.every(
      (d) => d.status === 'confirmed' || d.status === 'not_applicable',
    )

    lines.push('SDG Mapping (verified — use exactly):')
    lines.push(
      `Primary SDG: ${sdgEntry.primary_sdg.number} — ${sdgEntry.primary_sdg.name}`,
    )
    lines.push(`Target: ${sdgEntry.primary_sdg.target}`)
    lines.push(`Target text: ${sdgEntry.primary_sdg.target_text}`)
    lines.push(`Connection: ${sdgEntry.primary_sdg.connection}`)
    lines.push(`Level: ${sdgEntry.primary_sdg.level}`)
    lines.push('')
    lines.push(
      `Secondary SDG: ${sdgEntry.secondary_sdg.number} — ${sdgEntry.secondary_sdg.name}`,
    )
    lines.push(`Target: ${sdgEntry.secondary_sdg.target}`)
    lines.push(`Target text: ${sdgEntry.secondary_sdg.target_text}`)
    lines.push(`Connection: ${sdgEntry.secondary_sdg.connection}`)
    lines.push(`Level: ${sdgEntry.secondary_sdg.level}`)
    lines.push('')
    lines.push(
      `Governance dependencies for this SDG claim: ${JSON.stringify(dependencyStatuses)}`,
    )
    lines.push(`All dependencies met: ${allDependenciesMet}`)
    if (!allDependenciesMet) {
      lines.push(
        `If not all dependencies met, Section 3 must include: "${sdgEntry.negative_condition}"`,
      )
    }
    lines.push(`SROI caveat (end Section 3 with exactly): "${sdgKb.sroi_caveat}"`)
  }

  return lines.join('\n')
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: GenerateNarrativeRequest = await request.json()

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: buildUserMessage(body) }],
    })

    const raw =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    // Strip accidental markdown fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const parsed = JSON.parse(cleaned) as {
      section1: string
      section2: string
      section3: string
    }

    // Discard all inputs — return only the three sections
    return NextResponse.json({
      section1: parsed.section1 ?? '',
      section2: parsed.section2 ?? '',
      section3: parsed.section3 ?? '',
    })
  } catch {
    // Generic error only — do not expose raw SDK errors
    return NextResponse.json(
      { error: 'Failed to generate business case. Please try again.' },
      { status: 500 },
    )
  }
}
