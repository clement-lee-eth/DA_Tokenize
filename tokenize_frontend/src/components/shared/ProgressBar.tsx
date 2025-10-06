import React from 'react'

export const ProgressBar: React.FC<{ value: number; max: number }>=({ value, max })=>{
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div className="w-full h-3 bg-neutral-100 border rounded overflow-hidden">
      <div className="h-3 rounded bg-gradient-to-r from-primary to-primary-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}
