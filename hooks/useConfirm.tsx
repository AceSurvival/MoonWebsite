'use client'

import { useState, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
  } | null>(null)

  const confirm = useCallback(
    (
      message: string,
      onConfirm: () => void,
      confirmText?: string,
      cancelText?: string
    ) => {
      setConfirmState({ message, onConfirm, confirmText, cancelText })
    },
    []
  )

  const handleConfirm = () => {
    if (confirmState) {
      confirmState.onConfirm()
      setConfirmState(null)
    }
  }

  const handleCancel = () => {
    setConfirmState(null)
  }

  const ConfirmComponent = confirmState ? (
    <ConfirmDialog
      message={confirmState.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
    />
  ) : null

  return { confirm, ConfirmComponent }
}

