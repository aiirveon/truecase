# TrueCase — Product Bible
**Tagline:** Build business cases you can actually trust.
**Version:** 2.0
**Owner:** Ogbebor Osaheni
**Status:** Active development — Phase 2 (Knowledge Base rebuild)

---

## ABSOLUTE RULES — read before anything else

1. SINGLE SOURCE OF TRUTH — DESIGN
   All design values live in styles/tokens.css only.
   Colours, fonts, spacing, radii, transitions —
   all defined as CSS variables there first,
   then referenced via Tailwind tokens.
   No value ever appears hardcoded in a component.

2. SINGLE SOURCE OF TRUTH — KNOWLEDGE
   All governance claims live in lib/governance-kb.json.
   All financial benchmarks live in lib/benchmarks.json.
   No regulatory statement, consequence text, or
   benchmark figure appears hardcoded in any component.
   Every claim in the UI traces to one of these files.

3. NO HARDCODED VALUES EVER
   Never: color: #1a73e8
   Never: font-family: 'Inter'
   Never: padding: 16px
   Always: text-brand / font-sans / p-4
   Exception: @react-pdf/renderer palette only —
   hex values isolated in const C block with comment.

4. NO INLINE STYLES EVER
   Exception: CSS variable injection for runtime
   computed values only:
   style={{ '--reliability': `${score}%` }}
   This is the only acceptable inline style pattern.

5. NOTHING LOADS AUTOMATICALLY
   Every Claude API call is triggered by an
   explicit user button click.
   No automatic loading. No prefetching.
   No background processing.
   Token spend equals user intent only.

6. STATELESS — NOTHING IS STORED
   No database. No localStorage. No sessionStorage.
   No cookies. No analytics beyond Vercel defaults.
   No logging of user inputs anywhere.
   PDF API route: process inputs, return file,
   discard immediately. Zero write operations.

7. CLAUDE IS CONSTRAINED TO VERIFIED SOURCES ONLY
   The Claude system prompt must explicitly prohibit
   adding regulatory claims, market context, or
   industry observations beyond what is injected
   from governance-kb.json and benchmarks.json.
   Every factual claim in Claude output must trace
   to the user's inputs or the knowledge base.

---

## What TrueCase is

TrueCase is an AI-powered business case builder
for AI investments. It generates a trustworthy
ROI projection — but only after assessing whether
the governance conditions that determine its
reliability are in place.

Three user archetypes:
- Internal AI PM seeking budget approval
- Startup founder pitching investors
- Enterprise buyer stress-testing vendor ROI claims

The governance gate is the product.
The financial calculator is the entry point.
The PDF is the deliverable.

---

## Design philosophy

**McKinsey tool meets responsible AI.**

TrueCase is a professional business tool.
Its PDF travels to board rooms, investor data rooms,
and procurement offices.

Core principles:
- Light, neutral, document-grade. White backgrounds,
  dark ink, blue accent. Looks at home in a board pack.
- Restraint. No gradients, no decorative elements.
  Flat surfaces separated by 1px borders.
- Reliability score is the visual centrepiece.
  Green / amber / red — always visible, never hidden.
- Typography signals trust. Inter for body.
  JetBrains Mono for all financial figures.
- Two projections always visible at equal weight:
  headline projection AND reliability-adjusted projection.
  This is non-negotiable. Enforced in component logic.
- Every regulatory claim links to its primary source.
  Citations are not decorative — they are the proof.

---

## Colour tokens — styles/tokens.css

[UNCHANGED — do not modify tokens.css]

---

## Typography

[UNCHANGED — do not modify typography rules]

---

## Tailwind configuration — tailwind.config.ts

[UNCHANGED — do not modify tailwind.config.ts]

---

## Knowledge Base Architecture

TWO VERIFIED KNOWLEDGE FILES:

FILE 1: lib/governance-kb.json
Version: 1.0
Last verified: April 2026

Structure per element:
{
  "element_id": string,
  "name": string,
  "plain_english": string,
  "why_it_matters": string,
  "regulatory_anchors": [
    {
      "regulation": string,
      "clause": string,
      "url": string,
      "plain_english": string
    }
  ],
  "consequence_if_missing": string,
  "consequence_if_partial": string,
  "reliability_reduction_missing": number,
  "reliability_reduction_partial": number,
  "applicable_to": string[],
  "sectors": string[]
}

