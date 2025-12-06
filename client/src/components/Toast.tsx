import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type = 'success', duration = 2000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  }[type]

  return (
    <div 
      style={{
        animation: 'slideInUp 0.3s ease-out',
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999
      }}
      className={`${bgColor} text-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 max-w-md`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <span className="font-medium">{message}</span>
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '0 0 0 12px',
          width: '100%',
          animation: `shrinkWidth ${duration}ms linear forwards`
        }}
      >
        <style>{`
          @keyframes shrinkWidth {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
