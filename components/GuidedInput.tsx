'use client'

import { useState } from 'react'
import benchmarks from '@/lib/benchmarks.json'
import type {
  FinancialInputs,
  GuidedAnswers,
  Q1Answer,
  Q2Answer,
  Q3Answer,
  Q4Answer,
} from '@/lib/types'

// ─── Stage type ───────────────────────────────────────────────────────────────

type Stage = 'q1' | 'q2' | 'q3' | 'q4' | 'summary' | 'inputs'

// ─── Question data ────────────────────────────────────────────────────────────

interface OptionItem {
  value: string
  label: string
  sub?:  string
}

const Q1_OPTIONS: OptionItem[] = [
  {
    value: 'individuals',
    label: 'Decisions affecting individuals',
    sub:   'Loan approvals, content removal, pricing for specific people, hiring decisions',
  },
  {
    value: 'organisations',
    label: 'Decisions affecting organisations or markets',
    sub:   'Land acquisition, resource allocation, business strategy, market pricing',
  },
  {
    value: 'internal',
    label: 'Internal analysis only',
    sub:   'Dashboards, reports, research tools, internal forecasting',
  },
  {
    value: 'automation',
    label: 'Process automation with no prior human decision',
    sub:   'Document processing, data extraction, scheduling',
  },
]

const Q1_FEEDBACK: Record<Q1Answer, string> = {
  individuals:
    'This places your system in a high-priority regulatory category. GDPR Article 22 and ' +
    'sector-specific regulation will be central to your governance assessment.',
  organisations:
    'Organisation-level decisions have lower individual rights exposure but may attract ' +
    'CMA, FCA, or sector regulator scrutiny depending on scale and sector.',
  internal:
    'Internal analysis tools have lower regulatory exposure. We will still assess ' +
    'governance quality — unexplained internal AI decisions create audit and accountability risks.',
  automation:
    'Process automation without individual impact has the lowest regulatory exposure. ' +
    'Governance focus will be on training data quality and drift detection.',
}

const Q2_OPTIONS: OptionItem[] = [
  {
    value: 'personal',
    label: 'Personal data about identifiable individuals',
    sub:   'Names, purchase history, behaviour, demographics, health, employment',
  },
  {
    value: 'aggregated',
    label: 'Aggregated or anonymised data',
    sub:   'Market trends, group statistics, cohort data',
  },
  {
    value: 'operational',
    label: 'Operational or sensor data',
    sub:   'Transaction volumes, infrastructure metrics, event data without individual identifiers',
  },
  {
    value: 'public',
    label: 'Publicly available data only',
    sub:   'Planning records, pricing indices, news, public registers',
  },
]

function q2Feedback(v: Q2Answer): string {
  if (v === 'personal') {
    return (
      'Personal data triggers UK GDPR obligations including data minimisation, purpose ' +
      'limitation, and — if used in automated decisions — Article 22 rights. Element 6 ' +
      '(personalisation boundary) will apply to your assessment.'
    )
  }
  return (
    'No individual personal data means Element 6 (personalisation/surveillance boundary) ' +
    'does not apply to your system. It will be auto-confirmed in your assessment.'
  )
}

const Q3_OPTIONS: OptionItem[] = [
  { value: 'under100',          label: 'Fewer than 100 decisions or outputs per month' },
  { value: 'hundreds',          label: 'Hundreds to thousands per month' },
  { value: 'tens_of_thousands', label: 'Tens of thousands or more per month' },
  { value: 'unknown',           label: 'Scale not yet known — still in development' },
]

function q3Feedback(v: Q3Answer): string {
  if (v === 'under100')          return 'Low scale reduces regulatory priority but does not eliminate governance obligations.'
  if (v === 'hundreds')          return 'At this scale, regulatory scrutiny increases. ICO, Ofcom, and CMA enforcement attention grows with volume.'
  if (v === 'tens_of_thousands') return 'At this scale, regulatory scrutiny is high. Documented governance is essential before deployment.'
  return 'Unknown scale noted. Your projection will reflect development-stage uncertainty.'
}

