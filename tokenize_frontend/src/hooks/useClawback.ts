import { useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, usePublicClient, useAccount } from 'wagmi'
import { REAL_ESTATE_TOKEN_ADDRESS, ABIS } from '../config/contracts'
import { useState, useEffect, useCallback } from 'react'
import { decodeErrorResult } from 'viem'

export const useClawback = () => {
  const [tokenAbi, setTokenAbi] = useState<any>(null)
  const [transactionStates, setTransactionStates] = useState<Record<string, 'idle' | 'initiated' | 'confirming' | 'success' | 'error'>>({})
  const [pendingSuccessCallback, setPendingSuccessCallback] = useState<(() => void) | null>(null)
  const { address } = useAccount()

  useEffect(() => {
    let cancelled = false
    ABIS.RealEstateToken().then((abi) => { if (!cancelled) setTokenAbi(abi) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const { writeContract: clawback, data: clawbackHash, isPending: isClawingBack } = useWriteContract()
  const publicClient = usePublicClient()
  const { isLoading: isClawbackConfirming, isSuccess: isClawbackSuccess } = useWaitForTransactionReceipt({
    hash: clawbackHash,
  })

  useEffect(() => {
    if (clawbackHash) setTransactionStates(prev => ({ ...prev, [clawbackHash]: 'initiated' }))
  }, [clawbackHash])
  useEffect(() => {
    if (isClawbackConfirming && clawbackHash) setTransactionStates(prev => ({ ...prev, [clawbackHash]: 'confirming' }))
  }, [isClawbackConfirming, clawbackHash])

  // Mark success on event and execute pending callback
  useWatchContractEvent({
    address: tokenAbi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: tokenAbi ?? [],
    eventName: 'TokensClawedBack',
    onLogs: () => {
      if (!clawbackHash) return
      setTransactionStates(prev => ({ ...prev, [clawbackHash]: 'success' }))
      if (pendingSuccessCallback) {
        pendingSuccessCallback()
        setPendingSuccessCallback(null)
      }
    },
  })

  // Also mark success and run callback on receipt as a fallback
  useEffect(() => {
    if (isClawbackSuccess && clawbackHash) {
      setTransactionStates(prev => ({ ...prev, [clawbackHash]: 'success' }))
      if (pendingSuccessCallback) {
        pendingSuccessCallback()
        setPendingSuccessCallback(null)
      }
    }
  }, [isClawbackSuccess, clawbackHash, pendingSuccessCallback])

  const getTransactionState = useCallback((hash: string) => transactionStates[hash] || 'idle', [transactionStates])

  const clawbackTokens = async (investorAddress: string, amountWei: string, onSuccess?: () => void) => {
    if (!tokenAbi) return
    try {
      const sim = await publicClient!.simulateContract({
        address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
        abi: tokenAbi,
        functionName: 'clawbackTokens',
        account: address as `0x${string}`,
        args: [investorAddress as `0x${string}`, BigInt(amountWei)],
      })
      // Store success callback to run only when event/receipt confirms
      if (onSuccess) setPendingSuccessCallback(() => onSuccess)
      await clawback({ ...sim.request })
    } catch (error: any) {
      let friendly = ''
      let dataHex: `0x${string}` | undefined = error?.data || error?.cause?.data || error?.details?.data
      try {
        if (dataHex && tokenAbi) {
          const decoded = decodeErrorResult({ abi: tokenAbi, data: dataHex }) as any
          if (decoded?.errorName) friendly = decoded.errorName
        }
      } catch {}
      const raw = (error?.shortMessage || error?.message || '').toString()
      if (!friendly && raw.toLowerCase().includes('accesscontrol')) friendly = 'Only service provider can execute clawback'
      if (!friendly) friendly = raw || 'Clawback failed'
      throw new Error(friendly)
    }
  }

  return {
    clawbackTokens,
    isClawingBack: isClawingBack || isClawbackConfirming,
    isClawbackConfirming,
    isClawbackSuccess,
    clawbackHash,
    getTransactionState,
  }
}
