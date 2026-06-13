# TrueCase

**Build business cases you can actually trust.**

An AI-powered business case builder for AI investments that generates ROI projections — but only after assessing whether the governance conditions that determine their reliability are in place.

**Status:** Live — deployed at truecase-seven.vercel.app

---

## Demo

[Live demo](https://truecase-seven.vercel.app/)

<!-- TODO: Add walkthrough GIF/screenshot -->

---

## The core idea

Most AI business cases present a headline ROI figure as if it were a financial certainty. It isn't. A projected gain of £500,000 from an AI system with no human override mechanism, no explainability, and unidentified regulatory exposure is not worth £500,000. The number is real; the reliability of achieving it is not.

TrueCase makes this explicit. The governance gate is the product. The financial calculator is the entry point. The PDF is the deliverable.

Every output shows two projections at equal visual weight: the headline projection and the reliability-adjusted projection. The gap between them is the cost of governance gaps — stated plainly, not buried in a footnote.

---

## How it works

### Layer 1 — Guided input (four questions)

Before any financial inputs, the user answers four questions one at a time:

1. **Decision type** — does the AI make decisions affecting individuals, organisations, or neither?
2. **Data type** — does it use personal data about identifiable individuals?
3. **Scale** — how many decisions per month?
4. **Sector** — which regulatory environment applies?

Each answer triggers immediate feedback drawn from conditional logic (not a Claude API call). After all four, a plain-English governance readiness summary explains which elements matter most for this use case.

### Layer 2 — Governance gate

Six governance elements drawn from `lib/governance-kb.json`:

| Element | Reliability reduction if missing |
|---|---|
| Hard output cap | −25 |
| Human override | −20 |
| Regulation identified | −20 |
| Explainability | −15 |
| Training data documented | −10 |
| Personalisation boundary | −10 |

Each element has three states (Confirmed / Partial / Not Confirmed). For missing or partial elements, the UI shows the specific consequence and regulatory citation from the knowledge base — no hardcoded text in components.

The reliability score is computed from these states. Both projection cards are always the same size. The score breakdown (element by element) is always visible. A persistent self-assessment note states that TrueCase cannot verify governance claims.

### Layer 3 — SROI / SDG mapping

SDG alignment is determined by Q1 (decision type) and Q4 (sector), with optional context passed to Claude. Impact is characterised at micro (individual), meso (organisational), or macro (societal) level using the Sætra framework.

Every output includes the full SROI caveat: this is a directional signal, not an investment-grade assessment. The Cabinet Office SROI methodology is cited for organisations requiring formal assessment.

### Layer 4 — AI narrative generation and PDF export

One button: **[GENERATE BUSINESS CASE]**. Enabled only when all required financial inputs have non-zero values. Triggered by explicit user click — no prefetching, no background generation.

Claude (`claude-sonnet-4-20250514`, max 1,500 tokens) receives:

- Pre-calculated financial outputs from `lib/calculations.ts` — Claude is instructed not to recalculate
- Governance element statuses and consequence text from `lib/governance-kb.json`
- Regulatory anchors from `lib/governance-kb.json` — Claude is prohibited from adding regulatory claims from its training data
- SDG mapping from `lib/sdg-kb.json` keyed on Q1 and Q4 answers
- Sector benchmarks from `lib/benchmarks.json`

The system prompt enforces five constraints: no regulatory claims beyond the knowledge base, no financial recalculation, no added market context, omit uncertain claims, state each governance element status exactly as given.

Output: three sections (Business Case Summary, Governance Assessment, Social Return Signal) returned as JSON, displayed in the UI, and exportable to a three-page PDF via `@react-pdf/renderer` server-side.

---

## Responsible-AI design decisions

**Every factual claim traces to a source file, not a component.** All regulatory consequence text, citation URLs, and benchmark figures live in `lib/governance-kb.json` and `lib/benchmarks.json`. Components read from these files. Nothing is hardcoded in UI. This makes the knowledge base auditable and updatable independently of the frontend.

**The system prompt constrains Claude to verified inputs only.** Claude is explicitly instructed not to add regulatory claims, market observations, or financial recalculations beyond what is injected from the knowledge base. If uncertain, Claude is told to omit rather than infer.

**Nothing is stored.** No database. No localStorage. No sessionStorage. No cookies. No logging of user inputs anywhere. The PDF API route processes inputs and returns the file stream; inputs are discarded immediately. The grounding disclosure and PDF footer state this explicitly.

**Two projections always visible at equal weight.** The reliability-adjusted projection cannot be hidden, minimised, or shown at smaller size than the headline. The governance gap callout between them is always visible. This is enforced in component logic.

**The AI label is non-negotiable.** Every generated narrative carries an explicit AI-generated disclosure naming Claude (Anthropic) and the knowledge base version. It cannot be removed or hidden by user action.

---

## Methodology and limitations (honest)

**Financial formula.** TrueCase uses a fixed formula: `projectedGain = currentCost × (efficiencyGain / 100) + fineExposure × (errorReduction / 100) × 0.3`. The 0.3 coefficient on fine exposure is a conservative estimate of enforcement probability — it is not actuarial. The formula is not a substitute for detailed financial modelling.

**Reliability score.** The score is a weighted deduction from 100% based on user-reported governance element statuses. It is not calibrated against real AI deployment outcomes. A score of 80% does not mean an 80% probability of achieving the projected gain — it means the projection is made against a governance baseline with fewer gaps.

**Self-reported governance.** TrueCase cannot verify that a user's governance claims are accurate. The self-assessment note is persistent and non-dismissible.

**Knowledge base version.** The regulatory knowledge base was last verified in April 2026. Regulatory guidance changes. The version and verification date are shown in the PDF footer.

**SDG mapping.** Directional only. TrueCase SDG mapping is not an investment-grade SROI assessment.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (design tokens in `styles/tokens.css`) |
| AI generation | Anthropic SDK (`claude-sonnet-4-20250514`) |
| PDF export | `@react-pdf/renderer` (server-side) |
| Knowledge base | Static JSON (`lib/governance-kb.json`, `lib/benchmarks.json`, `lib/sdg-kb.json`) |
| Hosting | Vercel |

---

## Run locally

```bash
git clone <repo-url>
cd truecase
pnpm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=your_key_here
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The application runs entirely client-side for financial calculations. The Claude API is called server-side only via `/api/generate-narrative`. The PDF is generated server-side via `/api/generate-pdf`.

---

## Documentation

| File | Contents |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Product bible — single source of truth for all architecture decisions |
| [`lib/governance-kb.json`](lib/governance-kb.json) | Six governance elements with regulatory anchors, consequence text, and reliability reductions |
| [`lib/benchmarks.json`](lib/benchmarks.json) | Sector benchmarks for financial input hint text |
| [`lib/sdg-kb.json`](lib/sdg-kb.json) | SDG mapping table keyed by Q1 decision type and Q4 sector |
| [`lib/calculations.ts`](lib/calculations.ts) | Shared financial calculation formula (no framework dependencies) |
