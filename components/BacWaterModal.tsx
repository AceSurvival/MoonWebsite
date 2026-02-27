'use client'

import { useState, useEffect } from 'react'

interface BacWaterModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
}

export default function BacWaterModal({ isOpen, onClose, onAdd }: BacWaterModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-4">
          Do you need BAC Water?
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Your cart contains lyophilized peptides that require <strong>Bacteriostatic Water</strong> for reconstitution.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onAdd}
            className="flex-1 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-colors"
          >
            Yes - Add BAC Water Now
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}
