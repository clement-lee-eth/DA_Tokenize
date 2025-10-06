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
        duration: 3500,
        style: {
          background: '#ffffff',
          color: '#374151',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '14px 18px',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '380px',
          minWidth: '280px',
          wordBreak: 'break-word',
          lineHeight: '1.4',
        },
        // Success toast styling
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          style: {
            border: '1px solid #10b981',
            background: '#ecfdf5',
            color: '#065f46',
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
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
            color: '#991b1b',
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)',
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
            color: '#1e40af',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)',
          },
        },
      }}
    />
  )
}
