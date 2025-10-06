import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'
import { useEffect, useMemo, useState } from 'react'
import { ABIS, REAL_ESTATE_TOKEN_ADDRESS } from '../config/contracts'
import { formatEther } from 'viem'

export function useTokenMetadata() {
  const [abi, setAbi] = useState<any | null>(null)
  useEffect(() => {
    let cancelled = false
    ABIS.RealEstateToken().then((a) => { if (!cancelled) setAbi(a) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const getPropertyInfo = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: abi ?? [],
    functionName: 'getPropertyInfo',
    query: { enabled: Boolean(abi && REAL_ESTATE_TOKEN_ADDRESS), refetchOnMount: true, gcTime: 0 }
  })

  const totalSupply = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: abi ?? [],
    functionName: 'totalSupply',
    query: { enabled: Boolean(abi && REAL_ESTATE_TOKEN_ADDRESS), refetchOnMount: true, gcTime: 0 }
  })

  const totalRaised = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: abi ?? [],
    functionName: 'getTotalRaised',
    query: { enabled: Boolean(abi && REAL_ESTATE_TOKEN_ADDRESS), refetchOnMount: true, gcTime: 0 }
  })

  // Event-driven refetch for totals (purchase and clawback affect supply/raised)
  useWatchContractEvent({
    address: abi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: abi ?? [],
    eventName: 'TokensPurchased',
    onLogs: () => {
      totalSupply.refetch()
      totalRaised.refetch()
    },
  })

  useWatchContractEvent({
    address: abi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: abi ?? [],
    eventName: 'TokensClawedBack',
    onLogs: () => {
      totalSupply.refetch()
      // totalRaised does not change on clawback, only supply/holders
    },
  })

  const data = useMemo(() => {
    const info = getPropertyInfo.data as any
    if (!info) return null
    const [name, location, totalValue, tokenPriceWei] = info
    return {
      name: String(name),
      location: String(location),
      totalValue: BigInt(totalValue),
      tokenPriceWei: BigInt(tokenPriceWei),
      totalSupply: totalSupply.data ? BigInt(totalSupply.data as any) : null,
      totalRaisedWei: totalRaised.data ? BigInt(totalRaised.data as any) : null,
    }
  }, [getPropertyInfo.data, totalSupply.data, totalRaised.data])

  const isLoading = !abi || getPropertyInfo.isLoading || totalSupply.isLoading || totalRaised.isLoading

  return { 
    abi, 
    data, 
    isLoading, 
    error: getPropertyInfo.error || totalSupply.error || totalRaised.error,
    refetch: () => {
      getPropertyInfo.refetch()
      totalSupply.refetch()
      totalRaised.refetch()
    }
  }
}

export function useTokenPriceEth() {
  const { data, isLoading } = useTokenMetadata()
  const price = data ? Number(formatEther(data.tokenPriceWei)) : null
  return { price, isLoading }
}


