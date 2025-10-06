import React from 'react'
import { Toaster } from 'react-hot-toast'

export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={12}
      containerClassName="!bottom-4 !right-4"
      containerStyle={{
        position: 'fixed',
        zIndex: 9999,
        margin: 0,
        padding: 0,
        width: 'auto',
        height: 'auto',
        pointerEvents: 'none',
      }}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: '500',
          maxWidth: '320px',
          minWidth: '280px',
        },
        // Success toast styling
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          style: {
            border: '1px solid #10b981',
            background: '#f0fdf4',
            boxShadow: '0 4px 12px -2px rgba(16, 185, 129, 0.15), 0 2px 4px -1px rgba(16, 185, 129, 0.1)',
          },
        },
        // Error toast styling
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          style: {
            border: '1px solid #ef4444',
            background: '#fef2f2',
            boxShadow: '0 4px 12px -2px rgba(239, 68, 68, 0.15), 0 2px 4px -1px rgba(239, 68, 68, 0.1)',
          },
        },
        // Loading toast styling
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#ffffff',
          },
          style: {
            border: '1px solid #3b82f6',
            background: '#eff6ff',
            boxShadow: '0 4px 12px -2px rgba(59, 130, 246, 0.15), 0 2px 4px -1px rgba(59, 130, 246, 0.1)',
          },
        },
      }}
    />
  )
}