const Q4_OPTIONS: { value: Q4Answer; label: string }[] = [
  { value: 'financial_services',         label: 'Financial services (lending, insurance, investment)' },
  { value: 'media_broadcasting',         label: 'Media and broadcasting' },
  { value: 'healthcare',                 label: 'Healthcare or social care' },
  { value: 'retail_ecommerce_ticketing', label: 'Retail, e-commerce, or ticketing' },
  { value: 'real_estate',                label: 'Real estate or property' },
  { value: 'recruitment_employment',     label: 'Recruitment or employment' },
  { value: 'public_sector',             label: 'Public sector or government services' },
  { value: 'technology_platform',        label: 'Technology platform or marketplace' },
  { value: 'other',                      label: 'Other' },
]

// ─── Stage 2: Rule-based readiness summary ────────────────────────────────────

function generateSummary(q1: Q1Answer, q2: Q2Answer, _q3: Q3Answer, q4: Q4Answer): string {
  const sectorLabels: Record<Q4Answer, string> = {
    financial_services:         'financial services',
    media_broadcasting:         'media and broadcasting',
    healthcare:                 'healthcare',
    retail_ecommerce_ticketing: 'retail and e-commerce',
    real_estate:                'real estate',
    recruitment_employment:     'recruitment and employment',
    public_sector:              'public sector',
    technology_platform:        'technology platform',
    other:                      'general sector',
  }

  const q1Desc: Record<Q1Answer, string> = {
    individuals:   'makes decisions affecting individuals',
    organisations: 'makes decisions affecting organisations or markets',
    internal:      'provides internal analysis and insights',
    automation:    'automates processes without individual decision-making',
  }

  const q2Desc: Record<Q2Answer, string> = {
    personal:    'using personal data',
    aggregated:  'using aggregated or anonymised data',
    operational: 'using operational data',
    public:      'using publicly available data',
  }

  interface ElementRef { name: string; regs: string }
  let elem1: ElementRef
  let elem2: ElementRef

  if (q1 === 'individuals') {
    const humanRegs =
      q4 === 'financial_services'    ? 'GDPR Article 22 and FCA Consumer Duty' :
      q4 === 'healthcare'            ? 'GDPR Article 22 and CQC regulatory framework' :
      q4 === 'recruitment_employment'? 'GDPR Article 22 and Equality Act 2010' :
      q4 === 'media_broadcasting'    ? 'GDPR Article 22 and Online Safety Act 2023' :
                                       'GDPR Article 22'
    elem1 = { name: 'human override',  regs: humanRegs }
    elem2 = { name: 'explainability',  regs: 'ICO automated decision-making guidance' }
  } else if (q1 === 'organisations') {
    const capRegs =
      q4 === 'media_broadcasting'  ? 'Online Safety Act 2023' :
      q4 === 'financial_services'  ? 'CMA and FCA oversight' :
                                     'CMA oversight'
    const regRegs =
      q4 === 'financial_services'  ? 'FCA regulatory framework' :
      q4 === 'media_broadcasting'  ? 'Ofcom Broadcasting Code' :
                                     'UK AI regulation framework'
    elem1 = { name: 'hard output cap',              regs: capRegs }
    elem2 = { name: 'relevant regulation identified', regs: regRegs }
  } else if (q1 === 'internal') {
    elem1 = { name: 'training data documented',      regs: 'UK GDPR Article 5 and ICO guidance' }
    elem2 = { name: 'relevant regulation identified', regs: 'applicable sector regulation' }
  } else {
    elem1 = { name: 'training data documented', regs: 'UK GDPR Article 5' }
    elem2 = { name: 'hard output cap',           regs: 'consumer protection regulation' }
  }

  const sectorFramework: Record<Q4Answer, string> = {
    financial_services:
      'FCA Consumer Duty and UK GDPR are the primary regulatory frameworks for your sector.',
    media_broadcasting:
      'The Online Safety Act 2023 and Ofcom Broadcasting Code are the primary regulatory frameworks for your sector.',
    healthcare:
      'NHS AI governance frameworks and CQC standards are the primary frameworks for your sector.',
    retail_ecommerce_ticketing:
      'CMA consumer protection guidance and UK GDPR are the primary frameworks for your sector.',
    real_estate:         'UK GDPR applies as a baseline across all sectors.',
    recruitment_employment: 'UK GDPR applies as a baseline across all sectors.',
    public_sector:       'UK GDPR applies as a baseline across all sectors.',
    technology_platform: 'UK GDPR applies as a baseline across all sectors.',
    other:               'UK GDPR applies as a baseline across all sectors.',
  }

  return (
    `Based on your answers, this is a ${sectorLabels[q4]} AI system that ${q1Desc[q1]} ` +
    `${q2Desc[q2]}. The two governance elements most critical for your use case are ` +
    `${elem1.name} (${elem1.regs}) and ${elem2.name} (${elem2.regs}). ` +
    `These will have the largest impact on your reliability score. ` +
    sectorFramework[q4]
  )
}

