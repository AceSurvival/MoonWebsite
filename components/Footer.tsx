'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Footer() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 mt-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Moon Beauty Alchemy</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Celestial-inspired research vials and cosmetic actives for laboratory use only.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Quick links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/store" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Get in touch</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Questions? Reach out for support.
            </p>
            <Link href="/contact" className="text-purple-600 dark:text-purple-400 font-medium text-sm hover:underline">
              Contact us
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Legal</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-3xl">
            All products are sold for laboratory research use only. Not for human consumption, medical use, veterinary use, or household use. These products are intended for research purposes in a controlled laboratory environment only.
          </p>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} Moon Beauty Alchemy. All rights reserved.
          </p>
          
          {/* FDA Disclaimer Dropdown */}
          <div className="mt-6 max-w-4xl mx-auto">
            <button
              onClick={() => setIsDisclaimerOpen(!isDisclaimerOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                FDA Disclaimer
              </span>
              <svg
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isDisclaimerOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDisclaimerOpen && (
              <div className="mt-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-left shadow-sm">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <p>
                    Moon Beauty Alchemy is a chemical supplier. Moon Beauty Alchemy is not a compounding pharmacy or chemical compounding facility as defined under 503A of the Federal Food, Drug, and Cosmetic act. Moon Beauty Alchemy is not an outsourcing facility as defined under 503B of the Federal Food, Drug, and Cosmetic act.
                  </p>
                  
                  <p className="font-semibold">
                    THE PRODUCTS WE OFFER ARE NOT INTENDED FOR HUMAN USE. THEY ARE INTENDED FOR IN-VITRO AND PRE-CLINICAL RESEARCH PURPOSES ONLY. THE CUSTOMER ACKNOWLEDGES THAT THERE ARE RISKS IN THE HANDLING, USE, AND DISTRIBUTION OF THESE PRODUCTS, AND CERTIFIES THAT IT HAS THE PROPER EQUIPMENT, FACILITIES, AND PERSONNEL FOR MANAGING THOSE RISKS; AND THE CUSTOMER KNOWINGLY ACCEPTS THESE RISKS. THESE CHEMICALS ARE NOT INTENDED TO BE USED AND SHOULD NOT BE USED IN INAPPROPRIATE APPLICATIONS, SUCH AS, WITHOUT LIMITATION, FOOD ADDITIVES, DRUGS, COSMETICS, HOUSEHOLD CHEMICALS, OR OTHER APPLICATIONS OUTSIDE OF IN-VITRO LABORATORY RESEARCH, PRE-CLINICAL RESEARCH, OR IN LABORATORY CHEMICAL SYNTHESIS OR TESTING OF DIFFERENT MATERIALS.
                  </p>
                  
                  <p>
                    SELLER IS AWARE THAT IN PURCHASING THESE PRODUCTS, CUSTOMER IS AGREEING TO THE ABOVE. HOWEVER, IN THE EVENT THAT CUSTOMER UTILIZES OR CAUSES OTHERS TO USE THESE PRODUCTS OUTSIDE OF THE ABOVE RESTRICTIONS, CUSTOMER IS ACCEPTING SUCH RISKS OF DOING SO ON ITSELF, ABSOLVING SELLER OF ANY RESPONSIBILITY FOR SUCH CUSTOMER ACTIONS, AND SPECIFICALLY AGREES TO INDEMNIFY, DEFEND, AND HOLD HARMLESS SELLER FROM ANY AND ALL CLAIMS, DAMAGES, LOSSES, LIABILITIES, COSTS, AND EXPENSES (INCLUDING REASONABLE ATTORNEYS' FEES) ARISING OUT OF OR RELATING TO CUSTOMER'S USE OR MISUSE OF THESE PRODUCTS.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}


