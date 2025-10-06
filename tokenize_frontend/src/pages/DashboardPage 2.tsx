import React from 'react'
import { Header } from '../components/layout/Header'

export const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-full">
      <Header />
      <main className="container py-6 grid gap-6">
        <section className="bg-white rounded-md border p-4">
          <h2 className="text-lg font-semibold text-primary">Property</h2>
          <p className="text-sm text-neutral-700">Name, location, total value and token price (0.001 ETH).</p>
        </section>
        <section className="bg-white rounded-md border p-4">
          <h2 className="text-lg font-semibold text-primary">Progress</h2>
          <p className="text-sm text-neutral-700">Total supply vs hard cap, total ETH raised.</p>
        </section>
      </main>
    </div>
  )
}
