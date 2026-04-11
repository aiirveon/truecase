'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-foreground-muted">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="text-sm text-brand hover:text-brand-hover transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
