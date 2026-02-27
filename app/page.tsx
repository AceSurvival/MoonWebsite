import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { sortVariants } from '@/lib/variant-utils'
import ProductCard from '@/components/ProductCard'

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true, active: true, parentProductId: null },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          where: { active: true },
          orderBy: [
            { sortOrder: 'asc' },
            { variantName: 'asc' },
          ],
        },
      },
    })

    const globalSaleSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['global_sale_active', 'global_sale_percent'],
        },
      },
    })
    const settingsMap: Record<string, string> = {}
    globalSaleSettings.forEach((s) => {
      settingsMap[s.key] = s.value
    })
    const globalSaleActive = settingsMap['global_sale_active'] === 'true'
    const globalSalePercent = parseFloat(settingsMap['global_sale_percent'] || '0')

    const productsWithGlobalSale = products.map((product) => {
      const productSalePrice = (product as any).salePrice ?? null
      let finalSalePrice = productSalePrice
      if (globalSaleActive && globalSalePercent > 0 && !productSalePrice) {
        finalSalePrice = product.price * (1 - globalSalePercent / 100)
      }

      const sortedVariants = sortVariants(product.variants || [])
      let priceRange: { min: number; max: number } | null = null
      let featuredDisplay: { displayPrice: number; displayPriceOriginal: number; displayVariantName: string } | null = null

      if (product.variants && product.variants.length > 0) {
        const parentEffective = finalSalePrice ?? product.price
        const variantOptions: { effective: number; original: number; variantName: string }[] = sortedVariants.map((v: any) => {
          let variantSale = v.salePrice
          if (globalSaleActive && globalSalePercent > 0 && !v.salePrice) {
            variantSale = v.price * (1 - globalSalePercent / 100)
          }
          return {
            effective: variantSale ?? v.price,
            original: v.price,
            variantName: v.variantName || '',
          }
        })
        const allEffective = [parentEffective, ...variantOptions.map((o) => o.effective)]
        const minEffective = Math.min(...allEffective)
        const maxEffective = Math.max(...allEffective)
        if (minEffective !== maxEffective) {
          priceRange = { min: minEffective, max: maxEffective }
        }
        const cheapest = variantOptions.reduce((best, o) => (o.effective < best.effective ? o : best))
        featuredDisplay = {
          displayPrice: cheapest.effective,
          displayPriceOriginal: cheapest.original,
          displayVariantName: cheapest.variantName || 'Lowest price',
        }
      }

      return {
        ...product,
        salePrice: finalSalePrice,
        priceRange,
        featuredDisplay,
        variants: sortedVariants,
      }
    })

    return productsWithGlobalSale
  } catch (error) {
    return []
  }
}

async function getSettings() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['motd', 'promo_banner', 'logo_image', 'hero_background_image'],
        },
      },
    })
    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })
    return {
      motd: settingsMap['motd'] || '',
      promoBanner: settingsMap['promo_banner'] || '',
      logoImage: settingsMap['logo_image'] || '',
      heroBackgroundImage: settingsMap['hero_background_image'] || '',
    }
  } catch (error) {
    return { motd: '', promoBanner: '', logoImage: '', heroBackgroundImage: '' }
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts()
  const settings = await getSettings()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero - Clean, Peptira-style */}
      <section className="relative py-14 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          {settings.heroBackgroundImage ? (
            <>
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${settings.heroBackgroundImage})` }}
              />
              <div className="absolute inset-0 w-full h-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-[1px]" />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800/50" />
          )}
        </div>

        <div className="max-w-5xl mx-auto w-full relative z-10 text-center">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4">
            Moon Beauty Alchemy · Research Vials
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-100 tracking-tight mb-5 hero-logo">
            Moon Beauty Alchemy
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200/90 dark:text-gray-200 font-light max-w-2xl mx-auto mb-10">
            Luxe, lab-grade peptides and cosmetic actives inspired by the night sky.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link
              href="/store"
              className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Shop Now
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Learn More
            </Link>
          </div>

          {/* Trust badges - Peptira style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-left sm:text-center">
            <div className="flex flex-col items-center sm:block bg-gray-100/95 dark:bg-gray-800/60 rounded-xl px-5 py-4 border border-gray-200/60 dark:border-gray-700/60">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-3 mx-auto sm:mx-auto">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">For Research Purposes Only</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Handle in accordance with institutional safety guidelines.</p>
            </div>
            <div className="flex flex-col items-center sm:block bg-gray-100/95 dark:bg-gray-800/60 rounded-xl px-5 py-4 border border-gray-200/60 dark:border-gray-700/60">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-3 mx-auto sm:mx-auto">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Purity ≥97%</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Purity you can measure. Quality you can trust.</p>
            </div>
            <div className="flex flex-col items-center sm:block bg-gray-100/95 dark:bg-gray-800/60 rounded-xl px-5 py-4 border border-gray-200/60 dark:border-gray-700/60">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-3 mx-auto sm:mx-auto">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Premium USA Based</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Highest quality and fast shipping.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Featured Products
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
                  Research-grade peptides, third-party tested
                </p>
              </div>
              <Link
                href="/store"
                className="text-purple-600 dark:text-purple-400 font-semibold text-sm hover:underline shrink-0"
              >
                See all products →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                View All Products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Researchers Choose - 3 pillars like Peptira */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 tracking-tight mb-3">
              Why Researchers Choose Moon Beauty Alchemy
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
              Celestial branding, gold-tier service, and vials crafted for serious research and high-end cosmetic formulation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Third-Party Verified</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Every batch undergoes independent analysis to guarantee exceptional purity, batch-to-batch consistency, and research-grade reliability.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fast &amp; Trustworthy Shipping</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Same-day or next-day shipping when you order early. Quick, dependable delivery to keep your research on track.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Strictly for Scientific Research</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                All compounds are intended exclusively for laboratory research. We adhere to strict labeling and documentation for full compliance.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm hover:underline"
            >
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Short About / CTA */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950 border-t border-gray-800/60">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-4">
            Ready to elevate your formulations?
          </h2>
          <p className="text-gray-300 text-sm md:text-base mb-8">
            Partner with Moon Beauty Alchemy for premium peptide quality, precision, and reliability — trusted by researchers and formulators.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Us
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
