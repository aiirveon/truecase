import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Page not found
        </h2>
        <p className="text-sm text-foreground-muted">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="text-sm text-brand hover:text-brand-hover transition-colors"
        >
          Back to TrueCase
        </Link>
      </div>
    </main>
  )
}
