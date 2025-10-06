import React from 'react'

export const Card: React.FC<{ title?: string; actions?: React.ReactNode; children: React.ReactNode }>=({ title, actions, children })=>{
  return (
    <section className="card p-4">
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3">
          {title ? <h2 className="card-title">{title}</h2> : <div />}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
