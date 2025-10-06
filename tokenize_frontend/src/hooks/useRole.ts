import { useAccount, useReadContract } from 'wagmi'
import { useEffect, useMemo, useState } from 'react'
import { ABIS, COMPLIANCE_MANAGER_ADDRESS } from '../config/contracts'

export type WalletRole = 'SERVICE_PROVIDER' | 'WHITELISTED' | 'NON_WHITELISTED' | 'DISCONNECTED'

export function useRole() {
  const { address, isConnected } = useAccount()
  const enabled = Boolean(isConnected && address && COMPLIANCE_MANAGER_ADDRESS)

  // Load the ComplianceManager ABI once and memoize
  const [managerAbi, setManagerAbi] = useState<any | null>(null)
  useEffect(() => {
    let cancelled = false
    ABIS.ComplianceManager().then((abi) => { if (!cancelled) setManagerAbi(abi) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const serviceProviderRole = useReadContract({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    functionName: 'SERVICE_PROVIDER_ROLE',
    query: { enabled: enabled && Boolean(managerAbi) },
  })

  const hasRole = useReadContract({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    functionName: 'hasRole',
    args: serviceProviderRole.data && address ? [serviceProviderRole.data as any, address] : undefined,
    query: { enabled: enabled && Boolean(managerAbi && serviceProviderRole.data && address) },
  })

  const isWhitelisted = useReadContract({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: { enabled: enabled && Boolean(managerAbi && address) },
  })

  const role: WalletRole = useMemo(() => {
    if (!isConnected || !address) return 'DISCONNECTED'
    if (hasRole.data) return 'SERVICE_PROVIDER'
    if (isWhitelisted.data) return 'WHITELISTED'
    return 'NON_WHITELISTED'
  }, [isConnected, address, hasRole.data, isWhitelisted.data])

  const isLoading = enabled && (!managerAbi || serviceProviderRole.isLoading || hasRole.isLoading || isWhitelisted.isLoading)
  const error = serviceProviderRole.error || hasRole.error || isWhitelisted.error

  return { role, isLoading, error }
}
