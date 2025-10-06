import React from 'react'
import { Stat } from '../shared/Stat'

export const AssetHero: React.FC<{
  title: string
  subtitle?: string
  imageUrl?: string
  tags?: string[]
  priceEth: string
  raisedEth: string
  propertyValue?: string
}> = ({ title, subtitle, imageUrl = '/src/assets/marina_bay_sands.jpg', tags = [], priceEth, raisedEth, propertyValue }) => {
  return (
    <section className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-lg">
      <div className="space-y-6">
        {/* Property Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-slate-600 mt-1 text-sm">{subtitle}</p>
          )}
        </div>

        {/* Property Image - Much Smaller */}
        <div className="relative w-full max-w-xs mx-auto bg-slate-100 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line */}
          <img src={imageUrl} alt={title} className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
          <div className="absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded bg-white/20 backdrop-blur-sm">
            <span className="font-medium">Marina Bay Sands</span>
          </div>
        </div>
        
        {/* Property Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {tags.map(t => (
              <span key={t} className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                {t}
              </span>
            ))}
          </div>
        )}
        
        {/* Key Metrics - Compact Design */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Token Price</span>
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <img src="/src/assets/eth_logo.png" alt="ETH" width="12" height="12" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-900 tabular-nums">{priceEth}</span>
              <span className="text-sm font-semibold text-blue-700">ETH</span>
            </div>
          </div>
          
          {propertyValue && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">Property Value</span>
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-purple-600">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-purple-900 tabular-nums">{propertyValue}</span>
                <span className="text-sm font-semibold text-purple-700">USD</span>
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Total Raised</span>
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <img src="/src/assets/eth_logo.png" alt="ETH" width="12" height="12" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-900 tabular-nums">{raisedEth}</span>
              <span className="text-sm font-semibold text-emerald-700">ETH</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
