import React from 'react'

export const Table: React.FC<{ columns: string[]; rows: React.ReactNode[][] }>=({ columns, rows })=>{
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            {columns.map(c => (
              <th key={c} className="py-2 pr-4 font-medium text-neutral-700">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-b-0">
              {r.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-neutral-900">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