Six elements:
1. hard_output_cap (-25 missing, -12 partial)
2. human_override (-20 missing, -10 partial)
3. explainability (-15 missing, -7 partial)
4. regulation_identified (-20 missing, -10 partial)
5. training_data_documented (-10 missing, -5 partial)
6. personalisation_boundary (-10 missing, -5 partial)

RULE: Components read consequence text and
regulatory anchors from this file.
No consequence text is hardcoded in components.

FILE 2: lib/benchmarks.json
Version: 1.0
Last verified: April 2026

Structure per benchmark:
{
  "field_id": string,
  "sector": string,
  "label": string,
  "benchmark_low": number,
  "benchmark_high": number,
  "unit": string,
  "source": string,
  "source_url": string,
  "verified_date": string
}

RULE: All hint text benchmark figures in financial
inputs trace to an entry in this file.
No benchmark figure is hardcoded in components.

---

## The four product layers

### Layer 1 — Guided Input (replaces use case dropdown)

STAGE 1: Four questions — one at a time.
Show one question, wait for answer, show
immediate feedback, then show next question.
This is a dialogue, not a form.

QUESTION 1 — The decision question
Label: "What does your AI system decide or
recommend?"
Options (radio buttons):
A) Decisions affecting individuals
   (loan approvals, content removal, pricing
   for specific people, hiring decisions)
B) Decisions affecting organisations or markets
   (land acquisition, resource allocation,
   business strategy, market pricing)
C) Internal analysis only
   (dashboards, reports, research tools,
   internal forecasting)
D) Process automation with no prior human decision
   (document processing, data extraction,
   scheduling)

Immediate feedback after Q1:
A → "This places your system in a high-priority
     regulatory category. GDPR Article 22 and
     sector-specific regulation will be central
     to your governance assessment."
B → "Organisation-level decisions have lower
     individual rights exposure but may attract
     CMA, FCA, or sector regulator scrutiny
     depending on scale and sector."
C → "Internal analysis tools have lower regulatory
     exposure. We will still assess governance
     quality — unexplained internal AI decisions
     create audit and accountability risks."
D → "Process automation without individual impact
     has the lowest regulatory exposure. Governance
     focus will be on training data quality and
     explainability for audit purposes."

QUESTION 2 — The data question
Label: "What kind of data does your AI system use?"
Options:
A) Personal data about identifiable individuals
   (names, purchase history, behaviour,
   demographics, health, employment)
B) Aggregated or anonymised data
   (market trends, group statistics, cohort data)
C) Operational or sensor data
   (transaction volumes, infrastructure metrics,
   event data without individual identifiers)
D) Publicly available data only
   (planning records, pricing indices, news,
   public registers)

Immediate feedback after Q2:
A → "Personal data triggers UK GDPR obligations
     including data minimisation, purpose limitation,
     and — if used in automated decisions — Article
     22 rights. Element 6 (personalisation boundary)
     will apply to your assessment."
B/C/D → "No individual personal data means Element 6
          (personalisation/surveillance boundary)
          does not apply to your system. It will be
          auto-confirmed in your assessment."

QUESTION 3 — The scale question
Label: "At what scale does this system operate?"
Options:
A) Fewer than 100 decisions or outputs per month
B) Hundreds to thousands per month
C) Tens of thousands or more per month
D) Scale not yet known — still in development

Immediate feedback after Q3:
A → "Low scale reduces regulatory priority but
     does not eliminate governance obligations."
B/C → "At this scale, regulatory scrutiny is more
       likely. ICO, Ofcom, and CMA enforcement
       focus increases with volume."
D → "Unknown scale noted. Your projection will
     reflect development-stage uncertainty."

QUESTION 4 — The sector question
Label: "Which sector does this AI system operate in?"
Options (dropdown):
- Financial services (lending, insurance, investment)
- Media and broadcasting
- Healthcare or social care
- Retail, e-commerce, or ticketing
- Real estate or property
- Recruitment or employment
- Public sector or government services
- Technology platform or marketplace
- Other

No immediate feedback — sector determines which
regulatory anchors from governance-kb.json are
shown as most relevant in Layer 2.

