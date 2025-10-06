import React, { useMemo, useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/shared/Card'
import { ProgressBar } from '../components/shared/ProgressBar'
import { Address } from '../components/shared/Address'
import { AssetHero } from '../components/dashboard/AssetHero'
import { RoleBanner } from '../components/layout/RoleBanner'
import { useTokenMetadata } from '../hooks/useToken'
import { formatEther } from 'viem'

export const DashboardPage: React.FC = () => {
  const { data, isLoading } = useTokenMetadata()

  const name = data?.name || '—'
  const location = data?.location || '—'
  const tokenPriceEth = data ? Number(formatEther(data.tokenPriceWei)) : 0.001
  const totalRaisedEth = data?.totalRaisedWei ? Number(formatEther(data.totalRaisedWei)) : 0
  const sold = data?.totalSupply ? Number(data.totalSupply / BigInt(1e18)) : 0
  const cap = 1_000_000

  const hero = {
    title: name,
    subtitle: location,
    imageUrl: undefined,
    tags: ['Core Real Estate', 'Grade A', 'Singapore']
  }

  const [ethInput, setEthInput] = useState('')
  const tokens = useMemo(() => {
    const v = Number(ethInput)
    if (Number.isNaN(v) || v <= 0) return 0
    return Math.floor(v / tokenPriceEth)
  }, [ethInput, tokenPriceEth])

  return (
    <div className="min-h-full">
      <Header />
      <main className="container py-6 grid gap-6">
        <RoleBanner />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Offering</h1>
            <p className="text-sm text-neutral-700">Institutional tokenized real estate</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid gap-6">
            <AssetHero title={hero.title} subtitle={hero.subtitle} imageUrl={hero.imageUrl} tags={hero.tags} priceEth={tokenPriceEth.toString()} raisedEth={totalRaisedEth.toString()} />

            <Card title="Tokenization Progress">
              <div className="grid gap-3">
                <ProgressBar value={sold} max={cap} />
                <div className="flex items-center justify-between text-sm text-neutral-700 tabular-nums">
                  <span>{sold.toLocaleString()} sold</span>
                  <span>{cap.toLocaleString()} available</span>
                </div>
              </div>
            </Card>

            <Card title="About this asset">
              <p className="text-sm text-neutral-700 leading-relaxed">
                {name} is a Grade A office tower located in {location}. Values shown are read live from the deployed
                contract: token price and totals. This interface is optimized for institutional demonstrations.
              </p>
            </Card>

            <Card title="Details">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between border rounded px-3 py-2 bg-neutral-100"><span>Supported Chains</span><span className="font-medium">Localhost 31337</span></div>
                <div className="flex items-center justify-between border rounded px-3 py-2 bg-neutral-100"><span>Underlying Asset Ticker</span><span className="font-medium">RET</span></div>
                <div className="flex items-center justify-between border rounded px-3 py-2 bg-neutral-100"><span>Token price</span><span className="font-medium tabular-nums">{tokenPriceEth} ETH</span></div>
                <div className="flex items-center justify-between border rounded px-3 py-2 bg-neutral-100"><span>Total raised</span><span className="font-medium tabular-nums">{totalRaisedEth} ETH</span></div>
              </div>
            </Card>
          </div>

          {/* Right: Purchase Panel (UI only) */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-md border p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3">
                <div className="inline-flex rounded-full bg-neutral-100 p-1 text-xs">
                  <span className="px-3 py-1 rounded-full bg-white border">Buy</span>
                  <span className="px-3 py-1">Sell</span>
                </div>
                <div className="text-xs text-neutral-700 pr-1">Ethereum</div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-neutral-700">Pay</label>
                  <div className="mt-1 flex">
                    <input className="flex-1 border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" value={ethInput} onChange={(e)=>setEthInput(e.target.value)} />
                    <span className="border border-l-0 rounded-r px-3 py-2 bg-neutral-100 text-sm">ETH</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-neutral-700">Receive</label>
                  <div className="mt-1 flex">
                    <input className="flex-1 border rounded-l px-3 py-2 bg-neutral-100" value={tokens} readOnly />
                    <span className="border border-l-0 rounded-r px-3 py-2 bg-neutral-100 text-sm">RET</span>
                  </div>
                </div>
                <div className="text-xs text-neutral-700">
                  Rate <span className="tabular-nums">1 token = {tokenPriceEth} ETH</span>
                </div>
                <button className="w-full bg-primary text-white px-4 py-3 rounded disabled:opacity-50" disabled>
                  Sign In to Continue
                </button>
                <div className="text-[11px] text-neutral-700 leading-relaxed border-t pt-3">
                  By proceeding you agree that this is a demo interface. Tokens are offered only on the local Anvil
                  network for development and testing; not an investment solicitation.
                </div>
                <details className="text-[11px] text-neutral-700">
                  <summary className="cursor-pointer">Need help?</summary>
                  <p className="mt-2">Switch wallets using RainbowKit. Ensure chain is Localhost (31337). Deploy contracts via Foundry before interacting.</p>
                </details>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