// ─── Benchmark sector accessor types ─────────────────────────────────────────

type SectorEntry = {
  label?:         string
  value?:         number
  display?:       string
  source?:        string
  source_url?:    string
  low?:           number
  high?:          number
  verified?:      boolean
  verified_note?: string
}

// ─── Shared class strings ─────────────────────────────────────────────────────

const labelClass =
  'block text-xs font-medium uppercase tracking-wide text-foreground-muted mb-1.5'

const hintClass = 'mt-1.5 text-xs text-foreground-subtle'

const inputBase =
  'w-full rounded border border-border bg-surface-raised px-3 py-2 text-sm ' +
  'text-foreground placeholder:text-foreground-subtle ' +
  'focus:border-brand focus:outline-none focus:ring-0 ' +
  'transition-colors duration-150'

const continueBtn =
  'w-full rounded bg-brand px-4 py-3 text-sm font-medium text-white ' +
  'transition-colors duration-150 hover:bg-brand-hover ' +
  'disabled:cursor-not-allowed disabled:opacity-40'

// ─── Sub-component: question stage ───────────────────────────────────────────

interface QuestionStageProps {
  stepNum:     number
  question:    string
  options:     OptionItem[]
  selected:    string | null
  onSelect:    (v: string) => void
  feedback:    string | null
  onContinue:  () => void
  canContinue: boolean
  showBack:    boolean
  onBack:      () => void
}