STAGE 2: Governance readiness summary
After all four questions, before financial inputs,
show a one-paragraph plain English summary.
This is RULE-BASED — not a Claude API call.
Generated from Q1-Q4 answers using conditional logic.

Example (Q1=A, Q2=A, Q4=Financial services):
"Based on your answers, this is a financial services
AI system that makes decisions affecting individuals
using personal data. The two governance elements
most critical for your use case are human override
(GDPR Article 22 and FCA Consumer Duty) and
explainability (ICO automated decision-making
guidance). These will have the largest impact on
your reliability score."

Show a [These answers look wrong] link that
resets to Q1 without losing financial inputs.

STAGE 3: Six financial inputs
After Stage 2, show financial inputs.

Field 1: What does your AI system do?
  Type: textarea (3 rows) — optional context
  Label: ADD CONTEXT (OPTIONAL)
  Hint: "Specific context improves narrative
  quality and SDG mapping. e.g. 'Content
  moderation AI for a UK streaming platform
  processing 50,000 posts per day'"

Field 2: Current annual cost £
  Label: CURRENT ANNUAL COST OF THIS PROCESS £
  Type: number
  Benchmark hint: reads from benchmarks.json
  for the selected sector

Field 3: Expected efficiency gain %
  Label: EXPECTED EFFICIENCY GAIN FROM AI %
  Type: number (0-100)
  Benchmark hint: reads from benchmarks.json

Field 4: Expected error/risk reduction %
  Label: EXPECTED ERROR OR RISK REDUCTION %
  Type: number (0-100)
  Benchmark hint: reads from benchmarks.json

Field 5: Regulatory fine exposure £
  Label: ESTIMATED REGULATORY FINE EXPOSURE £
  Type: number
  Hint: reads maximum penalty from
  governance-kb.json for the selected sector
  e.g. "Online Safety Act max: £18M or 10%
  global turnover [legislation.gov.uk ↗]"

Field 6: AI system annual cost £
  Label: AI SYSTEM ANNUAL COST £
  Type: number
  Benchmark hint: reads from benchmarks.json

Calculations (universal formula):
projectedGain = currentCost × (efficiencyGain/100)
  + (fineExposure × (errorReduction/100) × 0.3)
systemCost = aiCost
costOfInaction = projectedGain
netGain = projectedGain - systemCost
roiPercent = (netGain / systemCost) × 100
breakEven = systemCost / (projectedGain/12) months

Output cards (unchanged from v1):
- Projected annual gain £
- Reliability-adjusted gain £ (equal card size)
- Cost of inaction £
- Net annual gain £
- ROI %
- Break-even point

CRITICAL: Both projection cards always same size.
Governance gap callout always visible between them.

### Layer 2 — Governance Gate

Six elements. Each element row contains:

1. Element name and plain English question
2. Three-state toggle: Confirmed / Partial /
   Not Confirmed
3. When not confirmed or partial:
   - Inline warning text from governance-kb.json
     consequence_if_missing field
   - Regulatory citation with clickable link:
     Format: "[Regulation name, Clause ↗]"
     Opens official document in new tab
4. Context note field (optional text input):
   "Add context about your specific situation"
   Appears on all elements regardless of status.
   Does not affect reliability score.
   Appears in PDF alongside element status.

Element 6 special case:
If Q2 answer was B, C, or D (no individual data):
Auto-confirm Element 6 with note:
"Not applicable — your system uses no individual
behavioural data based on your Q2 answer."
Toggle is disabled. Score reduction = 0.

Reliability score display:
1. Large score badge (coloured by band)
2. Score BREAKDOWN shown below badge:
   Element 1: Confirmed — 0 reduction
   Element 2: Not confirmed — -20
   Element 3: Partial — -7
   [etc for all six]
   Total: [score]%
3. One sentence: "[X] of 6 elements confirmed"

This breakdown is non-negotiable. TrueCase must
apply the same transparency to itself that it
argues organisations should apply to their AI.

Self-assessment note (persistent, never hidden):
"This assessment is based on your self-reported
answers. TrueCase cannot verify governance claims."

### Layer 3 — SROI / SDG Mapping

SDG mapping determined by:
1. Q1 answer (decision type)
2. Q4 answer (sector)
3. Optional context field content (passed to Claude)

