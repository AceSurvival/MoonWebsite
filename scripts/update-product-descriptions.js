const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Extract amount from product name (e.g., "Retatrutide 20mg" -> "20mg")
function extractAmount(productName) {
  const match = productName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
  if (match) {
    return `${match[1]}${match[2].toLowerCase()}`
  }
  return null
}

// Get container info from vialSize
function getContainer(vialSize) {
  if (!vialSize) return 'In a 3ml vial.'
  
  // Extract size from vialSize (e.g., "20mg/vial" -> "3ml vial")
  if (vialSize.includes('ml')) {
    return `In a ${vialSize}.`
  }
  // If it's mg/vial, assume 3ml vial
  return 'In a 3ml vial.'
}

// Get application text based on product name
function getApplication(productName) {
  const name = productName.toLowerCase()
  
  if (name.includes('retatrutide') || name.includes('tirzepatide') || name.includes('semaglutide')) {
    return 'A research peptide that has been evaluated in metabolic and glucose regulation studies.'
  }
  if (name.includes('bpc-157')) {
    return 'A research peptide that has been evaluated in tissue healing and gastrointestinal function studies.'
  }
  if (name.includes('tb-500') || name.includes('tb500')) {
    return 'A research peptide that has been evaluated in tissue repair and wound healing studies.'
  }
  if (name.includes('ghk') || name.includes('copper')) {
    return 'A research peptide that has been evaluated in anti-aging and wound healing studies.'
  }
  if (name.includes('nad')) {
    return 'A research compound that has been evaluated in cellular energy metabolism and DNA repair studies.'
  }
  if (name.includes('glow') || name.includes('klow')) {
    return 'A research peptide blend that has been evaluated in various cellular research applications.'
  }
  
  return 'A research peptide intended for laboratory research applications.'
}

// Get appearance based on product
function getAppearance(productName, vialSize) {
  const container = vialSize ? getContainer(vialSize) : '3mL glass ampule'
  const containerText = container.includes('ml') ? container.replace('In a ', '').replace('.', '') : '3mL glass ampule'
  
  if (productName.toLowerCase().includes('ghk') || productName.toLowerCase().includes('copper')) {
    return `Solid, blue powder in a ${containerText}.`
  }
  return `Solid, lyophilized powder in a ${containerText}.`
}

// Get chemical information for known products
function getChemicalInfo(productName) {
  const name = productName.toLowerCase()
  
  // GHK-Cu
  if (name.includes('ghk') && (name.includes('cu') || name.includes('copper'))) {
    return {
      chemicalFormula: 'C28H46CuN12O8',
      pubchemCid: '9831891',
      casNumber: '49557-75-7',
      molecularWeight: '340.384',
      synonyms: ['Copper peptide', 'Gly-His-Lys', 'GHK-Copper']
    }
  }
  
  // BPC-157
  if (name.includes('bpc-157') || name.includes('bpc157')) {
    return {
      chemicalFormula: 'C62H98N16O22',
      pubchemCid: '16152391',
      casNumber: '137525-51-0',
      molecularWeight: '1419.6',
      synonyms: ['Body Protection Compound-157', 'BPC 157']
    }
  }
  
  // TB-500
  if (name.includes('tb-500') || name.includes('tb500')) {
    return {
      chemicalFormula: 'C212H350N56O78S',
      pubchemCid: '16129783',
      casNumber: 'N/A',
      molecularWeight: '4963.5',
      synonyms: ['Thymosin Beta-4', 'TB-500']
    }
  }
  
  // Semaglutide
  if (name.includes('semaglutide') || name.includes('sema')) {
    return {
      chemicalFormula: 'C187H291N45O59',
      pubchemCid: '56843331',
      casNumber: '910463-68-2',
      molecularWeight: '4113.6',
      synonyms: ['Semaglutide', 'GLP-1 receptor agonist']
    }
  }
  
  // Tirzepatide
  if (name.includes('tirzepatide') || name.includes('tirz')) {
    return {
      chemicalFormula: 'C225H348N48O68',
      pubchemCid: '156588319',
      casNumber: '2023788-19-2',
      molecularWeight: '4813.6',
      synonyms: ['Tirzepatide', 'GLP-1/GIP receptor agonist']
    }
  }
  
  // Retatrutide
  if (name.includes('retatrutide') || name.includes('reta')) {
    return {
      chemicalFormula: 'C172H265N43O51',
      pubchemCid: '156588319',
      casNumber: 'N/A',
      molecularWeight: '3964.3',
      synonyms: ['Retatrutide', 'GLP-1/GIP/Glucagon receptor agonist']
    }
  }
  
  return null
}

