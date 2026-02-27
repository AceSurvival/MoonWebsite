'use client'

import { useEffect, useState } from 'react'

export default function AgeVerification() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Check if user has already verified their age
    const verified = localStorage.getItem('ageVerified21')
    if (verified === 'true') {
      setIsVerified(true)
      setShowModal(false)
    } else {
      setIsVerified(false)
      setShowModal(true)
    }
  }, [])

  const handleConfirm = () => {
    localStorage.setItem('ageVerified21', 'true')
    setIsVerified(true)
    setShowModal(false)
  }

  const handleDecline = () => {
    // Redirect to a page explaining they must be 21+
    window.location.href = 'https://www.google.com'
  }

  // Don't render anything until we've checked localStorage
  if (isVerified === null) {
    return null
  }

  // If verified, don't show modal
  if (isVerified) {
    return null
  }

  // Show blocking modal
  return (
    <>
      {/* Block all content behind modal */}
      <div className="fixed inset-0 z-[9998] bg-black/50" />
      
      {/* Age verification modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 border-4 border-purple-500 dark:border-purple-700">
          <div className="text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🔞</div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Age Verification Required
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                You must be 21 years or older to access this website.
              </p>
            </div>

            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300 font-semibold">
                ⚠️ This website contains products for laboratory research use only. 
                You must be 21 years of age or older to proceed.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full px-6 py-4 bg-gradient-to-r from-neon-purple to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-lg"
              >
                I am 21 years or older
              </button>
              <button
                onClick={handleDecline}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-colors"
              >
                I am under 21
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
              By clicking "I am 21 years or older", you confirm that you are of legal age 
              and agree to our terms of service.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
