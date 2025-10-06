import React from 'react'
import { Header } from '../components/layout/Header'
import { RoleBanner } from '../components/layout/RoleBanner'

export const InvestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <RoleBanner />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Investment Page</h1>
          <p className="text-slate-600">This page is for future investment features.</p>
        </div>
      </div>
    </div>
  )
}