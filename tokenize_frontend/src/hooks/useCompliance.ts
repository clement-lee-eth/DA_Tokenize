import { useAccount, useReadContract } from 'wagmi'
import { useEffect, useState, useMemo } from 'react'
import { ABIS, COMPLIANCE_MANAGER_ADDRESS, REAL_ESTATE_TOKEN_ADDRESS } from '../config/contracts'

export function useMaxHolding() {
  const { address } = useAccount()
  const [managerAbi, setManagerAbi] = useState<any | null>(null)
  const [tokenAbi, setTokenAbi] = useState<any | null>(null)

  useEffect(() => {
    let cancelled = false
    ABIS.ComplianceManager().then((abi) => { if (!cancelled) setManagerAbi(abi) }).catch(() => {})
    ABIS.RealEstateToken().then((abi) => { if (!cancelled) setTokenAbi(abi) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const { data: maxHoldingWei } = useReadContract({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    functionName: 'getMaxHolding',
    query: { enabled: !!managerAbi }
  })

  const { data: currentBalanceWei } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!tokenAbi && !!address }
  })

  const tokensLimit = useMemo(() => {
    return maxHoldingWei ? Number((maxHoldingWei as bigint) / BigInt(1e18)) : null
  }, [maxHoldingWei])

  const tokensHeld = useMemo(() => {
    return currentBalanceWei ? Number((currentBalanceWei as bigint) / BigInt(1e18)) : 0
  }, [currentBalanceWei])

  return {
    maxHoldingWei: (maxHoldingWei as bigint) || null,
    currentBalanceWei: (currentBalanceWei as bigint) || null,
    tokensLimit,
    tokensHeld,
  }
}
