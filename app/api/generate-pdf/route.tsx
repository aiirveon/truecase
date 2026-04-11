/*
 * ─────────────────────────────────────────────────────────────────────────────
 * COLOUR EXCEPTION — @react-pdf/renderer does not support CSS variables.
 * All colour values in this file are hardcoded hex literals by necessity.
 * This is the ONLY acceptable exception to TrueCase's no-hardcoded-values rule.
 * Every hex value mirrors its counterpart in styles/tokens.css exactly.
 * Knowledge base version strings are also stored in the C block for consistency.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import {
  renderToBuffer,
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ElementSummary, ReliabilityBreakdownItem } from '@/lib/types'

// ─── Constants block (colours + knowledge base metadata) ─────────────────────

const C = {
  // Colours — mirror tokens.css (hardcoded by @react-pdf/renderer necessity)
  white:       '#FFFFFF',
  text:        '#111827',
  textMuted:   '#6B7280',
  border:      '#E5E7EB',
  boxBg:       '#F9FAFB',
  scoreHigh:   '#16A34A',
  scoreMid:    '#D97706',
  scoreLow:    '#DC2626',
  scoreHighBg: '#F0FDF4',
  scoreMidBg:  '#FFFBEB',
  scoreLowBg:  '#FEF2F2',
  // Knowledge base metadata
  kbVersion:      '1.0',
  kbVerifiedDate: 'April 2026',
}

// ─── Request body ─────────────────────────────────────────────────────────────

interface FinancialOutputs {
  projectedGain:  number
  adjustedGain:   number
  costOfInaction: number
  netGain:        number
  roiPercent:     number
  breakEven:      string
}

interface PDFRequest {
  section1:                  string
  section2:                  string
  section3:                  string
  financialOutputs:          FinancialOutputs
  governanceElements:        ElementSummary[]
  reliabilityScore:          number
  reliabilityScoreBreakdown: ReliabilityBreakdownItem[]
  confirmedCount:            number
  useCase:                   string
  generationDate:            string
  kbVersion:                 string
  kbVerifiedDate:            string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return '£' + Math.round(Math.abs(value)).toLocaleString('en-GB')
}

function getScoreColor(score: number): string {
  if (score >= 80) return C.scoreHigh
  if (score >= 50) return C.scoreMid
  return C.scoreLow
}

function getScoreBg(score: number): string {
  if (score >= 80) return C.scoreHighBg
  if (score >= 50) return C.scoreMidBg
  return C.scoreLowBg
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed':       return 'Confirmed'
    case 'partial':         return 'Partial'
    case 'missing':         return 'Not Confirmed'
    case 'not_applicable':  return 'Not Applicable'
    case 'not-applicable':  return 'Not Applicable'
    default:                return status
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':       return C.scoreHigh
    case 'partial':         return C.scoreMid
    case 'missing':         return C.scoreLow
    case 'not_applicable':
    case 'not-applicable':  return C.textMuted
    default:                return C.text
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'confirmed':       return C.scoreHighBg
    case 'partial':         return C.scoreMidBg
    case 'missing':         return C.scoreLowBg
    case 'not_applicable':
    case 'not-applicable':  return C.boxBg
    default:                return C.white
  }
}

function formatReduction(reduction: number): string {
  if (reduction === 0) return '0'
  // Normalise: stored as either sign, always display as negative
  return reduction < 0 ? String(reduction) : String(-reduction)
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    paddingTop: 44,
    paddingBottom: 72,
    paddingHorizontal: 44,
    fontSize: 10,
    color: C.text,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerWordmark: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  headerDate: {
    fontSize: 9,
    color: C.textMuted,
  },
  // Grounding disclosure (page 1 only)
  groundingDisclosure: {
    fontSize: 8,
    color: C.textMuted,
    lineHeight: 1.5,
    marginBottom: 14,
  },
  // Section heading
  sectionHeading: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  // Body text
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 14,
  },
  // Financial row
  financialRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  financialBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.boxBg,
    padding: 12,
    borderRadius: 3,
  },
  financialLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  financialValue: {
    fontSize: 20,
    fontFamily: 'Courier-Bold',
  },
  financialNote: {
    fontSize: 8,
    color: C.textMuted,
    marginTop: 4,
  },
  breakEven: {
    fontSize: 9,
    color: C.textMuted,
    marginBottom: 8,
  },
  // Governance table
  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    marginVertical: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: C.boxBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableLastRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 8,
    lineHeight: 1.4,
  },
  anchorUrl: {
    fontSize: 7,
    color: C.textMuted,
    lineHeight: 1.3,
    marginTop: 2,
  },
  // Reliability score box
  reliabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    padding: 12,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 6,
  },
  reliabilityScore: {
    fontSize: 30,
    fontFamily: 'Courier-Bold',
  },
  reliabilityLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  reliabilitySubLabel: {
    fontSize: 8,
    color: C.textMuted,
    marginTop: 2,
  },
  // Score breakdown list
  breakdownItem: {
    fontSize: 8,
    color: C.textMuted,
    lineHeight: 1.5,
  },
  // Self-assessment note
  selfAssessmentNote: {
    fontSize: 8,
    color: C.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  // SROI caveat box
  sroiBox: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.boxBg,
    padding: 12,
    borderRadius: 3,
    marginTop: 12,
  },
  sroiText: {
    fontSize: 9,
    color: C.textMuted,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerMain: {
    fontSize: 8,
    color: C.textMuted,
  },
  footerKb: {
    fontSize: 7,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerDisclaimer: {
    fontSize: 7,
    color: C.textMuted,
    lineHeight: 1.4,
    textAlign: 'center',
  },
})

// ─── Shared sub-components ────────────────────────────────────────────────────

function Header({ date }: { date: string }) {
  return (
    <View style={s.header}>
      <Text style={s.headerWordmark}>TRUECASE</Text>
      <Text style={s.headerDate}>{date}</Text>
    </View>
  )
}

function Footer({ date }: { date: string }) {
  return (
    <View style={s.footer}>
      <View style={s.footerRow}>
        <Text style={s.footerMain}>
          Generated by TrueCase — truecase.vercel.app
        </Text>
        <Text style={s.footerMain}>{date}</Text>
        <Text
          style={s.footerMain}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </View>
      <Text style={s.footerKb}>
        {`Governance knowledge base v${C.kbVersion}, regulatory sources verified ${C.kbVerifiedDate}.`}
      </Text>
      <Text style={s.footerDisclaimer}>
        This document is directional. TrueCase does not provide
        investment-grade financial modelling, legal advice, or certified SROI
        assessment. No user data was stored in generating this document.
      </Text>
    </View>
  )
}

// ─── PDF document ─────────────────────────────────────────────────────────────

function TrueCasePDF({
  section1, section3,
  financialOutputs, governanceElements,
  reliabilityScore, reliabilityScoreBreakdown,
  confirmedCount, generationDate,
}: Omit<PDFRequest, 'useCase' | 'section2' | 'kbVersion' | 'kbVerifiedDate'>) {
  const sc   = getScoreColor(reliabilityScore)
  const scBg = getScoreBg(reliabilityScore)
  const { projectedGain, adjustedGain, breakEven } = financialOutputs

  return (
    <Document>

      {/* ══ PAGE 1 — Business Case Summary ══════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer date={generationDate} />
        <Header date={generationDate} />

        {/* Grounding disclosure */}
        <Text style={s.groundingDisclosure}>
          {`Generated using TrueCase knowledge base v${C.kbVersion} (verified ${C.kbVerifiedDate}). Financial figures from user inputs. Regulatory references from the knowledge base.`}
        </Text>

        <Text style={s.sectionHeading}>Business Case Summary</Text>
        <Text style={s.body}>{section1}</Text>

        {/* Two financial boxes — equal size */}
        <View style={s.financialRow}>
          <View style={s.financialBox}>
            <Text style={s.financialLabel}>Projected Annual Gain</Text>
            <Text style={[s.financialValue, { color: C.text }]}>
              {fmt(projectedGain)}
            </Text>
          </View>
          <View style={[s.financialBox, { borderColor: sc, backgroundColor: scBg }]}>
            <Text style={[s.financialLabel, { color: sc }]}>
              Reliability-Adjusted Gain
            </Text>
            <Text style={[s.financialValue, { color: sc }]}>
              {fmt(adjustedGain)}
            </Text>
            <Text style={[s.financialNote, { color: sc }]}>
              At {reliabilityScore}% reliability
            </Text>
          </View>
        </View>

        <Text style={s.breakEven}>{breakEven} to break even</Text>
      </Page>

      {/* ══ PAGE 2 — Governance Assessment ══════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer date={generationDate} />
        <Header date={generationDate} />

        <Text style={s.sectionHeading}>Governance Assessment</Text>

        {/* Governance table */}
        <View style={s.table}>

          {/* Header row */}
          <View style={s.tableHeaderRow}>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>Element</Text>
            <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Status</Text>
            <Text style={[s.tableHeaderCell, { flex: 3 }]}>Regulatory Anchor</Text>
            <Text style={[s.tableHeaderCell, { flex: 3 }]}>Consequence</Text>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>Context Note</Text>
          </View>

          {/* Data rows */}
          {governanceElements.map((el, i) => {
            const isLast     = i === governanceElements.length - 1
            const rowStyle   = isLast ? s.tableLastRow : s.tableRow
            const anchor     = el.regulatory_anchors?.[0] ?? null
            const consequence =
              el.status === 'missing' || el.status === 'partial'
                ? el.consequence
                : ''

            return (
              <View key={el.element_id} style={rowStyle}>

                {/* Element name */}
                <Text style={[s.tableCell, { flex: 2 }]}>{el.name}</Text>

                {/* Status — coloured cell */}
                <View style={{ flex: 1.5, justifyContent: 'flex-start' }}>
                  <View style={{
                    backgroundColor: getStatusBg(el.status),
                    borderRadius: 2,
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={[s.tableCell, { color: getStatusColor(el.status) }]}>
                      {getStatusLabel(el.status)}
                    </Text>
                  </View>
                </View>

                {/* Regulatory anchor — regulation + clause, URL below */}
                <View style={{ flex: 3 }}>
                  {anchor ? (
                    <View>
                      <Text style={s.tableCell}>
                        {anchor.regulation}, {anchor.clause}
                      </Text>
                      <Text style={s.anchorUrl}>{anchor.url}</Text>
                    </View>
                  ) : (
                    <Text style={[s.tableCell, { color: C.textMuted }]}>—</Text>
                  )}
                </View>

                {/* Consequence */}
                <Text style={[s.tableCell, { flex: 3, color: C.textMuted }]}>
                  {consequence}
                </Text>

                {/* Context note */}
                <Text style={[s.tableCell, { flex: 2, color: C.textMuted }]}>
                  {el.context_note ?? ''}
                </Text>

              </View>
            )
          })}
        </View>

        {/* Reliability score badge */}
        <View style={[s.reliabilityBox, { borderColor: sc, backgroundColor: scBg }]}>
          <Text style={[s.reliabilityScore, { color: sc }]}>
            {reliabilityScore}%
          </Text>
          <View>
            <Text style={[s.reliabilityLabel, { color: sc }]}>
              Reliability Score
            </Text>
            <Text style={s.reliabilitySubLabel}>
              {confirmedCount} of 6 governance elements confirmed
            </Text>
          </View>
        </View>

        {/* Score breakdown */}
        <View style={{ marginBottom: 8 }}>
          {reliabilityScoreBreakdown.map((item, i) => (
            <Text key={i} style={s.breakdownItem}>
              {item.elementName}: {getStatusLabel(item.status)} — {formatReduction(item.reduction)}
            </Text>
          ))}
        </View>

        <Text style={s.selfAssessmentNote}>
          This assessment is based on self-reported answers.
          TrueCase cannot verify governance claims.
        </Text>
      </Page>

      {/* ══ PAGE 3 — Social Return & SDG Alignment ══════════════ */}
      <Page size="A4" style={s.page}>
        <Footer date={generationDate} />
        <Header date={generationDate} />

        <Text style={s.sectionHeading}>Social Return & SDG Alignment</Text>
        <Text style={s.body}>{section3}</Text>

        {/* SROI caveat box — full text, never abbreviated */}
        <View style={s.sroiBox}>
          <Text style={s.sroiText}>
            TrueCase SDG mapping is directional signal only. It is not an
            investment-grade SROI assessment. Organisations requiring formal
            SROI should commission a full assessment using the UK Cabinet
            Office SROI methodology.
          </Text>
        </View>
      </Page>

    </Document>
  )
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: PDFRequest = await request.json()

    const {
      section1, section2: _section2, section3,
      financialOutputs, governanceElements,
      reliabilityScore, reliabilityScoreBreakdown,
      confirmedCount, useCase, generationDate,
    } = body

    // Generate PDF — discard inputs immediately after buffer is created
    const buffer = await renderToBuffer(
      <TrueCasePDF
        section1={section1}
        section3={section3}
        financialOutputs={financialOutputs}
        governanceElements={governanceElements}
        reliabilityScore={reliabilityScore}
        reliabilityScoreBreakdown={reliabilityScoreBreakdown}
        confirmedCount={confirmedCount}
        generationDate={generationDate}
      />,
    )

    // Sanitise filename components
    const safeName = useCase.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const safeDate = generationDate.replace(/[^0-9]+/g, '-')

    // Return file stream — nothing is stored
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="truecase-${safeName}-${safeDate}.pdf"`,
      },
    })
  } catch {
    // Generic error only — do not expose raw SDK errors
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 },
    )
  }
}
