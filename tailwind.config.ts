import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:       'var(--background)',
        surface:          'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        'surface-muted':  'var(--surface-muted)',
        foreground:       'var(--foreground)',
        'foreground-muted':   'var(--foreground-muted)',
        'foreground-subtle':  'var(--foreground-subtle)',
        brand:            'var(--brand)',
        'brand-hover':    'var(--brand-hover)',
        'brand-subtle':   'var(--brand-subtle)',
        border:           'var(--border)',
        'border-strong':  'var(--border-strong)',
        'border-brand':   'var(--border-brand)',
        'score-high':     'var(--score-high)',
        'score-mid':      'var(--score-mid)',
        'score-low':      'var(--score-low)',
        'score-high-bg':  'var(--score-high-bg)',
        'score-mid-bg':   'var(--score-mid-bg)',
        'score-low-bg':   'var(--score-low-bg)',
        confirmed:        'var(--confirmed)',
        partial:          'var(--partial)',
        missing:          'var(--missing)',
        'confirmed-bg':   'var(--confirmed-bg)',
        'partial-bg':     'var(--partial-bg)',
        'missing-bg':     'var(--missing-bg)',
        destructive:      'var(--destructive)',
        ring:             'var(--ring)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)',
        lg: 'calc(var(--radius) + 2px)',
      },
    },
  },
  plugins: [],
}

export default config
