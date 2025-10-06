import React from 'react'
import { useAccount } from 'wagmi'
import { RoleBadge } from '../shared/RoleBadge'
import { Address } from '../shared/Address'
import { useRole } from '../../hooks/useRole'

export const RoleBanner: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { role, isLoading } = useRole()

  return (
    <section className="w-full rounded-2xl border bg-white/80 backdrop-blur shadow-sm">
      <div className="px-6 py-4 md:px-8 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <div className="text-sm md:text-base text-slate-800">
            {isConnected && address ? (
              <span className="inline-flex items-center gap-2">
                Connected as <Address value={address} />
              </span>
            ) : (
              <span>Not connected</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <span className="text-xs md:text-sm text-slate-600 animate-pulse">Checking role…</span>
          ) : (
            <RoleBadge role={isConnected ? role : 'DISCONNECTED'} />
          )}
        </div>
      </div>
    </section>
  )
}

