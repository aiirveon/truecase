// ─── SDG mapping ─────────────────────────────────────────────────────────────
// SDG mapping is now determined entirely by Claude from the use case description.
// The hardcoded per-use-case mapping has been removed.
// This function is retained for interface compatibility — always returns [].
// See app/api/generate-narrative/route.ts for the Claude prompt instruction.

import type { SDGItem } from './types'

export function getSDGMapping(_useCase: string): SDGItem[] {
  return []
}
