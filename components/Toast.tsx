'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const bgColor =
    type === 'success'
      ? 'bg-gradient-to-r from-green-500 to-green-600'
      : type === 'error'
      ? 'bg-gradient-to-r from-red-500 to-red-600'
      : 'bg-gradient-to-r from-purple-500 to-purple-600'

  const icon =
    type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border border-white/30 flex items-center gap-3 min-w-[300px] max-w-md`}
      >
        <span className="text-2xl font-bold">{icon}</span>
        <p className="flex-1 font-semibold">{message}</p>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors text-xl font-bold leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}

