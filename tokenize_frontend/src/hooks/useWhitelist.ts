import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useWatchContractEvent, usePublicClient } from 'wagmi'
import { useAccount } from 'wagmi'
import { COMPLIANCE_MANAGER_ADDRESS, ABIS } from '../config/contracts'
import { useState, useEffect, useCallback } from 'react'
import { decodeErrorResult } from 'viem'

export const useWhitelist = () => {
  const { address } = useAccount()
  const [managerAbi, setManagerAbi] = useState<any>(null)
  const [whitelistLoadingStates, setWhitelistLoadingStates] = useState<Record<string, boolean>>({})
  const [blacklistLoadingStates, setBlacklistLoadingStates] = useState<Record<string, boolean>>({})
  const [transactionStates, setTransactionStates] = useState<Record<string, 'idle' | 'initiated' | 'confirming' | 'success' | 'error'>>({})
  const [pendingTransactions, setPendingTransactions] = useState<Record<string, string>>({}) // address -> txHash
  const [successCallbacks, setSuccessCallbacks] = useState<Record<string, () => void>>({}) // address -> callback
  const publicClient = usePublicClient()

  // Load ABI
  useEffect(() => {
    let cancelled = false
    ABIS.ComplianceManager().then((abi) => { 
      if (!cancelled) {
        console.log('📋 ComplianceManager ABI loaded:', abi)
        setManagerAbi(abi) 
      }
    }).catch((error) => {
      console.error('❌ Failed to load ComplianceManager ABI:', error)
    })
    return () => { cancelled = true }
  }, [])

  // Debug contract address
  useEffect(() => {
    console.log('🏢 ComplianceManager Address:', COMPLIANCE_MANAGER_ADDRESS)
  }, [])

  // Check if address is whitelisted
  const { data: isWhitelisted, refetch: refetchWhitelist } = useReadContract({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: { enabled: !!managerAbi && !!address }
  })

  // Whitelist function
  const { writeContract: whitelist, data: whitelistHash, isPending: isWhitelisting } = useWriteContract()
  const { isLoading: isWhitelistConfirming, isSuccess: isWhitelistSuccess } = useWaitForTransactionReceipt({
    hash: whitelistHash,
  })

  // Fallback: If transaction receipt is successful but no event was caught, trigger refetch
  useEffect(() => {
    if (isWhitelistSuccess && whitelistHash) {
      console.log('🔄 Transaction receipt successful, triggering fallback refetch')
      // Small delay to allow event listeners to fire first
      setTimeout(() => {
        refetchWhitelist()
      }, 100)
    }
  }, [isWhitelistSuccess, whitelistHash, refetchWhitelist])

  // Blacklist function
  const { writeContract: blacklist, data: blacklistHash, isPending: isBlacklisting } = useWriteContract()
  const { isLoading: isBlacklistConfirming, isSuccess: isBlacklistSuccess } = useWaitForTransactionReceipt({
    hash: blacklistHash,
  })

  // Watch for InvestorWhitelisted events
  useWatchContractEvent({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    eventName: 'InvestorWhitelisted',
    onLogs: (logs) => {
      console.log('🔍 InvestorWhitelisted event received:', logs)
      logs.forEach((log: any) => {
        const investorAddress = log.args.investor as string
        console.log('✅ Whitelisting investor:', investorAddress)
        
        // Clear loading state for this specific investor
        setWhitelistLoadingStates(prev => ({ ...prev, [investorAddress]: false }))
        // Clear pending transaction
        setPendingTransactions(prev => {
          const newPending = { ...prev }
          delete newPending[investorAddress]
          return newPending
        })
        // Execute success callback if exists
        const callback = successCallbacks[investorAddress]
        if (callback) {
          console.log('🎯 Executing success callback for:', investorAddress)
          callback()
          setSuccessCallbacks(prev => {
            const newCallbacks = { ...prev }
            delete newCallbacks[investorAddress]
            return newCallbacks
          })
        }
        // Only trigger refetch for the current user's whitelist status, not all investors
        console.log('🔄 Triggering refetchWhitelist for current user')
        refetchWhitelist()
      })
    },
    onError: (error) => {
      console.error('❌ Event listener error:', error)
    },
  })

  // Watch for InvestorBlacklisted events
  useWatchContractEvent({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    eventName: 'InvestorBlacklisted',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        const investorAddress = log.args.investor as string
        // Clear loading state for this specific investor
        setBlacklistLoadingStates(prev => ({ ...prev, [investorAddress]: false }))
        // Clear pending transaction
        setPendingTransactions(prev => {
          const newPending = { ...prev }
          delete newPending[investorAddress]
          return newPending
        })
        // Execute success callback if exists
        const callback = successCallbacks[investorAddress]
        if (callback) {
          callback()
          setSuccessCallbacks(prev => {
            const newCallbacks = { ...prev }
            delete newCallbacks[investorAddress]
            return newCallbacks
          })
        }
        // Trigger a refetch of whitelist status
        refetchWhitelist()
      })
    },
  })

  // Handle whitelist transaction states
  useEffect(() => {
    if (whitelistHash) {
      // Transaction initiated
      setTransactionStates(prev => ({ ...prev, [whitelistHash]: 'initiated' }))
    }
  }, [whitelistHash])

  useEffect(() => {
    if (isWhitelistConfirming && whitelistHash) {
      // Transaction confirming
      setTransactionStates(prev => ({ ...prev, [whitelistHash]: 'confirming' }))
    }
  }, [isWhitelistConfirming, whitelistHash])

  // Handle blacklist transaction states
  useEffect(() => {
    if (blacklistHash) {
      setTransactionStates(prev => ({ ...prev, [blacklistHash]: 'initiated' }))
    }
  }, [blacklistHash])

  useEffect(() => {
    if (isBlacklistConfirming && blacklistHash) {
      setTransactionStates(prev => ({ ...prev, [blacklistHash]: 'confirming' }))
    }
  }, [isBlacklistConfirming, blacklistHash])

  const whitelistInvestor = useCallback(async (investorAddress: string, onSuccess?: () => void) => {
    if (!managerAbi) return
    
    // Set whitelist loading state for this specific address
    setWhitelistLoadingStates(prev => ({ ...prev, [investorAddress]: true }))
    
    // Store success callback
    if (onSuccess) {
      setSuccessCallbacks(prev => ({ ...prev, [investorAddress]: onSuccess }))
    }
    
    try {
      whitelist({
        address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
        abi: managerAbi,
        functionName: 'whitelistInvestor',
        args: [investorAddress as `0x${string}`]
      })
    } catch (error: any) {
      // Clear loading state on error
      setWhitelistLoadingStates(prev => ({ ...prev, [investorAddress]: false }))
      // Clear success callback on error
      setSuccessCallbacks(prev => {
        const newCallbacks = { ...prev }
        delete newCallbacks[investorAddress]
        return newCallbacks
      })
      
      // Handle specific error types
      if (error?.message?.includes('nonce too low')) {
        throw new Error('Transaction nonce is out of sync. Please refresh the page and try again.')
      } else if (error?.message?.includes('user rejected')) {
        throw new Error('Transaction was rejected by user.')
      } else {
        throw new Error(`Transaction failed: ${error?.message || 'Unknown error'}`)
      }
    }
  }, [managerAbi, whitelist])

  const blacklistInvestor = useCallback(async (investorAddress: string, onSuccess?: () => void) => {
    if (!managerAbi) return
    
    // Set blacklist loading state for this specific address
    setBlacklistLoadingStates(prev => ({ ...prev, [investorAddress]: true }))
    
    // Store success callback
    if (onSuccess) {
      setSuccessCallbacks(prev => ({ ...prev, [investorAddress]: onSuccess }))
    }
    
    try {
      // Simulate to surface the custom error before wallet prompt
      await publicClient!.simulateContract({
        address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
        abi: managerAbi,
        functionName: 'blacklistInvestor',
        account: address as `0x${string}`,
        args: [investorAddress as `0x${string}`]
      })
      blacklist({
        address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
        abi: managerAbi,
        functionName: 'blacklistInvestor',
        args: [investorAddress as `0x${string}`]
      })
    } catch (error: any) {
      // Clear loading state on error
      setBlacklistLoadingStates(prev => ({ ...prev, [investorAddress]: false }))
      // Clear success callback on error
      setSuccessCallbacks(prev => {
        const newCallbacks = { ...prev }
        delete newCallbacks[investorAddress]
        return newCallbacks
      })
      let friendly = ''
      let dataHex: `0x${string}` | undefined = error?.data || error?.cause?.data || error?.details?.data
      try {
        if (dataHex && managerAbi) {
          const decoded = decodeErrorResult({ abi: managerAbi, data: dataHex }) as any
          if (decoded?.errorName === 'BlacklistRequiresZeroBalance') friendly = 'Cannot blacklist investor with non-zero balance'
        }
      } catch {}
      const emsg = (error?.shortMessage || error?.details || error?.message || '').toString()
      if (!friendly) {
        if (emsg.toLowerCase().includes('blacklistrequireszerobalance')) friendly = 'Cannot blacklist investor with non-zero balance'
      }
      if (!friendly) friendly = `Transaction failed: ${emsg || 'Unknown error'}`
      throw new Error(friendly)
    }
  }, [managerAbi, blacklist, publicClient])

  const isWhitelistLoading = useCallback((address: string) => {
    return whitelistLoadingStates[address] || false
  }, [whitelistLoadingStates])

  const isBlacklistLoading = useCallback((address: string) => {
    return blacklistLoadingStates[address] || false
  }, [blacklistLoadingStates])

  const getTransactionState = useCallback((hash: string) => {
    return transactionStates[hash] || 'idle'
  }, [transactionStates])

  const getPendingTransaction = useCallback((address: string) => {
    return pendingTransactions[address] || null
  }, [pendingTransactions])

  return {
    isWhitelisted,
    whitelistInvestor,
    blacklistInvestor,
    isWhitelisting: isWhitelisting || isWhitelistConfirming,
    isBlacklisting: isBlacklisting || isBlacklistConfirming,
    isWhitelistLoading,
    isBlacklistLoading,
    refetchWhitelist,
    isWhitelistSuccess,
    isBlacklistSuccess,
    whitelistHash,
    blacklistHash,
    getTransactionState,
    isWhitelistConfirming,
    isBlacklistConfirming,
    getPendingTransaction
  }
}
