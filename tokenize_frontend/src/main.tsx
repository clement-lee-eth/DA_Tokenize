import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { WalletProvider } from './app/providers/WalletProvider'
import { ToastProvider } from './components/shared/ToastProvider'
import { DashboardPage } from './pages/DashboardPage'
import { AdminPage } from './pages/AdminPage'
import { InvestPage } from './pages/InvestPage'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <DashboardPage /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '/invest', element: <InvestPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <RouterProvider router={router} />
      <ToastProvider />
    </WalletProvider>
  </React.StrictMode>
)