Claude determines SDGs in narrative Section 3.
Claude is instructed to identify micro/meso/macro
level of impact before stating the SDG connection.
Sætra framework: micro (individual), meso
(organisational), macro (societal).

Always show:
"TrueCase SDG mapping is directional signal only.
It is not an investment-grade SROI assessment.
Organisations requiring formal SROI should
commission a full assessment using the UK Cabinet
Office SROI methodology."

### Layer 4 — AI Narrative Generation + Export

[GENERATE BUSINESS CASE] button:
Enabled when all required financial inputs
have non-zero values.

GROUNDING DISCLOSURE — shown above button:
"This business case will be generated by Claude
(Anthropic) using your financial inputs and the
TrueCase regulatory knowledge base (v1.0, verified
April 2026). Financial figures are calculated from
your inputs. Regulatory references come from the
knowledge base. Claude does not add claims beyond
these sources. TrueCase stores nothing."

Claude API call — server-side only.
Model: claude-sonnet-4-20250514
Max tokens: 1500

SYSTEM PROMPT (use exactly):
"You are TrueCase, an AI business case builder.
Your job is to synthesise a business case from
the verified inputs and knowledge base provided.

STRICT RULES:
1. Every regulatory claim in your output must come
   from the knowledge_base object provided to you.
   Do not add regulatory claims from your training
   data that are not present in that object.
2. Every financial figure must come from the
   financial_inputs object. Do not recalculate
   or reinterpret the numbers.
3. Do not add market context, industry benchmarks,
   or sector observations that are not in the
   knowledge_base or benchmarks objects provided.
4. If you are uncertain about a claim, omit it.
   Do not substitute inference for fact.
5. Section 2 must reference the reliability score
   breakdown exactly as provided. Do not summarise
   the governance assessment — state each element
   status as given.

Return valid JSON only. No markdown. No preamble.
Format: { section1, section2, section3 }"

USER MESSAGE structure:
- financial_inputs: all calculated values
- governance_elements: array with element name,
  status, consequence text from kb, regulatory
  anchors from kb
- reliability_score: number
- reliability_score_breakdown: array of
  element name + reduction
- knowledge_base: relevant entries from
  governance-kb.json for this sector and Q1 answer
- benchmarks: relevant entries from benchmarks.json
- q1_answer, q2_answer, q3_answer, q4_answer
- context_field: optional context text

SECTION SPECS:
Section 1 — Business Case Summary (200-250 words)
  Plain English. CFO-readable.
  Must reference both headline AND reliability-
  adjusted projections.
  Must state what the reliability score means
  in plain terms.
  Never use: "leveraging", "synergies", "driving
  value", "unlock potential".

Section 2 — Governance Assessment (150-200 words)
  State each element status — confirmed, partial,
  or missing.
  For each missing/partial: one sentence stating
  the specific consequence from the knowledge base.
  End with reliability score and adjusted projection.
  Name regulations specifically — do not use
  generic "regulations" or "compliance".

Section 3 — Social Return Signal (100-150 words)
  State which SDGs are relevant and why.
  Connect to specific SDG targets, not just names.
  State whether impact is micro, meso, or macro level.
  End with exact SROI caveat:
  "TrueCase SDG mapping is directional signal only.
  It is not an investment-grade SROI assessment.
  Organisations requiring formal SROI should
  commission a full assessment using the UK Cabinet
  Office SROI methodology."

AI-GENERATED LABEL (shown after generation):
"Generated by Claude (Anthropic) from your inputs
and TrueCase knowledge base v1.0 (verified April
2026). Financial figures are your inputs.
Regulatory references are from the knowledge base."

---

## API routes

POST /api/generate-narrative
  Accepts: financial inputs + governance assessment
           + q1-q4 answers + context + SDG mapping
           + knowledge_base entries + benchmarks
  Returns: { section1, section2, section3 }
  Discards all inputs immediately after response.
  No logging. No storage.

POST /api/generate-pdf
  Accepts: complete TrueCase output
  Returns: PDF file stream
  Uses @react-pdf/renderer server-side.
  Discards immediately after return.
  No logging. No storage.
  Hex values: isolated in const C block only.
  Comment at top of file documents this exception.

---

## Page and route structure

