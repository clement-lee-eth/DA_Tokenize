import React from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

const PRESETS: Array<{ label: string; address: string }> = [
  { label: 'Service Provider (Acct 0)', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
  { label: 'Investor A (Acct 1)', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
  { label: 'Investor B (Acct 2)', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
  { label: 'Investor C (Acct 3)', address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' }
]

export const QuickSwitch: React.FC = () => {
  const { openConnectModal } = useConnectModal()
  const { address } = useAccount()

  return (
    <div className="bg-white border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-900">Quick wallet switch</span>
        <button className="text-xs text-primary hover:underline" onClick={openConnectModal}>Open wallet</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button key={p.address} onClick={openConnectModal} className={`text-left border rounded px-3 py-2 text-sm hover:border-primary ${address?.toLowerCase()===p.address.toLowerCase() ? 'bg-neutral-100' : ''}`}>
            <div className="font-medium">{p.label}</div>
            <div className="font-mono text-xs text-neutral-700">{p.address.slice(0,6)}…{p.address.slice(-4)}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-700 mt-2">Use the wallet modal to import Anvil private keys and switch accounts instantly.</p>
    </div>
  )
}

