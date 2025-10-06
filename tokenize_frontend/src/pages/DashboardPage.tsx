import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/shared/Card'
import { ProgressBar } from '../components/shared/ProgressBar'
import { Address } from '../components/shared/Address'
import { AssetHero } from '../components/dashboard/AssetHero'
import { RoleBanner } from '../components/layout/RoleBanner'
import { WalletInfo } from '../components/layout/WalletInfo'
import { useTokenMetadata } from '../hooks/useToken'
import { useRole } from '../hooks/useRole'
import { usePurchase } from '../hooks/usePurchase'
import { useTokenHolders } from '../hooks/useTokenHolders'
import { useWhitelistedInvestors } from '../hooks/useWhitelistedInvestors'
import { useWalletBalance } from '../hooks/useWalletBalance'
import { useMaxHolding } from '../hooks/useCompliance'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import toast from 'react-hot-toast'

export const DashboardPage: React.FC = () => {
  const { data, isLoading, refetch: refetchTokenData } = useTokenMetadata()
  const { address, isConnected } = useAccount()
  const { role, isLoading: roleLoading } = useRole()
  const { purchaseTokens, isPurchasing, isPurchaseConfirming, purchaseHash, getTransactionState, transactionStates } = usePurchase()
  const { holders } = useTokenHolders()
  const { whitelistedInvestors } = useWhitelistedInvestors()
  const { refetchTokenBalance, managerBalance } = useWalletBalance()
  const { tokensLimit, tokensHeld } = useMaxHolding()

  const name = data?.name || '—'
  const location = data?.location || '—'
  const tokenPriceEth = data ? Number(formatEther(data.tokenPriceWei)) : 0.001
  const totalRaisedEth = data?.totalRaisedWei ? Number(formatEther(data.totalRaisedWei)) : 0
  const propertyValue = data?.totalValue ? `$${(Number(data.totalValue) / 1e6).toFixed(0)}M` : undefined
  const sold = data?.totalSupply ? Number(data.totalSupply / BigInt(1e18)) : 0
  const cap = 1_000_000

  // Determine if user can purchase tokens
  const canPurchase = isConnected && role === 'WHITELISTED'
  const isServiceProvider = role === 'SERVICE_PROVIDER'
  const isNonWhitelisted = role === 'NON_WHITELISTED'

  // Toast notifications for key events (debounced + role-change only)
  const prevRoleRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!isConnected || !address || roleLoading) return

    // Only toast on actual role change after first stable role load
    if (prevRoleRef.current === undefined) {
      prevRoleRef.current = role
      return
    }

    if (role !== prevRoleRef.current) {
      if (role === 'SERVICE_PROVIDER') {
        toast.success('Service Provider wallet connected', { duration: 3000 })
      } else if (role === 'WHITELISTED') {
        toast.success('Whitelisted investor wallet connected', { duration: 3000 })
      } else if (role === 'NON_WHITELISTED') {
        toast.error('Non-whitelisted wallet connected - Limited access', { duration: 4000 })
      }
      prevRoleRef.current = role
    }
  }, [isConnected, address, role, roleLoading])

  // Handle purchase transaction states
  useEffect(() => {
    if (purchaseHash) {
      const state = getTransactionState(purchaseHash)
      if (state === 'initiated') {
        toast.loading('Purchase initiated...', {
          id: 'purchase-initiated',
          duration: Infinity,
        })
      } else if (state === 'confirming') {
        toast.loading('Confirming purchase transaction...', {
          id: 'purchase-confirming',
          duration: Infinity,
        })
      }
    }
  }, [purchaseHash, getTransactionState])

  // Drive purchase toasts and instant refetch based on tx state (mirrors whitelist speed)
  useEffect(() => {
    if (!purchaseHash) return
    const state = getTransactionState(purchaseHash)
    if (state === 'initiated') {
      toast.loading('Purchase initiated...', { id: 'purchase-initiated', duration: Infinity })
    } else if (state === 'confirming') {
      toast.loading('Confirming purchase transaction...', { id: 'purchase-confirming', duration: Infinity })
    } else if (state === 'success') {
      toast.dismiss('purchase-initiated')
      toast.dismiss('purchase-confirming')
      toast.success('Purchase confirmed!', { id: 'purchase-success', duration: 3500 })
      // Instant refetch to update totals/balances without refresh
      refetchTokenData()
      refetchTokenBalance()
    }
  }, [purchaseHash, getTransactionState])

  // Refetch when account changes
  useEffect(() => {
    if (!address) return
    refetchTokenData()
    refetchTokenBalance()
  }, [address])

  const hero = {
    title: name,
    subtitle: location,
    imageUrl: undefined,
    tags: ['Core Real Estate', 'Grade A', 'Singapore']
  }

  // Flip inputs: MBST input → ETH required output
  const [mbstInput, setMbstInput] = useState('')
  const tokensToBuy = useMemo(() => {
    const v = Number(mbstInput.replace(/,/g, ''))
    if (Number.isNaN(v) || v <= 0) return 0
    return Math.floor(v)
  }, [mbstInput])

  const ethRequired = useMemo(() => {
    return tokensToBuy * tokenPriceEth
  }, [tokensToBuy, tokenPriceEth])

  return (
    <div className="min-h-full">
      <Header />
      <main className="container py-6 grid gap-6">
        <div className="flex items-center justify-between">
          <RoleBanner />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Offering</h1>
            <p className="text-sm text-neutral-700">Institutional tokenized real estate</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 grid gap-6">
            <AssetHero title={hero.title} subtitle={hero.subtitle} imageUrl={hero.imageUrl} tags={hero.tags} priceEth={tokenPriceEth.toString()} raisedEth={totalRaisedEth.toString()} propertyValue={propertyValue} />

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
                <div className="flex items-center justify-between border rounded px-3 py-2 bg-neutral-100"><span>Underlying Asset Ticker</span><span className="font-medium">MBST</span></div>
                <div className="flex items-center justify-between border rounded px-3 py-2 bg-neutral-100"><span>Token price</span><span className="font-medium tabular-nums">{tokenPriceEth.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 6 })} ETH</span></div>
                <div className="flex items-center justify-between border rounded px-3 py-2 bg-neutral-100"><span>Total raised</span><span className="font-medium tabular-nums">{totalRaisedEth.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 6 })} ETH</span></div>
              </div>
            </Card>
          </div>

          {/* Right: Purchase Panel or Service Provider Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Info */}
            <WalletInfo />

            {isServiceProvider ? (
              <div className="space-y-6">
                {/* Compliance Manager Pool */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-700">
                          <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-purple-900">Compliance Manager Pool</h3>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-900 tabular-nums">{Number(managerBalance || '0').toLocaleString()}</div>
                  <div className="text-sm text-purple-700">MBST held for clawbacks</div>
                </div>

                <div className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-900">Whitelisted Investors</h3>
                  </div>
                  <p className="text-sm text-emerald-700 mb-4">Currently whitelisted investors eligible to purchase tokens</p>
                  <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                    {whitelistedInvestors.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm8 4a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <p className="text-sm text-emerald-600 font-medium">No whitelisted investors yet</p>
                          <p className="text-xs text-emerald-500 mt-1">Use the Admin panel to whitelist investors</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {whitelistedInvestors.map((investor) => (
                          <div key={investor.address} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <div>
                                <div className="font-medium text-slate-900">{investor.name}</div>
                                <Address value={investor.address} />
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                              Whitelisted
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">Investor Balances</h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">Current token holders and their balances</p>
                  <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                    {holders.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <p className="text-sm text-blue-600 font-medium">No token holders yet</p>
                          <p className="text-xs text-blue-500 mt-1">Investors will appear here after purchasing tokens</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {holders.map((holder) => (
                          <div key={holder.address} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <Address value={holder.address} />
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-900">
                                {(parseFloat(holder.balance) / 1e18).toLocaleString()}
                              </div>
                              <div className="text-sm fontMedium text-blue-700">MBST</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Purchase Tokens</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    <img src="/src/assets/eth_logo.png" alt="ETH" width="12" height="12" />
                    Ethereum
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Amount to Purchase</label>
                    <div className="relative">
                      <input 
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                        placeholder="0" 
                        value={mbstInput}
                        onChange={(e)=>{
                          const raw = e.target.value.replace(/,/g, '')
                          if (/^\d*$/.test(raw)) {
                            const withCommas = raw ? Number(raw).toLocaleString() : ''
                            setMbstInput(withCommas)
                          }
                        }} 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-600">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-violet-600"></div>
                        <span className="text-sm font-medium">MBST</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-600">
                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">You Will Pay</label>
                    <div className="relative">
                      <input 
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-20 bg-slate-50 text-slate-700 tabular-nums" 
                        value={ethRequired > 0 ? ethRequired.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 }) : '0'} 
                        readOnly 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-600">
                        <img src="/src/assets/eth_logo.png" alt="ETH" width="14" height="14" />
                        <span className="text-sm font-medium">ETH</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Exchange Rate</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        1 MBST = {tokenPriceEth.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 6 })} 
                        <img src="/src/assets/eth_logo.png" alt="ETH" width="12" height="12" />
                        ETH
                      </span>
                    </div>
                  </div>

                  {!isConnected ? (
                    <button className="w-full bg-slate-300 text-slate-600 px-4 py-4 rounded-xl font-medium cursor-not-allowed" disabled>
                      Connect Wallet to Continue
                    </button>
                  ) : isServiceProvider ? (
                    <button className="w-full bg-amber-100 text-amber-700 px-4 py-4 rounded-xl font-medium cursor-not-allowed" disabled>
                      Service Providers Cannot Purchase
                    </button>
                  ) : isNonWhitelisted ? (
                    <button className="w-full bg-red-100 text-red-700 px-4 py-4 rounded-xl font-medium cursor-not-allowed" disabled>
                      Not Whitelisted - Cannot Purchase
                    </button>
                  ) : canPurchase ? (
                    (() => {
                      const state = purchaseHash ? getTransactionState(purchaseHash) : 'idle'
                      const isBusy = state === 'initiated' || state === 'confirming'
                      const label = state === 'initiated' ? 'Submitting…' : state === 'confirming' ? 'Confirming…' : `Purchase ${tokensToBuy.toLocaleString()} Tokens`
                      return (
                        <button 
                          className="w-full bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-4 rounded-xl font-medium hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={async () => {
                            const raw = mbstInput.replace(/,/g, '')
                            const qty = Number(raw)
                            if (!raw || Number.isNaN(qty) || qty <= 0) {
                              toast.error('Please enter a valid MBST amount')
                              return
                            }
                            try {
                              const rawNow = mbstInput.replace(/,/g, '')
                              const qtyNow = Number(rawNow)
                              const ethAmount = (qtyNow * tokenPriceEth).toString()
                              await purchaseTokens(ethAmount, () => {
                                toast.dismiss('purchase-initiated')
                                toast.dismiss('purchase-confirming')
                                toast.success(`Successfully purchased ${qtyNow.toLocaleString()} MBST tokens!`, { id: 'purchase-success', duration: 4000 })
                                refetchTokenData()
                                refetchTokenBalance()
                              })
                            } catch (error: any) {
                              toast.dismiss('purchase-initiated')
                              toast.dismiss('purchase-confirming')
                              toast.error((error?.message || 'Purchase failed') as string, { id: 'purchase-error', duration: 5000 })
                            }
                          }}
                          disabled={isBusy || !mbstInput || Number(mbstInput.replace(/,/g, '')) <= 0}
                        >
                          {label}
                        </button>
                      )
                    })()
                  ) : roleLoading ? (
                    <button className="w-full bg-slate-300 text-slate-600 px-4 py-4 rounded-xl font-medium cursor-not-allowed" disabled>
                      Checking Role...
                    </button>
                  ) : (
                    <button className="w-full bg-red-100 text-red-700 px-4 py-4 rounded-xl font-medium cursor-not-allowed" disabled>
                      Not Whitelisted - Cannot Purchase
                    </button>
                  )}

                  <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
                    By proceeding you agree that this is a demo interface. Tokens are offered only on the local Anvil
                    network for development and testing; not an investment solicitation.
                  </div>
                  
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-700 transition-colors">Need help?</summary>
                    <p className="mt-2 text-slate-600">Switch wallets using RainbowKit. Ensure chain is Localhost (31337). Deploy contracts via Foundry before interacting.</p>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
