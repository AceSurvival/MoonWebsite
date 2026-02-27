'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const [logoImage, setLogoImage] = useState<string | null>(null)

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0)
      setCartCount(count)
    }
    updateCartCount()
    window.addEventListener('storage', updateCartCount)
    const interval = setInterval(updateCartCount, 1000)
    return () => {
      window.removeEventListener('storage', updateCartCount)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    async function fetchLogo() {
      try {
        const res = await fetch('/api/settings/logo', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (res.ok) {
          const data = await res.json()
          setLogoImage(data.logoImage || null)
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
      }
    }
    fetchLogo()
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <nav className="glass border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 backdrop-blur-xl bg-white/98 dark:bg-gray-900/98">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo on the left - Always show image only */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {logoImage && (
              <Image
                src={logoImage}
                alt="Moon Beauty Alchemy Logo"
                width={600}
                height={180}
                className="h-12 sm:h-14 md:h-16 w-auto object-contain"
                priority
                unoptimized
              />
            )}
          </Link>

          {/* Navigation links - hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/') && pathname === '/'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Home
            </Link>
            <Link
              href="/store"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/store')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Store
            </Link>
            <Link
              href="/faq"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/faq')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              FAQ
            </Link>
            <Link
              href="/calculator"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/calculator')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Calculator
            </Link>
            <Link
              href="/about"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/about')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/contact')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Contact
            </Link>
            <Link
              href="/cart"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 relative ${
                isActive('/cart')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center gap-2">
                Cart
                {cartCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/cart"
              className="px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 relative text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile navigation menu - always visible on mobile */}
        <div className="md:hidden pb-4 border-t border-gray-200/50 dark:border-gray-700/50 mt-2 pt-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/') && pathname === '/'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Home
            </Link>
            <Link
              href="/store"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/store')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Store
            </Link>
            <Link
              href="/faq"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/faq')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              FAQ
            </Link>
            <Link
              href="/calculator"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/calculator')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Calculator
            </Link>
            <Link
              href="/about"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/about')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive('/contact')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}


