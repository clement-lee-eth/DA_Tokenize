import React from 'react'
import { Stat } from '../shared/Stat'

export const AssetHero: React.FC<{
  title: string
  subtitle?: string
  imageUrl?: string
  tags?: string[]
  priceEth: string
  raisedEth: string
}> = ({ title, subtitle, imageUrl = '/src/assets/property-hero.svg', tags = [], priceEth, raisedEth }) => {
  return (
    <section className="card overflow-hidden">
      <div className="grid md:grid-cols-5">
        <div className="relative md:col-span-3 bg-neutral-100 aspect-[16/9] md:aspect-auto">
          {/* eslint-disable-next-line */}
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-3 text-white/90 text-xs px-2 py-1 rounded bg-neutral-900/40 backdrop-blur-sm">
            Mock Property Visual
          </div>
        </div>
        <div className="md:col-span-2 p-4 flex flex-col gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
            {subtitle && <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{subtitle}</p>}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t} className="badge">{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Stat label="Token price" value={`${priceEth} ETH`} />
            <Stat label="Total raised" value={`${raisedEth} ETH`} />
          </div>
        </div>
      </div>
    </section>
  )
}