/ — Main calculator (single vertical page)
/about — What TrueCase is, who it is for

Main page flow (top to bottom):
1. Four guided questions (one at a time)
2. Governance readiness summary
3. Financial inputs (six fields)
4. Projection output cards
5. Governance gate (six elements)
6. Grounding disclosure
7. [GENERATE BUSINESS CASE] button
8. Narrative output
9. Export buttons

URL parameters pre-fill financial inputs on load.
Q1-Q4 answers are not pre-fillable via URL —
they must be answered in sequence.

---

## Reliability score rules

Score 80-100%: green (--score-high / --score-high-bg)
Score 50-79%:  amber (--score-mid / --score-mid-bg)
Score 0-49%:   red (--score-low / --score-low-bg)

Reliability-adjusted projection:
= headline projection × (reliability score / 100)

Both cards always same size.
Governance gap callout always visible.
Score breakdown always shown below badge.

---

## PDF structure

Three pages. Neutral palette. No brand colours.

Page 1 — Business Case Summary
  TrueCase wordmark top-left
  Generation date top-right
  Grounding disclosure (one paragraph, small text)
  Section 1 narrative
  Two financial cards: headline + adjusted (same size)
  Break-even point

Page 2 — Governance Assessment
  Section 2 narrative
  Governance table:
    Columns: Element | Status | Regulatory anchor
             | Consequence | Context note
    Regulatory anchor column: regulation name
    + clause + URL printed in full
    Status cell: coloured green/amber/red
  Reliability score badge + breakdown table
  Self-assessment limitation note

Page 3 — Social Return & SDG Alignment
  Section 3 narrative
  SDG tiles: number, name, target, level of impact
  Full SROI caveat (never abbreviated)

Footer on every page:
  "Generated by TrueCase — truecase.vercel.app"
  Generation date
  "Governance knowledge base v1.0, regulatory
  sources verified April 2026."
  "This document is directional. TrueCase does not
  provide investment-grade financial modelling,
  legal advice, or certified SROI assessment."
  "No user data was stored in generating this
  document."

---

## Disclosure requirements (non-negotiable)

Grounding disclosure above generate button:
"This business case will be generated by Claude
(Anthropic) using your financial inputs and the
TrueCase regulatory knowledge base (v1.0, verified
April 2026). Financial figures are calculated from
your inputs. Regulatory references come from the
knowledge base. Claude does not add claims beyond
these sources. TrueCase stores nothing."

At PDF download button:
"Generated server-side and immediately discarded.
Nothing is stored by TrueCase."

AI-generated label on narrative:
"Generated by Claude (Anthropic) from your inputs
and TrueCase knowledge base v1.0 (verified April
2026). Financial figures are your inputs.
Regulatory references are from the knowledge base."

Knowledge base version in PDF footer:
"Governance knowledge base v1.0, regulatory
sources verified April 2026."

---

## Current status

tokens.css                    COMPLETE
tailwind.config.ts            COMPLETE
globals.css                   COMPLETE
layout.tsx                    COMPLETE
Route shells                  COMPLETE
lib/governance-kb.json        COMPLETE
lib/benchmarks.json           COMPLETE
Guided input (4 questions)    NOT STARTED
Governance gate rebuild       NOT STARTED
Projection cards rebuild      NOT STARTED
Claude API route rebuild      NOT STARTED
PDF rebuild                   NOT STARTED
HTML export rebuild           NOT STARTED
/about page                   NOT STARTED
Security checklist            NOT STARTED
Vercel deploy                 NOT STARTED

---

## Build sequence

1.  tokens.css + tailwind.config.ts  [COMPLETE]
2.  globals.css + layout.tsx         [COMPLETE]
3.  Route shells                     [COMPLETE]
4a. lib/governance-kb.json           ← NEXT
4b. lib/benchmarks.json              ← THEN THIS
4c. Guided input component (4 questions + summary)
5.  Governance gate (reads from kb)
6.  Projection output cards
7.  Claude API route (constrained system prompt)
8.  Narrative display + grounding disclosure
9.  PDF API route (kb table in Section 2)
10. HTML export + button pair
11. /about page
12. Security checklist + deploy

This file is the single source of truth.
Every AI tool building this project reads from here.
Update when the product direction changes.