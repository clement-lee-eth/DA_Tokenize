import React, { useMemo, useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/shared/Card'
import { RoleBadge } from '../components/shared/RoleBadge'

export const InvestPage: React.FC = () => {
  // Placeholder state
  const [ethInput, setEthInput] = useState('')
  const role: 'SERVICE_PROVIDER' | 'WHITELISTED' | 'NON_WHITELISTED' | 'DISCONNECTED' = 'DISCONNECTED'
  const tokenPriceEth = 0.001
  const tokens = useMemo(() => {
    const v = Number(ethInput)
    if (Number.isNaN(v) || v <= 0) return 0
    return Math.floor(v / tokenPriceEth)
  }, [ethInput])

  return (
    <div className="min-h-full">
      <Header />
      <main className="container py-6 grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Invest</h1>
          <RoleBadge role={role} />
        </div>

        <Card title="Purchase tokens">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-neutral-700">Pay (ETH)</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.0"
                value={ethInput}
                onChange={(e) => setEthInput(e.target.value)}
              />
              <p className="text-xs text-neutral-700">Price: {tokenPriceEth} ETH / token</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-neutral-700">Receive (tokens)</label>
              <input className="w-full border rounded px-3 py-2 bg-neutral-100" value={tokens} readOnly />
              <button className="mt-4 bg-primary text-white px-4 py-2 rounded disabled:opacity-50" disabled>
                Purchase (disabled in UI‑only mode)
              </button>
            </div>
          </div>
        </Card>

        <Card title="Your balance">
          <p className="text-neutral-700">0 tokens (placeholder)</p>
        </Card>
      </main>
    </div>
  )
}
