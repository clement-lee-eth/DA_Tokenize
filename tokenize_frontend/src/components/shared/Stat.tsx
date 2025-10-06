import React from 'react'

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string }>=({ label, value, hint })=>{
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-neutral-700">{label}</span>
      <span className="text-2xl font-semibold text-neutral-900 tabular-nums">{value}</span>
      {hint && <span className="text-xs text-neutral-700">{hint}</span>}
    </div>
  )
}
