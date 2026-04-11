'use client'

import GovernanceGate from './GovernanceGate'

export default function GovernanceGateSection() {
  return (
    <GovernanceGate
      onScoreChange={(score, count, elements) =>
        console.log('Score:', score, '| Confirmed:', count, '| Elements:', elements)
      }
      q2Answer=""
    />
  )
}
