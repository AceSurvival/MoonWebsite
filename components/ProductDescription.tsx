'use client'

import { normalizeMgDisplay } from '@/lib/variant-utils'

interface ProductDescriptionProps {
  description: string
  productName: string
  purity: string | null
  vialSize: string | null
}

export default function ProductDescription({ description, productName, purity, vialSize }: ProductDescriptionProps) {
  const normalizedDescription = normalizeMgDisplay(description)
  // Parse structured data from description HTML
  // The description should contain structured data in a specific format
  // We'll try to extract it, or display it as-is if it's already formatted
  
  // Helper function to extract value from HTML
  const extractValue = (html: string, label: string): string | null => {
    const regex = new RegExp(`<strong>${label}:</strong>\\s*([^<]+)`, 'i')
    const match = html.match(regex)
    return match ? match[1].trim() : null
  }

  // Try to parse structured format, otherwise display as formatted HTML
  const hasStructuredFormat = normalizedDescription.includes('<strong>Product:</strong>') || 
                              normalizedDescription.includes('<strong>Amount:</strong>') ||
                              normalizedDescription.includes('Product:') ||
                              normalizedDescription.includes('Amount:')

  if (hasStructuredFormat) {
    // Parse and display in structured format (normalized to fix X10MG -> XMG)
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Description</h3>
        <div className="space-y-4">
          <div 
            className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: normalizedDescription }}
          />
        </div>
      </div>
    )
  }

  // If not structured, create a template structure based on available data
  // This will help guide admins on the format
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Description</h3>
      <div className="space-y-4 text-gray-700 dark:text-gray-300">
        <div>
          <strong>Product:</strong> {normalizeMgDisplay(productName)}
        </div>
        {vialSize && (
          <div>
            <strong>Amount:</strong> {vialSize}
          </div>
        )}
        <div>
          <strong>Form:</strong> Lyophilized Powder
        </div>
        {purity && (
          <div>
            <strong>Purity:</strong> {purity}
          </div>
        )}
        {vialSize && (
          <div>
            <strong>Container:</strong> In a {vialSize.includes('ml') ? vialSize : `${vialSize} vial`}.
          </div>
        )}
        <div>
          <strong>Reconstitution Note:</strong> Requires reconstitution with a solvent such as bacteriostatic water (<a href="/store" className="text-purple-600 dark:text-purple-400 hover:underline">Sold Here</a>).
        </div>
        <div className="mt-6">
          <strong>Application:</strong>
          <div 
            className="mt-2 prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: normalizedDescription }}
          />
        </div>
        <div>
          <strong>Appearance:</strong> Solid, lyophilized powder in a glass vial.
        </div>
        <div className="mt-6">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: normalizedDescription }}
          />
        </div>
      </div>
    </div>
  )
}



