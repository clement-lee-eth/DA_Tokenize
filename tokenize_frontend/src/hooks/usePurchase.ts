import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useWatchContractEvent, usePublicClient } from 'wagmi'
import { useAccount } from 'wagmi'
import { REAL_ESTATE_TOKEN_ADDRESS, ABIS } from '../config/contracts'
import { useState, useEffect, useCallback, useRef } from 'react'
import { parseEther, decodeErrorResult, hexToString } from 'viem'

export const usePurchase = () => {
  const { address } = useAccount()
  const [tokenAbi, setTokenAbi] = useState<any>(null)
  const [transactionStates, setTransactionStates] = useState<Record<string, 'idle' | 'initiated' | 'confirming' | 'success' | 'error'>>({})
  const [successCallbacks, setSuccessCallbacks] = useState<Record<string, () => void>>({})
  const latestOnSuccessRef = useRef<(() => void) | null>(null)
  const [pendingSuccessCallback, setPendingSuccessCallback] = useState<(() => void) | null>(null)

  // Reset state on account change to avoid stale callbacks triggering after wallet switch
  useEffect(() => {
    setTransactionStates({})
    setSuccessCallbacks({})
    setPendingSuccessCallback(null)
    latestOnSuccessRef.current = null
  }, [address])

  // Load ABI
  useEffect(() => {
    let cancelled = false
    ABIS.RealEstateToken().then((abi) => { 
      if (!cancelled) {
        console.log('📋 RealEstateToken ABI loaded:', abi)
        setTokenAbi(abi) 
      }
    }).catch((error) => {
      console.error('❌ Failed to load RealEstateToken ABI:', error)
    })
    return () => { cancelled = true }
  }, [])

  // Check if oversubscribed
  const { data: isOversubscribed } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'isOversubscribed',
    query: { enabled: !!tokenAbi }
  })

  // Purchase function
  const { writeContract: purchase, data: purchaseHash, isPending: isPurchasing } = useWriteContract()
  const publicClient = usePublicClient()
  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  })

  // Track transaction states
  useEffect(() => {
    if (purchaseHash && isPurchasing) {
      setTransactionStates(prev => ({ ...prev, [purchaseHash]: 'initiated' }))
    }
  }, [purchaseHash, isPurchasing])

  useEffect(() => {
    if (isPurchaseConfirming && purchaseHash) {
      setTransactionStates(prev => ({ ...prev, [purchaseHash]: 'confirming' }))
    }
  }, [isPurchaseConfirming, purchaseHash])

  // Watch for TokensPurchased events
  useWatchContractEvent({
    address: tokenAbi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: tokenAbi ?? [],
    eventName: 'TokensPurchased',
    onLogs: (logs) => {
      console.log('🔍 TokensPurchased event received:', logs)
      logs.forEach((log: any) => {
        const buyer = log.args.buyer as string
        const amount = log.args.amount as bigint
        const txHash = log.transactionHash as string | undefined
        console.log('✅ Tokens purchased by:', buyer, 'Amount:', amount.toString(), 'tx:', txHash)
        
        // Mark success for this specific transaction hash to stop any spinners
        if (txHash) {
          setTransactionStates(prev => ({ ...prev, [txHash]: 'success' }))
        }
        
        // Execute success callback for current account
        if (address && buyer?.toLowerCase() === address.toLowerCase()) {
          // Prefer hash-mapped callback; otherwise use latestOnSuccessRef if present
          const cb = (txHash && successCallbacks[txHash]) || latestOnSuccessRef.current
          if (cb) {
            cb()
            if (txHash && successCallbacks[txHash]) {
              setSuccessCallbacks(prev => {
                const copy = { ...prev }
                delete copy[txHash]
                return copy
              })
            }
            latestOnSuccessRef.current = null
          }
        }
      })
    },
    onError: (error) => {
      console.error('❌ Purchase event listener error:', error)
    },
  })

  // Fallback: If transaction receipt is successful, trigger success callback
  useEffect(() => {
    if (isPurchaseSuccess && purchaseHash) {
      console.log('🔄 Purchase transaction receipt successful, triggering fallback callback')
      // Mark success immediately to stop spinners; callbacks/toasts can follow
      setTransactionStates(prev => ({ ...prev, [purchaseHash]: 'success' }))
      if (pendingSuccessCallback) {
        pendingSuccessCallback()
        setPendingSuccessCallback(null)
        return
      }
      const callback = successCallbacks[purchaseHash]
      if (callback) {
        callback()
        setSuccessCallbacks(prev => {
          const newCallbacks = { ...prev }
          delete newCallbacks[purchaseHash]
          return newCallbacks
        })
      }
    }
  }, [isPurchaseSuccess, purchaseHash, successCallbacks, pendingSuccessCallback])

  useEffect(() => {
    if (purchaseHash && latestOnSuccessRef.current) {
      setSuccessCallbacks(prev => ({ ...prev, [purchaseHash]: latestOnSuccessRef.current! }))
      latestOnSuccessRef.current = null
    }
  }, [purchaseHash])

  const getTransactionState = useCallback((hash: string) => {
    return transactionStates[hash] || 'idle'
  }, [transactionStates])

  const purchaseTokens = async (ethAmount: string, onSuccess?: () => void) => {
    if (!tokenAbi) return
    
    const value = parseEther(ethAmount)
    
    // Register the latest intended success callback; it will be attached once a hash is available
    latestOnSuccessRef.current = onSuccess || null
    setPendingSuccessCallback(null)
    
    try {
      // First simulate on-chain to detect reverts and get a prepared request
      const simulation = await publicClient!.simulateContract({
        address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
        abi: tokenAbi,
        functionName: 'purchaseTokens',
        account: address as `0x${string}`,
        args: [],
        value,
      })
      // If simulation succeeds, send the prepared request (contains correct gas & data)
      await purchase({ ...simulation.request })
    } catch (error: any) {
      // Surface revert reasons gracefully using ABI decoding
      let dataHex: `0x${string}` | undefined = error?.data || error?.cause?.data || error?.details?.data
      let friendly = ''
      try {
        if (dataHex && tokenAbi) {
          const decoded = decodeErrorResult({ abi: tokenAbi, data: dataHex }) as any
          if (decoded?.errorName === 'ExceedsMaxHolding') {
            const attemptedPlusCurrent = decoded.args?.[0] as bigint
            const maxHolding = decoded.args?.[1] as bigint
            const remaining = maxHolding > 0n ? Number(maxHolding) / 1e18 : 0
            friendly = `Exceeds maximum holding limit (max ${remaining.toLocaleString()} MBST)`
          } else if (decoded?.errorName === 'NotWhitelisted') {
            friendly = 'Wallet is not whitelisted'
          } else if (decoded?.errorName === 'CapExceeded') {
            friendly = 'Sale hard cap reached'
          } else if (decoded?.errorName === 'InvalidAmount') {
            friendly = 'Invalid amount sent'
          }
        }
      } catch (e) {
        // ignore decode errors
      }

      const emsg = (error?.shortMessage || error?.details || error?.message || '').toString()
      if (!friendly) {
        const lower = emsg.toLowerCase()
        if (lower.includes('exceedsmaxholding') || lower.includes('exceeds max holding')) friendly = 'Exceeds maximum holding limit'
        else if (lower.includes('notwhitelisted')) friendly = 'Wallet is not whitelisted'
        else if (lower.includes('capexceeded') || lower.includes('cap exceeded')) friendly = 'Sale hard cap reached'
        else if (lower.includes('invalidamount')) friendly = 'Invalid amount sent'
      }
      if (error?.name === 'EstimateGasExecutionError' && !friendly) {
        friendly = 'Transaction would fail on-chain (gas estimation). Check limits or status.'
      }
      if (error?.message?.includes('user rejected')) {
        friendly = 'Transaction was rejected by user.'
      }
      throw new Error(friendly || `Transaction failed: ${emsg || 'Unknown error'}`)
    }
  }

  return {
    purchaseTokens,
    isPurchasing: isPurchasing || isPurchaseConfirming,
    isPurchaseConfirming,
    isPurchaseSuccess,
    purchaseHash,
    isOversubscribed,
    getTransactionState,
    transactionStates
  }
}
