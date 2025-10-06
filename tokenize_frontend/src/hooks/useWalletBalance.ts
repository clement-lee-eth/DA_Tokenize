import { useAccount, useBalance, useWatchContractEvent } from 'wagmi'
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { ABIS, REAL_ESTATE_TOKEN_ADDRESS, COMPLIANCE_MANAGER_ADDRESS } from '../config/contracts'
import { useEffect, useState } from 'react'

export function useWalletBalance() {
  const { address, isConnected } = useAccount()
  
  // Get ETH balance
  const { data: ethBalance, isLoading: ethLoading, refetch: refetchEth } = useBalance({
    address: address,
    query: { enabled: isConnected && Boolean(address), refetchOnMount: true, gcTime: 0 }
  })

  // Load RealEstateToken ABI
  const [tokenAbi, setTokenAbi] = useState<any | null>(null)
  useEffect(() => {
    let cancelled = false
    ABIS.RealEstateToken().then((abi) => { if (!cancelled) setTokenAbi(abi) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Get MBS Token balance for connected wallet
  const { data: tokenBalance, isLoading: tokenLoading, refetch: refetchTokenBalance } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) && Boolean(tokenAbi), refetchOnMount: true, gcTime: 0 }
  })

  // Get MBS Token balance held by ComplianceManager (recovery pool for clawbacks)
  const { data: managerBalance, refetch: refetchManagerBalance } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'balanceOf',
    args: [COMPLIANCE_MANAGER_ADDRESS as `0x${string}`],
    query: { enabled: Boolean(tokenAbi), refetchOnMount: true, gcTime: 0 }
  })

  // Event-driven refetch for this address
  useWatchContractEvent({
    address: tokenAbi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: tokenAbi ?? [],
    eventName: 'TokensPurchased',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        if (!address) return
        const buyer = (log.args?.buyer as string)?.toLowerCase?.()
        if (buyer === address.toLowerCase()) refetchTokenBalance()
      })
    },
  })

  useWatchContractEvent({
    address: tokenAbi ? (REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`) : undefined,
    abi: tokenAbi ?? [],
    eventName: 'TokensClawedBack',
    onLogs: () => {
      // Clawbacks affect the manager's pool; refresh it immediately
      refetchManagerBalance()
      // And refresh connected wallet in case it was the target
      if (address) refetchTokenBalance()
    },
  })

  // Refetch on account change
  useEffect(() => {
    if (address) {
      refetchEth()
      refetchTokenBalance()
    }
  }, [address])

  return {
    ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',
    tokenBalance: tokenBalance ? formatEther(tokenBalance as bigint) : '0',
    managerBalance: managerBalance ? formatEther(managerBalance as bigint) : '0',
    isLoading: ethLoading || tokenLoading,
    isConnected,
    refetchTokenBalance,
    refetchManagerBalance
  }
}

