import React from 'react'
import { useAccount } from 'wagmi'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import { Address } from '../shared/Address'

export const WalletInfo: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { ethBalance, tokenBalance, isLoading } = useWalletBalance()

  if (!isConnected || !address) return null

  return (
    <div className="bg-gradient-to-br from-white to-neutral-50 border border-neutral-200 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="text-base font-semibold text-neutral-900">Wallet Overview</h3>
        </div>
        <div className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
          Connected
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
          <div className="text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">Address</div>
          <Address value={address} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">ETH Balance</span>
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <img src="/src/assets/eth_logo.png" alt="ETH" width="14" height="14" />
              </div>
            </div>
            <div className="text-xl font-bold text-blue-900 tabular-nums">
              {isLoading ? (
                <div className="animate-pulse bg-blue-200 h-6 w-20 rounded"></div>
              ) : (
                parseFloat(ethBalance).toFixed(4)
              )}
            </div>
            <div className="text-xs text-blue-700 mt-1">Ethereum</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 via-purple-50 to-violet-100 rounded-xl p-4 border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">MBST Balance</span>
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-violet-600"></div>
              </div>
            </div>
            <div className="text-xl font-bold text-purple-900 tabular-nums">
              {isLoading ? (
                <div className="animate-pulse bg-purple-200 h-6 w-16 rounded"></div>
              ) : (
                parseFloat(tokenBalance).toFixed(0)
              )}
            </div>
            <div className="text-xs text-purple-700 mt-1">MBS Token</div>
          </div>
        </div>
      </div>
    </div>
  )
}
