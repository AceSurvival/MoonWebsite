/**
 * Template for generating structured product descriptions
 * This matches the format shown in the product description image
 */

export interface ProductDescriptionData {
  productName: string
  amount: string // e.g., "50mg"
  form: string // e.g., "Lyophilized Powder"
  purity: string // e.g., ">99%"
  container: string // e.g., "In a 3ml vial."
  reconstitutionNote?: string
  application: string
  appearance: string
  chemicalFormula?: string
  pubchemCid?: string
  casNumber?: string
  molecularWeight?: string
  synonyms?: string[]
  storage: string
  concentration?: string
}

export function generateProductDescriptionHTML(data: ProductDescriptionData): string {
  const {
    productName,
    amount,
    form,
    purity,
    container,
    reconstitutionNote = 'Requires reconstitution with a solvent such as bacteriostatic water (<a href="/store">Sold Here</a>).',
    application,
    appearance,
    chemicalFormula,
    pubchemCid,
    casNumber,
    molecularWeight,
    synonyms,
    storage,
    concentration
  } = data

  let html = '<div class="product-specifications">'
  
  html += '<h3 class="text-xl font-bold mb-4">Description</h3>'
  html += '<div class="space-y-3">'
  
  // Product Specifications
  html += '<div class="spec-section mb-6">'
  html += '<h4 class="font-semibold mb-3 text-lg">Product Specifications:</h4>'
  html += '<ul class="list-none space-y-2">'
  html += `<li><strong>Product:</strong> ${productName}</li>`
  html += `<li><strong>Amount:</strong> ${amount}</li>`
  html += `<li><strong>Form:</strong> ${form}</li>`
  html += `<li><strong>Purity:</strong> ${purity}</li>`
  html += `<li><strong>Container:</strong> ${container}</li>`
  if (reconstitutionNote) {
    html += `<li><strong>Reconstitution Note:</strong> ${reconstitutionNote}</li>`
  }
  html += '</ul>'
  html += '</div>'
  
  // Application
  html += '<div class="spec-section mb-6">'
  html += '<h4 class="font-semibold mb-2">Application:</h4>'
  html += `<p>${application}</p>`
  html += '</div>'
  
  // Appearance
  html += '<div class="spec-section mb-6">'
  html += '<h4 class="font-semibold mb-2">Appearance:</h4>'
  html += `<p>${appearance}</p>`
  html += '</div>'
  
  // Chemical Information
  if (chemicalFormula || pubchemCid || casNumber || molecularWeight) {
    html += '<div class="spec-section mb-6">'
    html += '<h4 class="font-semibold mb-3">Chemical Information:</h4>'
    html += '<ul class="list-none space-y-2">'
    if (chemicalFormula) {
      html += `<li><strong>Chemical Formula:</strong> ${chemicalFormula}</li>`
    }
    if (pubchemCid) {
      html += `<li><strong>PubChem CID:</strong> ${pubchemCid}</li>`
    }
    if (casNumber) {
      html += `<li><strong>CAS Number:</strong> ${casNumber}</li>`
    }
    if (molecularWeight) {
      html += `<li><strong>Molecular Weight:</strong> ${molecularWeight} g/mol</li>`
    }
    html += '</ul>'
    html += '</div>'
  }
  
  // Synonyms
  if (synonyms && synonyms.length > 0) {
    html += '<div class="spec-section mb-6">'
    html += '<h4 class="font-semibold mb-2">Synonyms:</h4>'
    html += '<ul class="list-disc list-inside space-y-1">'
    synonyms.forEach(synonym => {
      html += `<li>${synonym}</li>`
    })
    html += '</ul>'
    html += '</div>'
  }
  
  // Storage
  html += '<div class="spec-section mb-6">'
  html += '<h4 class="font-semibold mb-2">Storage:</h4>'
  html += `<p>${storage}</p>`
  html += '</div>'
  
  // Concentration
  if (concentration) {
    html += '<div class="spec-section mb-6">'
    html += '<h4 class="font-semibold mb-2">Concentration:</h4>'
    html += `<p>${concentration}</p>`
    html += '</div>'
  }
  
  html += '</div>'
  html += '</div>'
  
  return html
}

/**
 * Example usage for GHK-Cu (from the image):
 */
export const exampleGHKCu = {
  productName: 'GHK-Cu',
  amount: '50mg',
  form: 'Lyophilized Powder',
  purity: '>99%',
  container: 'In a 3ml vial.',
  application: 'A research peptide that has been evaluated in anti-aging and wound healing studies.',
  appearance: 'Solid, blue powder in a 3mL glass ampule.',
  chemicalFormula: 'C28H46CuN12O8',
  pubchemCid: '9831891',
  casNumber: '49557-75-7',
  molecularWeight: '340.384',
  synonyms: ['Copper peptide', 'Gly-His-Lys', 'GHK-Copper'],
  storage: 'Store at ≤25°C, sealed, away from heat, light, and moisture.',
  concentration: '≥99%'
}



