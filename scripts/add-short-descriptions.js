const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Generate short description based on product name and type
function generateShortDescription(product) {
  const name = product.name.toLowerCase()
  
  // Retatrutide / GLP3-RETA
  if (name.includes('retatrutide') || name.includes('glp3-reta') || name.includes('reta')) {
    return 'A research peptide evaluated in metabolic and glucose regulation studies. Triple receptor agonist for laboratory research.'
  }
  
  // Tirzepatide / GLP2-TIRZ
  if (name.includes('tirzepatide') || name.includes('glp2-tirz') || name.includes('tirz')) {
    return 'A research peptide evaluated in metabolic and glucose regulation studies. Dual receptor agonist for laboratory research.'
  }
  
  // Semaglutide / GLP1-SEMA
  if (name.includes('semaglutide') || name.includes('glp1-sema') || name.includes('sema')) {
    return 'A research peptide evaluated in metabolic and glucose regulation studies. GLP-1 receptor agonist for laboratory research.'
  }
  
  // BPC-157
  if (name.includes('bpc-157') || name.includes('bpc157')) {
    return 'A research peptide evaluated in tissue healing and gastrointestinal function studies. Synthetic peptide for laboratory research.'
  }
  
  // TB-500
  if (name.includes('tb-500') || name.includes('tb500')) {
    return 'A research peptide evaluated in tissue repair and wound healing studies. Synthetic thymosin beta-4 for laboratory research.'
  }
  
  // GHK-Cu
  if (name.includes('ghk') && (name.includes('cu') || name.includes('copper'))) {
    return 'A research peptide evaluated in anti-aging and wound healing studies. Copper peptide complex for laboratory research.'
  }
  
  // NAD+
  if (name.includes('nad')) {
    return 'A research compound evaluated in cellular energy metabolism and DNA repair studies. Buffered formulation for laboratory research.'
  }
  
  // GLOW blends
  if (name.includes('glow')) {
    return 'A research peptide blend evaluated in various cellular research applications. Mixed formulation for laboratory research.'
  }
  
  // Klow blends
  if (name.includes('klow')) {
    return 'A research peptide blend evaluated in various cellular research applications. Mixed formulation for laboratory research.'
  }
  
  // Cagrilintide
  if (name.includes('cagrilintide') || name.includes('cag')) {
    return 'A research peptide evaluated in metabolic studies. Amylin receptor agonist for laboratory research.'
  }
  
  // Sermorelin
  if (name.includes('sermorelin')) {
    return 'A research peptide evaluated in growth hormone release studies. GHRH analog for laboratory research.'
  }
  
  // Ipamorelin
  if (name.includes('ipamorelin')) {
    return 'A research peptide evaluated in growth hormone release studies. Growth hormone secretagogue for laboratory research.'
  }
  
  // Tesamorelin
  if (name.includes('tesamorelin')) {
    return 'A research peptide evaluated in growth hormone release studies. GHRH analog for laboratory research.'
  }
  
  // CJC 1295
  if (name.includes('cjc') && name.includes('1295')) {
    return 'A research peptide evaluated in growth hormone release studies. GHRH analog for laboratory research.'
  }
  
  // MOTS-c
  if (name.includes('mots')) {
    return 'A research peptide evaluated in mitochondrial function and metabolic studies. Mitochondrial-derived peptide for laboratory research.'
  }
  
  // SS-31 / SS31
  if (name.includes('ss-31') || name.includes('ss31')) {
    return 'A research peptide evaluated in mitochondrial function studies. Mitochondrial-targeted peptide for laboratory research.'
  }
  
  // AOD-9604
  if (name.includes('aod-9604') || name.includes('aod9604')) {
    return 'A research peptide evaluated in metabolic and fat metabolism studies. Growth hormone fragment for laboratory research.'
  }
  
  // PT-141 / PT141
  if (name.includes('pt-141') || name.includes('pt141')) {
    return 'A research peptide evaluated in neurological and behavioral studies. Melanocortin receptor agonist for laboratory research.'
  }
  
  // Semax
  if (name.includes('semax')) {
    return 'A research peptide evaluated in neurological and cognitive studies. Synthetic peptide for laboratory research.'
  }
  
  // Selank
  if (name.includes('selank')) {
    return 'A research peptide evaluated in neurological and cognitive studies. Synthetic peptide for laboratory research.'
  }
  
  // SNAP-8 / SNAP8
  if (name.includes('snap')) {
    return 'A research peptide evaluated in cosmetic and anti-aging studies. Synthetic peptide for laboratory research.'
  }
  
  // MT-1 / MT-2
  if (name.includes('mt-1') || name.includes('mt-2') || name.includes('mt1') || name.includes('mt2')) {
    return 'A research peptide evaluated in pigmentation and tanning studies. Melanocortin receptor agonist for laboratory research.'
  }
  
  // Epithalon
  if (name.includes('epithalon')) {
    return 'A research peptide evaluated in anti-aging and telomere studies. Synthetic peptide for laboratory research.'
  }
  
  // Kisspeptin
  if (name.includes('kisspeptin')) {
    return 'A research peptide evaluated in reproductive and hormonal studies. Neuropeptide for laboratory research.'
  }
  
  // KPV
  if (name.includes('kpv') && !name.includes('klow')) {
    return 'A research peptide evaluated in anti-inflammatory studies. Tripeptide for laboratory research.'
  }
  
  // BB10
  if (name.includes('bb10')) {
    return 'A research peptide blend evaluated in tissue repair studies. Mixed formulation for laboratory research.'
  }
  
  // BACwater
  if (name.includes('bacwater') || name.includes('bac water')) {
    return 'Bacteriostatic water for reconstitution of research peptides. Sterile solution for laboratory use.'
  }
  
  // Default fallback
  return 'A research peptide intended for laboratory research applications. Not for human consumption.'
}

async function main() {
  console.log('Starting short description update...\n')
  
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
    })
    
    console.log(`Found ${products.length} products to update\n`)
    
    let updated = 0
    let skipped = 0
    
    for (const product of products) {
      try {
        // Only update if shortDescription is null or empty
        if (!product.shortDescription || product.shortDescription.trim() === '') {
          const shortDesc = generateShortDescription(product)
          
          await prisma.product.update({
            where: { id: product.id },
            data: { shortDescription: shortDesc },
          })
          
          console.log(`✅ Updated: ${product.name}`)
          updated++
        } else {
          console.log(`⏭️  Skipped (already has short description): ${product.name}`)
          skipped++
        }
      } catch (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message)
        skipped++
      }
    }
    
    console.log(`\n✨ Done! Updated ${updated} products, ${skipped} skipped.`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })



