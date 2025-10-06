import { useReadContract, useWatchContractEvent } from 'wagmi'
import { COMPLIANCE_MANAGER_ADDRESS, ABIS } from '../config/contracts'
import { useState, useEffect } from 'react'

export const useWhitelistedInvestors = () => {
  const [managerAbi, setManagerAbi] = useState<any>(null)

  // Load ABI
  useEffect(() => {
    let cancelled = false
    ABIS.ComplianceManager().then((abi) => { if (!cancelled) setManagerAbi(abi) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Demo investor addresses (Anvil accounts)
  const demoInvestors = [
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Investor A' },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Investor B' },
  ]

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

  // Watch for whitelist events to trigger immediate refetch
  useWatchContractEvent({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    eventName: 'InvestorWhitelisted',
    onLogs: (logs) => {
      console.log('🔍 useWhitelistedInvestors: InvestorWhitelisted event received:', logs)
      logs.forEach((log) => {
        const investorAddress = log.args.investor as string
        console.log('🔄 useWhitelistedInvestors: Event for investor:', investorAddress)
        console.log('🔍 useWhitelistedInvestors: Comparing with Investor A:', demoInvestors[0].address.toLowerCase())
        console.log('🔍 useWhitelistedInvestors: Comparing with Investor B:', demoInvestors[1].address.toLowerCase())
        
        // Only refetch the specific investor that was whitelisted
        if (investorAddress.toLowerCase() === demoInvestors[0].address.toLowerCase()) {
          console.log('✅ useWhitelistedInvestors: Event matches Investor A - refetching A only')
          refetchA()
        } else if (investorAddress.toLowerCase() === demoInvestors[1].address.toLowerCase()) {
          console.log('✅ useWhitelistedInvestors: Event matches Investor B - refetching B only')
          refetchB()
        } else {
          console.log('❌ useWhitelistedInvestors: Event address does not match any demo investor')
        }
      })
    },
  })

  useWatchContractEvent({
    address: COMPLIANCE_MANAGER_ADDRESS as `0x${string}`,
    abi: managerAbi ?? [],
    eventName: 'InvestorBlacklisted',
    onLogs: (logs) => {
      console.log('🔍 useWhitelistedInvestors: InvestorBlacklisted event received:', logs)
      logs.forEach((log) => {
        const investorAddress = log.args.investor as string
        console.log('🔄 useWhitelistedInvestors: Refetching specific investor after blacklist:', investorAddress)
        
        // Only refetch the specific investor that was blacklisted
        if (investorAddress.toLowerCase() === demoInvestors[0].address.toLowerCase()) {
          console.log('🔄 useWhitelistedInvestors: Refetching Investor A after blacklist')
          refetchA()
        } else if (investorAddress.toLowerCase() === demoInvestors[1].address.toLowerCase()) {
          console.log('🔄 useWhitelistedInvestors: Refetching Investor B after blacklist')
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

  const refetchAll = () => {
    refetchA()
    refetchB()
  }

  return {
    whitelistedInvestors,
    isLoading: !managerAbi,
    refetchAll
  }
}
