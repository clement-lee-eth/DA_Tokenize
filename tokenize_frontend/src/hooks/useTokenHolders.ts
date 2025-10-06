import { useReadContract, useWatchContractEvent } from 'wagmi'
import { REAL_ESTATE_TOKEN_ADDRESS, ABIS } from '../config/contracts'
import { useState, useEffect } from 'react'

export interface TokenHolder {
  address: string
  balance: string
}

export const useTokenHolders = () => {
  const [tokenAbi, setTokenAbi] = useState<any>(null)
  const [holders, setHolders] = useState<TokenHolder[]>([])

  // Load ABI
  useEffect(() => {
    let cancelled = false
    ABIS.RealEstateToken().then((abi) => { if (!cancelled) setTokenAbi(abi) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Demo investors list
  const demoInvestors = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Investor A
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Investor B
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Investor C
  ]

  // Balance reads with refetch handles
  const { data: balance1, refetch: refetch1 } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'balanceOf',
    args: [demoInvestors[0] as `0x${string}`],
    query: { enabled: !!tokenAbi }
  })

  const { data: balance2, refetch: refetch2 } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'balanceOf',
    args: [demoInvestors[1] as `0x${string}`],
    query: { enabled: !!tokenAbi }
  })

  const { data: balance3, refetch: refetch3 } = useReadContract({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    functionName: 'balanceOf',
    args: [demoInvestors[2] as `0x${string}`],
    query: { enabled: !!tokenAbi }
  })

  // Update holders when balances change
  useEffect(() => {
    const newHolders: TokenHolder[] = []
    if (balance1 && balance1 > 0n) newHolders.push({ address: demoInvestors[0], balance: balance1.toString() })
    if (balance2 && balance2 > 0n) newHolders.push({ address: demoInvestors[1], balance: balance2.toString() })
    if (balance3 && balance3 > 0n) newHolders.push({ address: demoInvestors[2], balance: balance3.toString() })
    setHolders(newHolders)
  }, [balance1, balance2, balance3])

  // Event-driven refetch for just the affected address
  useWatchContractEvent({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    eventName: 'TokensPurchased',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        const buyer = (log.args.buyer as string)?.toLowerCase()
        if (buyer === demoInvestors[0].toLowerCase()) refetch1()
        if (buyer === demoInvestors[1].toLowerCase()) refetch2()
        if (buyer === demoInvestors[2].toLowerCase()) refetch3()
      })
    },
  })

  useWatchContractEvent({
    address: REAL_ESTATE_TOKEN_ADDRESS as `0x${string}`,
    abi: tokenAbi ?? [],
    eventName: 'TokensClawedBack',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        const from = (log.args.from as string)?.toLowerCase()
        if (from === demoInvestors[0].toLowerCase()) refetch1()
        if (from === demoInvestors[1].toLowerCase()) refetch2()
        if (from === demoInvestors[2].toLowerCase()) refetch3()
      })
    },
  })

  const refetchAll = () => { refetch1(); refetch2(); refetch3() }

  return {
    holders,
    isLoading: !tokenAbi,
    refetchAll,
  }
}
