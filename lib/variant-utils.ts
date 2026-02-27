/**
 * Normalize display: remove erroneous "10" before "MG" (placeholder bug).
 * e.g. "2010MG" -> "20MG", "1010MG" -> "10MG", "3010MG" -> "30MG"
 */
export function normalizeMgDisplay(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return text || ''
  return text.replace(/(\d+)10(\s*mg)/gi, (_, num, mg) => num + mg)
}

/**
 * Extract MG amount from variant name (e.g., "10mg" -> 10, "20mg" -> 20)
 */
export function extractMgAmount(variantName: string | null): number | null {
  if (!variantName) return null
  
  const match = variantName.match(/(\d+(?:\.\d+)?)\s*mg/i)
  if (match) {
    return parseFloat(match[1])
  }
  
  return null
}

/**
 * Sort variants by sortOrder first, then by MG amount (lowest to highest)
 */
export function sortVariants(variants: Array<{ sortOrder: number | null; variantName: string | null }>) {
  return [...variants].sort((a, b) => {
    // First, sort by sortOrder if both have it
    if (a.sortOrder !== null && b.sortOrder !== null) {
      return a.sortOrder - b.sortOrder
    }
    
    // If only one has sortOrder, prioritize it
    if (a.sortOrder !== null) return -1
    if (b.sortOrder !== null) return 1
    
    // If neither has sortOrder, sort by MG amount
    const aMg = extractMgAmount(a.variantName)
    const bMg = extractMgAmount(b.variantName)
    
    if (aMg !== null && bMg !== null) {
      return aMg - bMg
    }
    
    // If one has MG and other doesn't, prioritize the one with MG
    if (aMg !== null) return -1
    if (bMg !== null) return 1
    
    // Fallback to variant name alphabetical
    return (a.variantName || '').localeCompare(b.variantName || '')
  })
}

/**
 * Replace MG amounts in text with a new MG amount
 */
export function replaceMgInText(text: string, newMg: number): string {
  // Match patterns like "50mg", "50 mg", "50MG", etc.
  const mgPattern = /(\d+(?:\.\d+)?)\s*mg/gi
  
  return text.replace(mgPattern, (match, mgAmount) => {
    return `${newMg}${match.substring(match.indexOf('mg'))}`
  })
}

/**
 * Replace variant-specific information in description
 * This handles cases where variant names contain composition info (e.g., "CU50-BP10-TB10 mixed")
 */
export function replaceVariantInfoInDescription(
  description: string, 
  variantName: string | null,
  baseVariantName?: string | null
): string {
  if (!variantName || !description) return description
  
  // If variant name contains composition info (like "CU50-BP10-TB10 mixed")
  // try to replace similar patterns in the description
  if (variantName.includes('CU') || variantName.includes('BP') || variantName.includes('TB')) {
    // Look for patterns like "CU30+BP10+TB5", "CU30-BP10-TB5", etc. in description
    const compositionPattern = /(CU\d+(?:\+|-)?BP\d+(?:\+|-)?TB\d+)/gi
    if (compositionPattern.test(description)) {
      // Extract the composition from variant name (e.g., "CU50-BP10-TB10 mixed" -> "CU50-BP10-TB10")
      const variantComposition = variantName.match(/(CU\d+(?:\+|-)?BP\d+(?:\+|-)?TB\d+)/i)
      if (variantComposition) {
        return description.replace(compositionPattern, variantComposition[0])
      }
    }
  }
  
  // Also replace MG amounts if variant has MG info
  const variantMg = extractMgAmount(variantName)
  if (variantMg !== null) {
    return replaceMgInText(description, variantMg)
  }
  
  return description
}

/**
 * Replace MG amounts in vial size (e.g., "50mg/vial" -> "100mg/vial")
 */
export function replaceMgInVialSize(vialSize: string | null, newMg: number): string | null {
  if (!vialSize) return null
  
  // Match patterns like "50mg/vial", "50 mg/vial", "50MG/vial", etc.
  const mgPattern = /(\d+(?:\.\d+)?)\s*mg\s*\/\s*vial/gi
  
  return vialSize.replace(mgPattern, (match) => {
    return `${newMg}mg/vial`
  })
}
