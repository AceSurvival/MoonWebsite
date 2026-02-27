'use client'

import { useState, useEffect } from 'react'

export default function TopBanners() {
  const [settings, setSettings] = useState({ motd: '', promoBanner: '' })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings/banners', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Error fetching banner settings:', error)
      }
    }
    fetchSettings()
    
    // Refetch periodically to ensure fresh data
    const interval = setInterval(fetchSettings, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Promo Banner - Moved Above MOTD */}
      {settings.promoBanner && (
        <div className="bg-purple-600 dark:bg-purple-700 py-2 sm:py-3 px-4 w-full">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm sm:text-base text-white font-medium break-words whitespace-normal">{settings.promoBanner}</p>
          </div>
        </div>
      )}

      {/* MOTD Banner */}
      {settings.motd && (
        <div className="bg-gray-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 py-2 px-4 w-full">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium break-words whitespace-normal">{settings.motd}</p>
          </div>
        </div>
      )}
    </>
  )
}

