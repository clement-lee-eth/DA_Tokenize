import React from 'react'
import { useAccount } from 'wagmi'
import { RoleBadge } from '../shared/RoleBadge'
import { Address } from '../shared/Address'
import { useRole } from '../../hooks/useRole'

export const RoleBanner: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { role, isLoading } = useRole()

  return (
    <div className="flex items-center justify-between bg-white border rounded-md px-3 py-2">
      <div className="text-sm text-neutral-700">
        {isConnected && address ? (
          <span className="inline-flex items-center gap-2">
            Connected as <Address value={address} />
          </span>
        ) : (
          <span>Not connected</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isLoading ? <span className="text-xs text-neutral-700">Detecting role…</span> : <RoleBadge role={isConnected ? role : 'DISCONNECTED'} />}
      </div>
    </div>
  )
}

