import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRole } from '../hooks/useRole'
import { useWhitelist } from '../hooks/useWhitelist'
import { useClawback } from '../hooks/useClawback'
import { useTokenHolders } from '../hooks/useTokenHolders'
import { useReadContract, useWatchContractEvent } from 'wagmi'
import { COMPLIANCE_MANAGER_ADDRESS, REAL_ESTATE_TOKEN_ADDRESS, ABIS } from '../config/contracts'
import { Card } from '../components/shared/Card'
import { Address } from '../components/shared/Address'
import { RoleBanner } from '../components/layout/RoleBanner'
import { Header } from '../components/layout/Header'
import { ResetWallet } from '../components/shared/ResetWallet'
import { formatEther, parseUnits } from 'viem'
import toast from 'react-hot-toast'

export const AdminPage: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { role, isLoading: roleLoading } = useRole()
  const { 
    whitelistInvestor, 
    blacklistInvestor, 
    isWhitelisting, 
    isBlacklisting, 
    isWhitelistLoading, 
    isBlacklistLoading, 
    isWhitelistSuccess, 
    isBlacklistSuccess,
    whitelistHash,
    blacklistHash,
    getTransactionState,
    isWhitelistConfirming,
    isBlacklistConfirming,
    getPendingTransaction,
    refetchWhitelist
  } = useWhitelist()

  const { clawbackTokens, isClawingBack, isClawbackConfirming, isClawbackSuccess, clawbackHash, getTransactionState: getClawbackTxState } = useClawback()
  const { holders, isLoading: holdersLoading, refetchAll: refetchHolders } = useTokenHolders()
  
  const [clawbackAddress, setClawbackAddress] = useState('')
  const [clawbackAmount, setClawbackAmount] = useState('')
  const [managerAbi, setManagerAbi] = useState<any>(null)
  const [tokenAbi, setTokenAbi] = useState<any>(null)

  const isServiceProvider = role === 'SERVICE_PROVIDER'

  // Demo investor addresses (Anvil accounts)
  const demoInvestors = [
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Investor A' },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Investor B' },
  ]

  // Load ABIs
  useEffect(() => {
    let cancelled = false
    ABIS.ComplianceManager().then((abi) => { if (!cancelled) setManagerAbi(abi) }).catch(() => {})
    ABIS.RealEstateToken().then((abi) => { if (!cancelled) setTokenAbi(abi) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Check whitelist status for each investor
  const { data: investorAWhitelisted, refetch: refetchA } = useReadContract({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    functionName: 'isWhitelisted',
    args: [demoInvestors[0].address as `0x${string}`],
    query: { enabled: !!managerAbi }
  })

  const { data: investorBWhitelisted, refetch: refetchB } = useReadContract({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    functionName: 'isWhitelisted',
    args: [demoInvestors[1].address as `0x${string}`],
    query: { enabled: !!managerAbi }
  })

  // Fallback: If transaction receipt is successful, trigger refetch and show success toast
  useEffect(() => {
    if (isWhitelistSuccess && whitelistHash) {
      console.log('🔄 AdminPage: Transaction receipt successful, triggering fallback refetch')
      // Small delay to allow event listeners to fire first
      setTimeout(() => {
        refetchA()
        refetchB()
        // Show success toast as fallback if event listeners didn't work
        toast.dismiss('whitelist-initiated')
        toast.dismiss('whitelist-confirming')
        toast.success('Investor whitelisted successfully!', {
          id: 'whitelist-success-fallback',
          duration: 4000,
        })
      }, 1000)
    }
  }, [isWhitelistSuccess, whitelistHash, refetchA, refetchB])

  // Fallback: If blacklist transaction receipt is successful, trigger refetch and show success toast
  useEffect(() => {
    if (isBlacklistSuccess && blacklistHash) {
      console.log('🔄 AdminPage: Blacklist transaction receipt successful, triggering fallback refetch')
      // Small delay to allow event listeners to fire first
      setTimeout(() => {
        refetchA()
        refetchB()
        // Show success toast as fallback if event listeners didn't work
        toast.dismiss('blacklist-initiated')
        toast.dismiss('blacklist-confirming')
        toast.success('Investor blacklisted successfully!', {
          id: 'blacklist-success-fallback',
          duration: 4000,
        })
      }, 1000)
    }
  }, [isBlacklistSuccess, blacklistHash, refetchA, refetchB])

  // Debug whitelist status changes
  useEffect(() => {
    console.log('📊 AdminPage: Investor A whitelist status changed to:', investorAWhitelisted)
    console.log('📊 AdminPage: Investor A address:', demoInvestors[0].address)
  }, [investorAWhitelisted])

  useEffect(() => {
    console.log('📊 AdminPage: Investor B whitelist status changed to:', investorBWhitelisted)
    console.log('📊 AdminPage: Investor B address:', demoInvestors[1].address)
  }, [investorBWhitelisted])

  // Get token balance for clawback address
  const { data: clawbackBalance, refetch: refetchClawbackBalance } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'balanceOf',
    args: clawbackAddress ? [clawbackAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAbi && !!clawbackAddress && clawbackAddress.length === 42 }
  })

  // Watch for whitelist events to trigger immediate refetch
  useWatchContractEvent({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    eventName: 'InvestorWhitelisted',
    onLogs: (logs) => {
      console.log('🔍 AdminPage: InvestorWhitelisted event received:', logs)
      logs.forEach((log) => {
        const investorAddress = log.args.investor as string
        console.log('🔄 AdminPage: Event for investor:', investorAddress)
        console.log('🔍 Comparing with Investor A:', demoInvestors[0].address.toLowerCase())
        console.log('🔍 Comparing with Investor B:', demoInvestors[1].address.toLowerCase())
        
        // Only refetch the specific investor that was whitelisted
        if (investorAddress.toLowerCase() === demoInvestors[0].address.toLowerCase()) {
          console.log('✅ Event matches Investor A - refetching A only')
          refetchA()
        } else if (investorAddress.toLowerCase() === demoInvestors[1].address.toLowerCase()) {
          console.log('✅ Event matches Investor B - refetching B only')
          refetchB()
        } else {
          console.log('❌ Event address does not match any demo investor')
        }
      })
    },
  })

  useWatchContractEvent({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    eventName: 'InvestorBlacklisted',
    onLogs: (logs) => {
      console.log('🔍 AdminPage: InvestorBlacklisted event received:', logs)
      logs.forEach((log) => {
        const investorAddress = log.args.investor as string
        console.log('🔄 AdminPage: Refetching specific investor after blacklist:', investorAddress)
        
        // Only refetch the specific investor that was blacklisted
        if (investorAddress.toLowerCase() === demoInvestors[0].address.toLowerCase()) {
          console.log('🔄 Refetching Investor A after blacklist')
          refetchA()
        } else if (investorAddress.toLowerCase() === demoInvestors[1].address.toLowerCase()) {
          console.log('🔄 Refetching Investor B after blacklist')
          refetchB()
        }
      })
    },
  })

  // Get whitelisted investors list
  const whitelistedInvestors = demoInvestors.filter((investor, index) => {
    if (index === 0) return investorAWhitelisted
    if (index === 1) return investorBWhitelisted
    return false
  })

  // Debug whitelisted investors
  useEffect(() => {
    console.log('📋 Whitelisted investors count:', whitelistedInvestors.length)
    console.log('📋 Investor A whitelisted:', investorAWhitelisted)
    console.log('📋 Investor B whitelisted:', investorBWhitelisted)
  }, [whitelistedInvestors.length, investorAWhitelisted, investorBWhitelisted])

  // Handle whitelist transaction states - only show success when event is received
  useEffect(() => {
    if (whitelistHash) {
      const state = getTransactionState(whitelistHash)
      if (state === 'initiated') {
        toast.loading('Whitelist investor initiated...', {
          id: 'whitelist-initiated',
          duration: Infinity,
        })
      } else if (state === 'confirming') {
        toast.loading('Confirming whitelist transaction...', {
          id: 'whitelist-confirming',
          duration: Infinity,
        })
        
        // Add a timeout to dismiss the toast if success callback doesn't fire
        const timeout = setTimeout(() => {
          console.log('⏰ Timeout: Dismissing whitelist toasts after 30 seconds')
          toast.dismiss('whitelist-initiated')
          toast.dismiss('whitelist-confirming')
          toast.error('Transaction may have failed or timed out', {
            id: 'whitelist-timeout',
            duration: 5000,
          })
        }, 30000) // 30 second timeout
        
        return () => clearTimeout(timeout)
      }
      // Note: Success toast will be shown when InvestorWhitelisted event is received
    }
  }, [whitelistHash, getTransactionState])

  // Handle blacklist transaction states - only show success when event is received
  useEffect(() => {
    if (blacklistHash) {
      const state = getTransactionState(blacklistHash)
      if (state === 'initiated') {
        toast.loading('Blacklist investor initiated...', {
          id: 'blacklist-initiated',
          duration: Infinity,
        })
      } else if (state === 'confirming') {
        toast.loading('Confirming blacklist transaction...', {
          id: 'blacklist-confirming',
          duration: Infinity,
        })
      }
      // Note: Success toast will be shown when InvestorBlacklisted event is received
    }
  }, [blacklistHash, getTransactionState])

  // Drive clawback toasts/spinner exactly like whitelist
  useEffect(() => {
    if (!clawbackHash) return
    const state = getClawbackTxState(clawbackHash)
    if (state === 'initiated') {
      toast.loading('Clawback initiated...', { id: 'clawback-initiated', duration: Infinity })
    } else if (state === 'confirming') {
      toast.loading('Confirming clawback transaction...', { id: 'clawback-confirming', duration: Infinity })
    } else if (state === 'success') {
      toast.dismiss('clawback-initiated')
      toast.dismiss('clawback-confirming')
      toast.success('Clawback completed', { id: 'clawback-success', duration: 3500 })
      // Refresh holders to reflect removal/updated balances
      refetchHolders()
    }
  }, [clawbackHash, getClawbackTxState, refetchHolders])

  // Real-time refetch of the entered investor's balance when events affect it
  useWatchContractEvent({
    address: tokenAbi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: tokenAbi ?? [],
    eventName: 'TokensPurchased',
    onLogs: (logs) => {
      if (!clawbackAddress) return
      logs.forEach((log: any) => {
        const buyer = (log.args?.buyer as string)?.toLowerCase?.()
        if (buyer && buyer === clawbackAddress.toLowerCase()) {
          // @ts-ignore - refetch is declared below in the file
          refetchClawbackBalance?.()
        }
      })
    },
  })

  useWatchContractEvent({
    address: tokenAbi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: tokenAbi ?? [],
    eventName: 'TokensClawedBack',
    onLogs: (logs) => {
      if (!clawbackAddress) return
      logs.forEach((log: any) => {
        const from = (log.args?.from as string)?.toLowerCase?.()
        if (from && from === clawbackAddress.toLowerCase()) {
          // @ts-ignore
          refetchClawbackBalance?.()
        }
      })
    },
  })

  // Also refresh the displayed balance immediately when clawback confirms
  useEffect(() => {
    if (!clawbackHash) return
    const st = getClawbackTxState(clawbackHash)
    if (st === 'success') {
      // @ts-ignore
      refetchClawbackBalance?.()
    }
  }, [clawbackHash, getClawbackTxState])

  const getHolderBalance = (addr: string): bigint => {
    const h = holders.find(h => h.address.toLowerCase() === addr.toLowerCase())
    try { return h ? BigInt(h.balance) : 0n } catch { return 0n }
  }

  const handleWhitelist = async (investorAddress: string) => {
    console.log('🚀 AdminPage: Starting whitelist for address:', investorAddress)
    console.log('📋 Demo investors:', demoInvestors)
    console.log('🔍 Investor A address:', demoInvestors[0].address)
    console.log('🔍 Investor B address:', demoInvestors[1].address)
    
    try {
      await whitelistInvestor(investorAddress, () => {
        // Success callback - called when InvestorWhitelisted event is received
        console.log('🎯 AdminPage: Success callback triggered for:', investorAddress)
        toast.dismiss('whitelist-initiated')
        toast.dismiss('whitelist-confirming')
        toast.success('Investor whitelisted successfully!', {
          id: 'whitelist-success',
          duration: 4000,
        })
        // Trigger immediate refetch of specific investor only
        console.log('🔄 AdminPage: Manual refetch triggered in success callback for:', investorAddress)
        if (investorAddress.toLowerCase() === demoInvestors[0].address.toLowerCase()) {
          console.log('✅ Refetching Investor A only')
          refetchA()
        } else if (investorAddress.toLowerCase() === demoInvestors[1].address.toLowerCase()) {
          console.log('✅ Refetching Investor B only')
          refetchB()
        } else {
          console.error('❌ Address does not match any demo investor:', investorAddress)
        }
      })
    } catch (error) {
      console.error('❌ AdminPage: Whitelist error:', error)
      toast.error('Failed to whitelist investor')
    }
  }

  const handleBlacklist = async (investorAddress: string) => {
    try {
      await blacklistInvestor(investorAddress, () => {
        // Success callback - called when InvestorBlacklisted event is received
        console.log('🎯 AdminPage: Blacklist success callback triggered for:', investorAddress)
        toast.dismiss('blacklist-initiated')
        toast.dismiss('blacklist-confirming')
        toast.success('Investor blacklisted successfully!', {
          id: 'blacklist-success',
          duration: 4000,
        })
        // Trigger immediate refetch of specific investor only
        console.log('🔄 AdminPage: Manual refetch triggered in blacklist success callback for:', investorAddress)
        if (investorAddress.toLowerCase() === demoInvestors[0].address.toLowerCase()) {
          refetchA()
        } else if (investorAddress.toLowerCase() === demoInvestors[1].address.toLowerCase()) {
          refetchB()
        }
      })
    } catch (error) {
      console.error('❌ AdminPage: Blacklist error:', error)
      toast.error('Failed to blacklist investor')
    }
  }

  const handleClawback = async () => {
    if (!clawbackAddress || !clawbackAmount) {
      toast.error('Please enter address and amount')
      return
    }
    
    try {
      const amountInWei = parseUnits(clawbackAmount, 18).toString()
      await clawbackTokens(clawbackAddress, amountInWei)
      // Success toasts handled by the effect on hash/state
      setClawbackAddress('')
      setClawbackAmount('')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clawback tokens')
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Admin Panel</h1>
            <p className="text-slate-600">Please connect your wallet to access admin functions</p>
          </div>
        </div>
      </div>
    )
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Admin Panel</h1>
            <p className="text-slate-600">Checking role...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isServiceProvider) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <RoleBanner />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Admin Panel</h1>
            <p className="text-red-600">Access denied. Only service providers can access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <RoleBanner />
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-600">Manage investors and token operations</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Investor Management */}
          <div className="space-y-8">
            {/* Whitelist Management */}
            <div className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">Whitelist Management</h3>
                  <p className="text-emerald-700 text-sm">Authorize investors for token purchases</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {demoInvestors.map((investor, index) => {
                  const isWhitelisted = index === 0 ? investorAWhitelisted : investorBWhitelisted
                  return (
                    <div key={investor.address} className="bg-white/80 rounded-xl p-6 border border-emerald-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${isWhitelisted ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <h4 className="font-semibold text-slate-900">{investor.name}</h4>
                            {isWhitelisted && (
                              <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                                Whitelisted
                              </span>
                            )}
                          </div>
                          <Address value={investor.address} />
                        </div>
                        <div className="ml-4">
                          {!isWhitelisted ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleWhitelist(investor.address)
                              }}
                              disabled={isWhitelistLoading(investor.address) || isWhitelistConfirming}
                              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                              {isWhitelistLoading(investor.address) || isWhitelistConfirming ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>{isWhitelistConfirming ? 'Confirming...' : 'Whitelisting...'}</span>
                                </div>
                              ) : (
                                'Whitelist'
                              )}
                            </button>
                          ) : (
                            <div className="px-6 py-3 bg-emerald-100 text-emerald-800 rounded-xl font-medium">
                              ✓ Authorized
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Blacklist Management */}
            <div className="bg-gradient-to-br from-white to-red-50 border border-red-200 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-600">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Blacklist Management</h3>
                  <p className="text-red-700 text-sm">Revoke investor authorization</p>
                </div>
              </div>
              
              {whitelistedInvestors.length === 0 ? (
                <div className="bg-white/80 rounded-xl p-8 border border-red-200 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-600">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm8 4a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">No whitelisted investors</p>
                  <p className="text-red-500 text-sm mt-1">Whitelist investors first to manage blacklist</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {whitelistedInvestors.map((investor) => (
                    <div key={investor.address} className="bg-white/80 rounded-xl p-6 border border-red-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <h4 className="font-semibold text-slate-900">{investor.name}</h4>
                            <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                              Whitelisted
                            </span>
                          </div>
                          <Address value={investor.address} />
                        </div>
                        <div className="ml-4 text-right">
                          {(() => {
                            const bal = getHolderBalance(investor.address)
                            const hasTokens = bal > 0n
                            return (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    if (hasTokens) {
                                      toast.error('Cannot blacklist investor with non-zero balance')
                                      return
                                    }
                                    handleBlacklist(investor.address)
                                  }}
                                  disabled={isBlacklistLoading(investor.address) || isBlacklistConfirming || hasTokens}
                                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                  {isBlacklistLoading(investor.address) || isBlacklistConfirming ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>{isBlacklistConfirming ? 'Confirming…' : 'Blacklisting…'}</span>
                                    </div>
                                  ) : (
                                    'Blacklist'
                                  )}
                                </button>
                                {hasTokens && (
                                  <div className="text-xs text-red-600 mt-2">Balance must be 0 before blacklisting</div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Token Operations */}
          <div className="space-y-8">
            {/* Token Clawback */}
            <div className="bg-gradient-to-br from-white to-orange-50 border border-orange-200 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-600">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900">Token Clawback</h3>
                  <p className="text-orange-700 text-sm">Recover tokens from investors</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Investor Address</label>
                  <input
                    type="text"
                    value={clawbackAddress}
                    onChange={(e) => setClawbackAddress(e.target.value)}
                    placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors font-mono text-sm"
                  />
                </div>
                
                {clawbackAddress && clawbackAddress.length === 42 && clawbackBalance !== undefined && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">Current Balance:</span>
                      <span className="font-bold text-orange-900">
                        {clawbackBalance ? (parseFloat(clawbackBalance.toString()) / 1e18).toLocaleString() : '0'} MBST
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Amount to Clawback (MBST)</label>
                  <input
                    type="number"
                    value={clawbackAmount}
                    onChange={(e) => setClawbackAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                </div>
                
                <button
                  onClick={handleClawback}
                  disabled={isClawingBack || isClawbackConfirming || !clawbackAddress || !clawbackAmount}
                  className="w-full px-6 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  { (isClawingBack || isClawbackConfirming) ? 'Confirming Clawback…' : 'Execute Clawback' }
                </button>
              </div>
            </div>

            {/* Current Token Holders */}
            <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Token Holders</h3>
                  <p className="text-blue-700 text-sm">Current investors and their balances</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {holdersLoading ? (
                  <div className="bg-white/80 rounded-xl p-8 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-blue-200 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-blue-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : holders.length === 0 ? (
                  <div className="bg-white/80 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-blue-600 font-medium">No token holders yet</p>
                    <p className="text-blue-500 text-sm mt-1">Investors will appear here after purchasing tokens</p>
                  </div>
                ) : (
                  holders.map((holder) => (
                    <div key={holder.address} className="bg-white/80 rounded-xl p-6 border border-blue-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Address value={holder.address} />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">
                            {(parseFloat(holder.balance) / 1e18).toLocaleString()}
                          </div>
                          <div className="text-sm font-medium text-blue-700">MBST</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}