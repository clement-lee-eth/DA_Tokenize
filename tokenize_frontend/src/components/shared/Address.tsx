import React from 'react'

export const Address: React.FC<{ value: string }>=({ value })=>{
  const short = value.length > 10 ? `${value.slice(0,6)}…${value.slice(-4)}` : value
  const copy = async () => {
    try { await navigator.clipboard.writeText(value) } catch {}
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-2 text-primary hover:underline">
      <span className="font-mono">{short}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-700">
        <path d="M9 9h9v12H9z" stroke="currentColor"/><path d="M6 3h12v3" stroke="currentColor"/><path d="M6 3v12h3" stroke="currentColor"/>
      </svg>
    </button>
  )
}