function QuestionStage({
  stepNum, question, options, selected, onSelect,
  feedback, onContinue, canContinue, showBack, onBack,
}: QuestionStageProps) {
  return (
    <div className="space-y-6">

      {/* Step indicator + back */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground-subtle">Step {stepNum} of 4</p>
        {showBack && (
          <button type="button" onClick={onBack}
            className="text-xs text-brand hover:underline">
            ← Back
          </button>
        )}
      </div>

      {/* Question label */}
      <p className="text-sm font-medium text-foreground">{question}</p>

      {/* Option buttons — 2 × 2 grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const active = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={
                'rounded border p-4 text-left transition-colors duration-150 focus:outline-none focus:ring-0 ' +
                (active
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-surface-raised hover:border-border-strong')
              }
            >
              <p className={`text-sm font-medium ${active ? 'text-brand' : 'text-foreground'}`}>
                {opt.label}
              </p>
              {opt.sub && (
                <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                  {opt.sub}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Immediate feedback */}
      {feedback && (
        <div className="rounded border border-border bg-surface-raised px-4 py-3">
          <p className="text-xs text-foreground-muted leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* Continue */}
      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className={continueBtn}
      >
        Continue
      </button>

    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GuidedInputProps {
  onInputsComplete: (inputs: FinancialInputs, answers: GuidedAnswers) => void
}

export default function GuidedInput({ onInputsComplete }: GuidedInputProps) {
  const [stage,   setStage]   = useState<Stage>('q1')
  const [q1,      setQ1]      = useState<Q1Answer | null>(null)
  const [q2,      setQ2]      = useState<Q2Answer | null>(null)
  const [q3,      setQ3]      = useState<Q3Answer | null>(null)
  const [q4,      setQ4]      = useState<Q4Answer | null>(null)
  // pending = the option the user clicked but hasn't confirmed with Continue yet
  const [pending, setPending] = useState<string | null>(null)

  // Stage 3 form values (stored as strings — inputs are string-valued in HTML)
  const [form, setForm] = useState({
    contextNote:       '',
    currentAnnualCost: '',
    efficiencyGain:    '',
    errorReduction:    '',
    fineExposure:      '',
    aiSystemCost:      '',
  })

  // ── Navigation ────────────────────────────────────────────────────────────

  function goBack() {
    setPending(null)
    if      (stage === 'q2')      { setStage('q1'); setQ2(null) }
    else if (stage === 'q3')      { setStage('q2'); setQ3(null) }
    else if (stage === 'q4')      { setStage('q3'); setQ4(null) }
    else if (stage === 'summary') { setStage('q4') }
    else if (stage === 'inputs')  { setStage('summary') }
  }

  function resetAll() {
    setStage('q1')
    setQ1(null); setQ2(null); setQ3(null); setQ4(null)
    setPending(null)
  }

  // ── Q1 handlers ───────────────────────────────────────────────────────────

  function handleQ1Continue() {
    if (!pending) return
    setQ1(pending as Q1Answer)
    setPending(null)
    setStage('q2')
  }

  // ── Q2 handlers ───────────────────────────────────────────────────────────

  function handleQ2Continue() {
    if (!pending) return
    setQ2(pending as Q2Answer)
    setPending(null)
    setStage('q3')
  }

  // ── Q3 handlers ───────────────────────────────────────────────────────────

  function handleQ3Continue() {
    if (!pending) return
    setQ3(pending as Q3Answer)
    setPending(null)
    setStage('q4')
  }

  // ── Q4 handlers ───────────────────────────────────────────────────────────

  function handleQ4Continue() {
    if (!q4) return
    setStage('summary')
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  function handleFormChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const requiredNumericFields = [
    'currentAnnualCost', 'efficiencyGain', 'errorReduction',
    'fineExposure', 'aiSystemCost',
  ] as const

  const allFilled = requiredNumericFields.every((k) => form[k].trim() !== '')

  function handleCalculate() {
    if (!allFilled || !q1 || !q2 || !q3 || !q4) return

    function parseN(v: string) {
      const p = parseFloat(v)
      return isFinite(p) ? p : 0
    }

    const inputs: FinancialInputs = {
      currentAnnualCost: parseN(form.currentAnnualCost),
      efficiencyGain:    parseN(form.efficiencyGain),
      errorReduction:    parseN(form.errorReduction),
      fineExposure:      parseN(form.fineExposure),
      aiSystemCost:      parseN(form.aiSystemCost),
      contextNote:       form.contextNote.trim(),
    }

    onInputsComplete(inputs, { q1, q2, q3, q4 })
  }

  // ── Benchmark lookups ─────────────────────────────────────────────────────

  const fineSectors = benchmarks.fine_exposure.sectors as Record<string, SectorEntry>
  const fineSector  = q4 ? (fineSectors[q4] ?? null) : null

  const effSectors  = benchmarks.efficiency_gain.sectors as Record<string, SectorEntry>
  const effSector   = q4 ? (effSectors[q4] ?? null) : null
  const effGeneral  = benchmarks.efficiency_gain.general_benchmark as SectorEntry

  const errSectors  = benchmarks.error_reduction.sectors as Record<string, SectorEntry>
  const errSector   = q4 ? (errSectors[q4] ?? null) : null

  // ── Render: Stage 1 — Q1 ─────────────────────────────────────────────────

  if (stage === 'q1') {
    return (
      <QuestionStage
        stepNum={1}
        question="What does your AI system decide or recommend?"
        options={Q1_OPTIONS}
        selected={pending ?? q1 ?? null}
        onSelect={setPending}
        feedback={pending ? Q1_FEEDBACK[pending as Q1Answer] : null}
        onContinue={handleQ1Continue}
        canContinue={!!pending}
        showBack={false}
        onBack={() => {}}
      />
    )
  }

  // ── Render: Stage 1 — Q2 ─────────────────────────────────────────────────

  if (stage === 'q2') {
    return (
      <QuestionStage
        stepNum={2}
        question="What kind of data does your AI system use?"
        options={Q2_OPTIONS}
        selected={pending ?? q2 ?? null}
        onSelect={setPending}
        feedback={pending ? q2Feedback(pending as Q2Answer) : null}
        onContinue={handleQ2Continue}
        canContinue={!!pending}
        showBack
        onBack={goBack}
      />
    )
  }

  // ── Render: Stage 1 — Q3 ─────────────────────────────────────────────────

  if (stage === 'q3') {
    return (
      <QuestionStage
        stepNum={3}
        question="At what scale does this system operate?"
        options={Q3_OPTIONS}
        selected={pending ?? q3 ?? null}
        onSelect={setPending}
        feedback={pending ? q3Feedback(pending as Q3Answer) : null}
        onContinue={handleQ3Continue}
        canContinue={!!pending}
        showBack
        onBack={goBack}
      />
    )
  }

  // ── Render: Stage 1 — Q4 (dropdown, no feedback) ─────────────────────────

  if (stage === 'q4') {
    return (
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground-subtle">Step 4 of 4</p>
          <button type="button" onClick={goBack}
            className="text-xs text-brand hover:underline">
            ← Back
          </button>
        </div>

        <p className="text-sm font-medium text-foreground">
          Which sector does this AI system operate in?
        </p>

        <select
          value={q4 ?? ''}
          onChange={(e) => setQ4((e.target.value as Q4Answer) || null as unknown as Q4Answer)}
          className={inputBase}
        >
          <option value="">Select a sector…</option>
          {Q4_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={!q4}
          onClick={handleQ4Continue}
          className={continueBtn}
        >
          Continue
        </button>

      </div>
    )
  }

  // ── Render: Stage 2 — Governance readiness summary ───────────────────────

  if (stage === 'summary') {
    const summary = (q1 && q2 && q3 && q4)
      ? generateSummary(q1, q2, q3, q4)
      : ''

    return (
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground-subtle">Governance readiness</p>
          <button type="button" onClick={goBack}
            className="text-xs text-brand hover:underline">
            ← Back
          </button>
        </div>

        <div className="rounded border border-border bg-surface-raised p-5">
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="text-xs text-foreground-muted hover:text-foreground hover:underline"
        >
          These answers look wrong — start again
        </button>

        <button
          type="button"
          onClick={() => setStage('inputs')}
          className={continueBtn}
        >
          Continue to financial inputs
        </button>

      </div>
    )
  }

  // ── Render: Stage 3 — Financial inputs ───────────────────────────────────

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground-subtle">Financial inputs</p>
        <button type="button" onClick={goBack}
          className="text-xs text-brand hover:underline">
          ← Back
        </button>
      </div>

      <div className="space-y-6">

        {/* Context note — optional */}
        <div>
          <label htmlFor="contextNote" className={labelClass}>
            Add context{' '}
            <span className="normal-case font-normal text-foreground-subtle">(optional)</span>
          </label>
          <textarea
            id="contextNote"
            rows={3}
            value={form.contextNote}
            onChange={(e) => handleFormChange('contextNote', e.target.value)}
            placeholder='e.g. "Content moderation AI for a UK streaming platform processing 50,000 posts per day"'
            className={`${inputBase} resize-none`}
          />
          <p className={hintClass}>
            Specific context improves narrative quality and SDG mapping.
          </p>
        </div>

        {/* Current annual cost */}
        <div>
          <label htmlFor="currentAnnualCost" className={labelClass}>
            Current annual cost of this process £
          </label>
          <input
            id="currentAnnualCost"
            type="number"
            min="0"
            value={form.currentAnnualCost}
            onChange={(e) => handleFormChange('currentAnnualCost', e.target.value)}
            placeholder="e.g. 500000"
            className={`${inputBase} font-mono`}
          />
          <p className={hintClass}>{benchmarks.current_annual_cost.guidance}</p>
        </div>

        {/* Efficiency gain */}
        <div>
          <label htmlFor="efficiencyGain" className={labelClass}>
            Expected efficiency gain from AI %
          </label>
          <input
            id="efficiencyGain"
            type="number"
            min="0"
            max="100"
            value={form.efficiencyGain}
            onChange={(e) => handleFormChange('efficiencyGain', e.target.value)}
            placeholder="e.g. 30"
            className={`${inputBase} font-mono`}
          />
          {effSector?.low != null ? (
            <p className={hintClass}>
              Benchmark range: {effSector.low}% – {effSector.high}%{' '}
              {effSector.source_url && (
                <a
                  href={effSector.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  [{effSector.source?.split('—')[0]?.trim()} ↗]
                </a>
              )}
              {!effSector.verified && effSector.verified_note && (
                <> — {effSector.verified_note}</>
              )}
            </p>
          ) : (
            <p className={hintClass}>
              Benchmark range: {effGeneral.low}% – {effGeneral.high}%{' '}
              <a
                href={effGeneral.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                [Google Cloud ↗]
              </a>
              {' '}— {effGeneral.verified_note}
            </p>
          )}
        </div>

        {/* Error / risk reduction */}
        <div>
          <label htmlFor="errorReduction" className={labelClass}>
            Expected error or risk reduction %
          </label>
          <input
            id="errorReduction"
            type="number"
            min="0"
            max="100"
            value={form.errorReduction}
            onChange={(e) => handleFormChange('errorReduction', e.target.value)}
            placeholder="e.g. 40"
            className={`${inputBase} font-mono`}
          />
          {errSector?.low != null && (
            <p className={hintClass}>
              Benchmark range: {errSector.low}% – {errSector.high}%{' '}
              {errSector.source_url && (
                <a
                  href={errSector.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  [{errSector.source?.split('—')[0]?.trim()} ↗]
                </a>
              )}
              {!errSector.verified && errSector.verified_note && (
                <> — {errSector.verified_note}</>
              )}
            </p>
          )}
        </div>

        {/* Regulatory fine exposure */}
        <div>
          <label htmlFor="fineExposure" className={labelClass}>
            Estimated regulatory fine exposure £
          </label>
          <input
            id="fineExposure"
            type="number"
            min="0"
            value={form.fineExposure}
            onChange={(e) => handleFormChange('fineExposure', e.target.value)}
            placeholder="Enter 0 if not applicable"
            className={`${inputBase} font-mono`}
          />
          {fineSector?.display ? (
            <p className={hintClass}>
              {fineSector.display}{' '}
              {fineSector.source_url && (
                <a
                  href={fineSector.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  [{fineSector.source?.split('—')[0]?.trim()} ↗]
                </a>
              )}
            </p>
          ) : (
            <p className={hintClass}>
              The maximum regulatory penalty if this AI system causes harm. Enter 0 if not applicable.
            </p>
          )}
        </div>

        {/* AI system annual cost */}
        <div>
          <label htmlFor="aiSystemCost" className={labelClass}>
            AI system annual cost £
          </label>
          <input
            id="aiSystemCost"
            type="number"
            min="0"
            value={form.aiSystemCost}
            onChange={(e) => handleFormChange('aiSystemCost', e.target.value)}
            placeholder="e.g. 60000"
            className={`${inputBase} font-mono`}
          />
          <p className={hintClass}>{benchmarks.ai_system_cost.guidance}</p>
        </div>

      </div>

      {/* Calculate ROI button */}
      <button
        type="button"
        disabled={!allFilled}
        onClick={handleCalculate}
        className={continueBtn}
      >
        Calculate ROI
      </button>

    </div>
  )
}
