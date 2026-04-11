'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Field definitions ────────────────────────────────────────────────────────

interface FieldDef {
  key:         string
  label:       string
  placeholder: string
  hint?:       string        // helper text shown below the input
  type:        'number' | 'textarea'
  urlParam:    string
}

const FIELDS: FieldDef[] = [
  {
    key:         'use_case_description',
    label:       'What does your AI system do?',
    placeholder: 'e.g. "A content moderation system that flags harmful posts on a UK media platform"',
    hint:        'Be specific — this improves SDG mapping and narrative quality.',
    type:        'textarea',
    urlParam:    'description',
  },
  {
    key:         'current_annual_cost',
    label:       'Current annual cost of this process £',
    placeholder: 'e.g. 500000',
    hint:        'The annual cost of doing this manually or without AI today.',
    type:        'number',
    urlParam:    'cost',
  },
  {
    key:         'efficiency_gain_pct',
    label:       'Expected efficiency gain from AI %',
    placeholder: 'e.g. 30',
    type:        'number',
    urlParam:    'efficiency',
  },
  {
    key:         'error_reduction_pct',
    label:       'Expected error or risk reduction %',
    placeholder: 'e.g. 40',
    type:        'number',
    urlParam:    'error_reduction',
  },
  {
    key:         'fine_exposure',
    label:       'Estimated regulatory fine exposure £',
    placeholder: 'Enter 0 if not applicable',
    hint:        'The maximum regulatory penalty if this AI system causes harm. Sector-specific figures shown after sector selection.',
    type:        'number',
    urlParam:    'fines',
  },
  {
    key:         'ai_system_cost',
    label:       'AI system annual cost £',
    placeholder: 'e.g. 60000',
    type:        'number',
    urlParam:    'ai_cost',
  },
]

// ─── Shared class strings ─────────────────────────────────────────────────────

const labelClass =
  'block text-xs font-medium uppercase tracking-wide text-foreground-muted mb-1.5'

const hintClass = 'mt-1.5 text-xs text-foreground-subtle'

const inputBase =
  'w-full rounded border border-border bg-surface-raised px-3 py-2 text-sm ' +
  'text-foreground placeholder:text-foreground-subtle ' +
  'focus:border-brand focus:outline-none focus:ring-0 ' +
  'transition-colors duration-150'

// ─── Component ────────────────────────────────────────────────────────────────

interface CalculatorProps {
  onValuesChange?: (inputs: Record<string, string>) => void
  onCalculate?:   () => void
}

export default function Calculator({ onValuesChange, onCalculate }: CalculatorProps) {
  const searchParams = useSearchParams()
  const [values, setValues] = useState<Record<string, string>>({})

  // Stable callback refs — avoid listing callbacks in effect deps
  const onValuesChangeRef = useRef(onValuesChange)
  useEffect(() => { onValuesChangeRef.current = onValuesChange })

  const onCalculateRef = useRef(onCalculate)
  useEffect(() => { onCalculateRef.current = onCalculate })

  // Notify parent whenever inputs change
  useEffect(() => {
    onValuesChangeRef.current?.(values)
  }, [values])

  // Pre-fill from URL parameters on mount
  useEffect(() => {
    const prefilled: Record<string, string> = {}
    FIELDS.forEach((field) => {
      const val = searchParams.get(field.urlParam)
      if (val) prefilled[field.key] = val
    })
    if (Object.keys(prefilled).length > 0) {
      setValues(prefilled)
    }
  }, [searchParams])

  // Button enabled when description is non-empty and all numeric fields are non-empty
  const allFilled =
    (values['use_case_description'] ?? '').trim() !== '' &&
    FIELDS.filter((f) => f.type === 'number').every(
      (f) => (values[f.key] ?? '').trim() !== ''
    )

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleCalculateClick() {
    onCalculateRef.current?.()
  }

  return (
    <div className="space-y-8">

      {/* ── Input fields ───────────────────────────────────────── */}
      <div className="space-y-6">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className={labelClass}>
              {field.label}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.key}
                rows={3}
                value={values[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`${inputBase} resize-none`}
              />
            ) : (
              <input
                id={field.key}
                type="number"
                min="0"
                value={values[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`${inputBase} font-mono`}
              />
            )}

            {field.hint && (
              <p className={hintClass}>{field.hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Calculate button ───────────────────────────────────── */}
      <button
        type="button"
        disabled={!allFilled}
        onClick={handleCalculateClick}
        className="w-full rounded bg-brand px-4 py-3 text-sm font-medium text-white
                   transition-colors duration-150
                   hover:bg-brand-hover
                   disabled:cursor-not-allowed disabled:opacity-40"
      >
        Calculate ROI
      </button>

    </div>
  )
}