// Generate structured description HTML
function generateDescriptionHTML(product) {
  const amount = extractAmount(product.name) || (product.vialSize ? product.vialSize.split('/')[0] : 'N/A')
  const purity = product.purity || '>99%'
  const container = getContainer(product.vialSize)
  const application = getApplication(product.name)
  const appearance = getAppearance(product.name, product.vialSize)
  const chemicalInfo = getChemicalInfo(product.name)
  
  let html = '<div class="product-specifications">'
  html += '<div class="space-y-4">'
  
  // Product Specifications
  html += '<div class="mb-6">'
  html += '<h4 class="font-semibold mb-3 text-lg"><strong>Product Specifications:</strong></h4>'
  html += '<ul class="list-none space-y-2">'
  html += `<li><strong>Product:</strong> ${product.name}</li>`
  html += `<li><strong>Amount:</strong> ${amount}</li>`
  html += `<li><strong>Form:</strong> Lyophilized Powder</li>`
  html += `<li><strong>Purity:</strong> ${purity}</li>`
  html += `<li><strong>Container:</strong> ${container}</li>`
  html += `<li><strong>Reconstitution Note:</strong> Requires reconstitution with a solvent such as bacteriostatic water (<a href="/store" class="text-purple-600 dark:text-purple-400 hover:underline">Sold Here</a>).</li>`
  html += '</ul>'
  html += '</div>'
  
  // Application
  html += '<div class="mb-6">'
  html += '<h4 class="font-semibold mb-2"><strong>Application:</strong></h4>'
  html += `<p>${application}</p>`
  html += '</div>'
  
  // Appearance
  html += '<div class="mb-6">'
  html += '<h4 class="font-semibold mb-2"><strong>Appearance:</strong></h4>'
  html += `<p>${appearance}</p>`
  html += '</div>'
  
  // Chemical Information
  if (chemicalInfo) {
    html += '<div class="mb-6">'
    html += '<h4 class="font-semibold mb-3"><strong>Chemical Information:</strong></h4>'
    html += '<ul class="list-none space-y-2">'
    if (chemicalInfo.chemicalFormula) {
      html += `<li><strong>Chemical Formula:</strong> ${chemicalInfo.chemicalFormula}</li>`
    }
    if (chemicalInfo.pubchemCid) {
      html += `<li><strong>PubChem CID:</strong> ${chemicalInfo.pubchemCid}</li>`
    }
    if (chemicalInfo.casNumber) {
      html += `<li><strong>CAS Number:</strong> ${chemicalInfo.casNumber}</li>`
    }
    if (chemicalInfo.molecularWeight) {
      html += `<li><strong>Molecular Weight:</strong> ${chemicalInfo.molecularWeight} g/mol</li>`
    }
    html += '</ul>'
    html += '</div>'
    
    // Synonyms
    if (chemicalInfo.synonyms && chemicalInfo.synonyms.length > 0) {
      html += '<div class="mb-6">'
      html += '<h4 class="font-semibold mb-2"><strong>Synonyms:</strong></h4>'
      html += '<ul class="list-disc list-inside space-y-1">'
      chemicalInfo.synonyms.forEach(synonym => {
        html += `<li>${synonym}</li>`
      })
      html += '</ul>'
      html += '</div>'
    }
  }
  
  // Storage
  html += '<div class="mb-6">'
  html += '<h4 class="font-semibold mb-2"><strong>Storage:</strong></h4>'
  html += '<p>Store at ≤25°C, sealed, away from heat, light, and moisture.</p>'
  html += '</div>'
  
  // Concentration
  html += '<div class="mb-6">'
  html += '<h4 class="font-semibold mb-2"><strong>Concentration:</strong></h4>'
  html += `<p>≥${purity.replace(/>|%/g, '')}%</p>`
  html += '</div>'
  
  html += '</div>'
  html += '</div>'
  
  return html
}

async function main() {
  console.log('Starting product description update...\n')
  
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
    })
    
    console.log(`Found ${products.length} products to update\n`)
    
    let updated = 0
    let skipped = 0
    
    for (const product of products) {
      try {
        const newDescription = generateDescriptionHTML(product)
        
        await prisma.product.update({
          where: { id: product.id },
          data: { description: newDescription },
        })
        
        console.log(`✅ Updated: ${product.name}`)
        updated++
      } catch (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message)
        skipped++
      }
    }
    
    console.log(`\n✨ Done! Updated ${updated} products, ${skipped} errors.`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })



