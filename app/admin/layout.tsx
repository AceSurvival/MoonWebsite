'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ToastProvider } from '@/components/ToastProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      // Skip auth check on login page
      if (pathname === '/admin/login') {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/admin/me', {
          credentials: 'include',
        })
        if (!res.ok) {
          router.push('/admin/login')
          return
        }
      } catch (error) {
        router.push('/admin/login')
        return
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, pathname])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-purple-200 dark:border-purple-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin" className="text-xl font-bold gradient-text">
              Admin Panel
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname === '/admin' ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/products') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Products
              </Link>
              <Link
                href="/admin/orders"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/orders') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Orders
              </Link>
              <Link
                href="/admin/faqs"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/faqs') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                FAQs
              </Link>
              <Link
                href="/admin/discount-codes"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/discount-codes') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Discount Codes
              </Link>
              <Link
                href="/admin/creator-codes"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/creator-codes') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Creator Codes
              </Link>
              <Link
                href="/admin/statistics"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/statistics') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Statistics
              </Link>
              <Link
                href="/admin/settings"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/settings') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Settings
              </Link>
              <Link
                href="/admin/email"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/email') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Email
              </Link>
              <Link
                href="/admin/newsletter"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/newsletter') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Newsletter
              </Link>
              <Link
                href="/admin/categories"
                className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                  pathname.startsWith('/admin/categories') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Categories
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <ToastProvider>
          {children}
        </ToastProvider>
      </main>
    </div>
  )
}


