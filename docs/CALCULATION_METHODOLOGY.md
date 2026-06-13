# TrueCase — Calculation Methodology

This document describes how TrueCase turns six user-supplied figures into the
financial projection shown on screen and in the PDF/HTML exports. It is a
business-analysis artefact: it states the formulas, the design decisions behind
them, and — just as importantly — their limitations.

The single source of truth for the maths is [`lib/calculations.ts`](../lib/calculations.ts).
Every surface (on-screen cards, PDF, HTML, and the figures sent to Claude for the
narrative) reads from that function. No surface recomputes the numbers.

---

## 1. The six inputs

| Input | Meaning |
|---|---|
| **Current annual cost** (`currentAnnualCost`, £) | What the existing process costs per year today — staff time, manual handling, rework. The baseline the AI is meant to reduce. |
| **Efficiency gain** (`efficiencyGain`, 0–100%) | The share of that current annual cost the AI is expected to remove. 30% means the process is expected to cost 30% less per year. |
| **Error / risk reduction** (`errorReduction`, 0–100%) | The share of the organisation's regulatory fine exposure the AI is expected to remove by reducing errors. Feeds the *risk* figure only — never the realised savings. |
| **Regulatory fine exposure** (`fineExposure`, £) | The maximum plausible regulatory penalty the organisation faces in this area (e.g. a statutory maximum from the knowledge base). A hypothetical downside, not a cost being paid today. |
| **AI system annual cost** (`aiSystemCost`, £) | The all-in annual cost of running the AI system — licence, infrastructure, oversight. |
| **Context note** (`contextNote`, text) | Free-text description of the use case. Used for labelling/filenames only; not part of the calculation. |

---

## 2. The formulas

```
realisedSavings  = currentAnnualCost × (efficiencyGain / 100)
riskReduction    = fineExposure × (errorReduction / 100) × 0.3
systemCost       = aiSystemCost
netAnnualBenefit = realisedSavings − systemCost
roiPercent       = (netAnnualBenefit / systemCost) × 100
breakEvenMonths  = systemCost / (realisedSavings / 12)
```

- **`realisedSavings`** — money the organisation actually stops spending each year.
- **`riskReduction`** — a *risk-adjusted hypothetical*: the expected value of
  regulatory downside removed. It is reported as its own figure and is **never**
  added into `netAnnualBenefit` or `roiPercent`.
- **`netAnnualBenefit`** — realised savings after paying for the system. This is
  the headline benefit.
- **`roiPercent`** — return on the system cost, computed **from realised savings
  only**.
- **Break-even** — months to recover the system cost from realised savings. It is
  formatted with two honest floors:
  - if `realisedSavings ≤ 0` (nothing realised to recover the cost) → `—`;
  - if the raw value is under one month → `< 1 month` (never a misleading
    "0 months").

A reliability-adjusted net benefit (`netAnnualBenefit × reliabilityScore / 100`)
is also shown. The reliability score comes from the governance assessment and
discounts the benefit by how much of the governance framework is unconfirmed.

---

## 3. Why realised savings and avoided risk are kept separate

This is the central design decision, and it replaces an earlier model that blended
the two.

The previous formula added a fraction of the hypothetical fine into a single
`projectedGain` and then computed ROI on that blend. That was wrong on two counts:

1. **Conceptually.** Avoided fines are *risk-adjusted hypotheticals* — money the
   organisation might never have lost — not realised income. Adding them to real
   efficiency savings and presenting the total as "the gain" overstates the case
   and obscures what is actually money saved. A CFO reading "£90m gain" should be
   able to see how much of that is cash and how much is avoided risk.

2. **Mechanically.** Because `fineExposure` can be very large (statutory maxima
   run to tens of millions), the fine term could dominate `projectedGain`. ROI is
   `gain / systemCost`, so a large fine against a small system cost produced
   absurd, credibility-destroying figures (observed in production: a
   £90,968,230 "gain" at 1,350,980% ROI with a one-month break-even).

Separating the two fixes both problems. Realised savings drive ROI and
break-even; risk reduction is shown alongside as clearly-labelled avoided
downside. Because the fine term is no longer in ROI, a large fine exposure can no
longer inflate or explode the return.

---

## 4. The 0.3 risk coefficient

`riskReduction` multiplies the avoided fine exposure by **0.3**. This is a
deliberate, directional haircut representing the rough joint probability that the
fine would (a) actually have been levied and (b) at the modelled severity. It is
**not** an actuarial or probability-of-default figure derived from loss data — it
is a single flat assumption applied uniformly across all sectors and use cases.

It is intentionally conservative (it discounts the headline exposure by 70%) so
that the risk figure errs towards understatement rather than overstatement. Any
organisation relying on the risk figure for a real decision should replace this
coefficient with a sector- and scenario-specific probability.

---

## 5. The ROI sanity ceiling

`ROI_SANITY_CEILING` (in `lib/calculations.ts`, currently **2,000%**) is a
**secondary safety net**, not the primary guard. When `roiPercent` exceeds it, the
`roiExceedsRange` flag is set and every surface shows an honest advisory
("Exceeds typical range") instead of the literal number; the Generate button is
also disabled so no implausible report is produced.

With the fine term removed from ROI, the old runaway path (millions of percent
from fine exposure) can no longer occur, so the ceiling was lowered from the
previous 10,000%. The remaining failure mode is a mis-entered (too-low) system
cost. Because `efficiencyGain` is capped at 100%, `realisedSavings ≤
currentAnnualCost`, so genuinely strong automation (high efficiency, low-cost
tool) can legitimately reach roughly **1,000–1,600%** ROI. A lower ceiling such as
500% would therefore false-positive on real, defensible cases — and since the flag
now also disables generation, a false positive would block a legitimate report.
**2,000%** (net benefit greater than 20× the system cost, i.e. system cost under
~5% of realised savings) sits above realistic strong cases but below the absurd,
so it reliably indicates a data-entry error. The primary guard remains the
separate check that the system cost is at least 1% of the current annual cost.

---

## 6. Limitations

- **Directional, not investment-grade.** TrueCase produces an indicative business
  case to support a conversation, not a certified financial model. Outputs should
  not be used as the sole basis for a funding decision.
- **Self-reported inputs.** Every figure is entered by the user. TrueCase does not
  verify current cost, efficiency, error rates, or system cost. Garbage in,
  garbage out — the guards catch only gross implausibility, not optimistic inputs.
- **Single flat assumptions.** The 0.3 risk coefficient and the uniform treatment
  across sectors are simplifications. Real exposure varies by jurisdiction,
  enforcement history, and scenario.
- **No discounting or multi-year modelling.** All figures are single-year and
  undiscounted. There is no NPV, no ramp-up, no decommissioning cost, no
  sensitivity analysis.
- **Risk reduction is a hypothetical.** It represents avoided downside, not cash.
  It is reported separately precisely so it is never mistaken for realised return.

### Hardening this to investment-grade

Turning this into an investment-grade model is **out of scope for the current
tool and would require a finance subject-matter expert.** At minimum it would
need: probability-weighted, sector-specific risk modelling (replacing the flat
0.3); multi-year cash-flow projection with discounting (NPV/IRR); explicit
treatment of implementation, ramp-up and ongoing oversight costs; sensitivity and
scenario analysis; and validation of inputs against audited figures rather than
self-report. Those are finance-domain decisions, not engineering ones, and should
be owned by a qualified practitioner.
