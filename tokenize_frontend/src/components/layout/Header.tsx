import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link, useLocation } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'

export const Header: React.FC = () => {
  const { role } = useRole()
  const location = useLocation()
  const isAdminVisible = role === 'SERVICE_PROVIDER'

  return (
    <header className="border-b bg-white">
      <div className="container flex items-center justify-between h-14">
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className={location.pathname === '/' ? 'text-primary' : 'text-neutral-900 hover:text-primary'}>Dashboard</Link>
          {isAdminVisible && (
            <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'text-primary' : 'text-neutral-900 hover:text-primary'}>Admin</Link>
          )}
        </nav>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    </header>
  )
}
