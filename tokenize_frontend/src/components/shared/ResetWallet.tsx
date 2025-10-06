import React from 'react'
import { useDisconnect } from 'wagmi'
import toast from 'react-hot-toast'

export const ResetWallet: React.FC = () => {
  const { disconnect } = useDisconnect()

  const handleReset = () => {
    try {
      // Disconnect wallet to reset nonce tracking
      disconnect()
      toast.success('Wallet disconnected. Please reconnect to reset nonce tracking.', {
        duration: 5000,
      })
    } catch (error) {
      toast.error('Failed to reset wallet connection')
    }
  }

  return (
    <button
      onClick={handleReset}
      className="px-4 py-2 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors border border-orange-200"
    >
      Reset Wallet
    </button>
  )
}
