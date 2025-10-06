import React from 'react'

type Role = 'SERVICE_PROVIDER' | 'WHITELISTED' | 'NON_WHITELISTED' | 'DISCONNECTED'

export const RoleBadge: React.FC<{ role: Role }>=({ role })=>{
  const map: Record<Role, { label: string; color: string }> = {
    SERVICE_PROVIDER: { label: 'Service Provider', color: 'bg-primary text-white' },
    WHITELISTED: { label: 'Whitelisted Investor', color: 'bg-accent text-neutral-900' },
    NON_WHITELISTED: { label: 'Non‑whitelisted', color: 'bg-neutral-700 text-white' },
    DISCONNECTED: { label: 'Disconnected', color: 'bg-neutral-700 text-white' }
  }
  const { label, color } = map[role]
  return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{label}</span>
}
