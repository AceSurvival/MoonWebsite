import type { Metadata } from 'next'
import { Inter, Poppins, Righteous } from 'next/font/google'
import './globals.css'
import TopBanners from '@/components/TopBanners'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ToastProvider } from '@/components/ToastProvider'
import { DarkModeProvider } from '@/contexts/DarkModeContext'
import DarkModeToggle from '@/components/DarkModeToggle'
import AgeVerification from '@/components/AgeVerification'
import NewsletterPopup from '@/components/NewsletterPopup'
import CartSlideOut from '@/components/CartSlideOut'

const inter = Inter({ subsets: ['latin'] })
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})
const righteous = Righteous({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-righteous',
})

export const metadata: Metadata = {
  title: 'Moon Beauty Alchemy - Research Vials & Cosmetic Peptides',
  description: 'Luxury-inspired research vials and cosmetic peptide ingredients for laboratory use only.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} ${righteous.variable}`}>
        <DarkModeProvider>
          <ToastProvider>
            <AgeVerification />
            <NewsletterPopup />
            <TopBanners />
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <DarkModeToggle />
            <CartSlideOut />
          </ToastProvider>
        </DarkModeProvider>
      </body>
    </html>
  )
}


