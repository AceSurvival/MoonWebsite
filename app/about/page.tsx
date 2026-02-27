import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-pink-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-8 gradient-text text-center">About Us</h1>

        <div className="glass p-8 rounded-3xl border border-purple-200/50 dark:border-purple-700/50 mb-8 space-y-6">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            We are a leading provider of high-quality peptides for laboratories, researchers, and academic institutions across the globe. All our products are synthesized and lyophilized in the United States, with purity levels exceeding 99%+. We have a wide offering of standard peptides as well as topical peptides, peptide blends, customizable orders, and an expert team ready to assist you.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-purple-200/50 dark:border-purple-700/50 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Why Choose Us?</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Top Quality</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our peptides are manufactured locally against the highest standards for synthesis, undergoing rigorous quality control measures to ensure their purity, stability, and consistency.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Range of Products</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We offer a comprehensive and industry-leading peptide catalog. Whether you require standard peptides, blends, topical peptides, or customized orders, our experienced team is ready to assist you.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Expert Customer Service</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We believe in building long-lasting relationships with our customers. Our dedicated customer support team is here to support you. We will do everything in our power to ensure that our customers are satisfied, even after products are delivered.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Fast and Free Delivery</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We strive to provide fast and reliable delivery, no matter where you are. For orders over $200, the shipping is on us.
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-purple-200/50 dark:border-purple-700/50 text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            For customized peptide inquiries or to place an order, please reach out to our customer support team by visiting our Contact page.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

