import React, { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/shared/Card'
import { Table } from '../components/shared/Table'
import { RoleBadge } from '../components/shared/RoleBadge'

export const AdminPage: React.FC = () => {
  const role: 'SERVICE_PROVIDER' | 'WHITELISTED' | 'NON_WHITELISTED' | 'DISCONNECTED' = 'DISCONNECTED'
  const [addr, setAddr] = useState('')
  const [claw, setClaw] = useState({ addr: '', amount: '' })

  const holders = [
    ['0xA...A', '10,000'],
    ['0xB...B', '20,000'],
  ]

  return (
    <div className="min-h-full">
      <Header />
      <main className="container py-6 grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Service Provider Console</h1>
          <RoleBadge role={role} />
        </div>

        <Card title="Whitelist / Blacklist">
          <div className="grid md:grid-cols-3 gap-4">
            <input
              className="border rounded px-3 py-2 col-span-2"
              placeholder="0x investor address"
              value={addr}
              onChange={(e)=>setAddr(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="bg-primary text-white px-3 py-2 rounded disabled:opacity-50" disabled>Whitelist</button>
              <button className="border px-3 py-2 rounded disabled:opacity-50" disabled>Blacklist</button>
            </div>
          </div>
          <p className="text-xs text-neutral-700 mt-2">Disabled: UI‑only mode. Logic will be wired later.</p>
        </Card>

        <Card title="Holders">
          <Table columns={["Address", "Balance"]} rows={holders} />
        </Card>

        <Card title="Clawback">
          <div className="grid md:grid-cols-3 gap-4">
            <input className="border rounded px-3 py-2" placeholder="0x address" value={claw.addr} onChange={e=>setClaw(p=>({ ...p, addr: e.target.value }))} />
            <input className="border rounded px-3 py-2" placeholder="amount (tokens)" value={claw.amount} onChange={e=>setClaw(p=>({ ...p, amount: e.target.value }))} />
            <button className="bg-primary text-white px-3 py-2 rounded disabled:opacity-50" disabled>Clawback</button>
          </div>
        </Card>
      </main>
    </div>
  )
}
