const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper function to create slug from name
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// Helper function to calculate individual vial price
// Original price is for 10 vials, so cost per vial = basePrice / 10
// Then apply 500% markup (6x) and round up
function calculatePrice(basePrice) {
  const costPerVial = basePrice / 10
  return Math.ceil(costPerVial * 6)
}

// Helper function to generate codename
// Anything ending in "tide" gets shortened (Retatrutide = Reta, Tirzepatide = Tirz)
// Others like MOTS-c, SS-31, etc. stay the same
function generateCodename(productName) {
  const name = productName.trim()
  
  // If it ends with "tide", remove "tide" and return the prefix
  if (name.toLowerCase().endsWith('tide')) {
    const withoutTide = name.slice(0, -4).trim()
    // Take first 4-5 characters or whole word if short
    if (withoutTide.length <= 5) {
      return withoutTide
    }
    // For longer names, take first 4 chars (e.g., "Retatru" -> "Reta", "Tirzepa" -> "Tirz")
    return withoutTide.substring(0, 4)
  }
  
  // For others, return as-is (MOTS-c, SS-31, etc.)
  return name
}

// Product descriptions for research purposes
const productDescriptions = {
  'NAD+': 'NAD+ (Nicotinamide Adenine Dinucleotide) is a coenzyme found in all living cells. Research suggests it plays a crucial role in cellular energy metabolism, DNA repair, and cellular signaling pathways. This buffered formulation is designed for laboratory research applications investigating cellular health and metabolic processes.',
  
  'GLOW': 'GLOW is a proprietary peptide blend formulation designed for research purposes. This combination peptide complex is intended for laboratory studies investigating potential synergistic effects of multiple peptide compounds in cellular research applications.',
  
  'Semaglutide': 'Semaglutide is a glucagon-like peptide-1 (GLP-1) receptor agonist. Research applications focus on studying metabolic pathways, glucose regulation, and related cellular mechanisms in laboratory settings.',
  
  'TB-500': 'TB-500 (Thymosin Beta-4) is a synthetic version of a naturally occurring peptide. Research applications include studies on tissue repair, cell migration, and wound healing mechanisms in laboratory environments.',
  
  'GHK-CU': 'GHK-Cu (Copper Peptide) is a tripeptide complexed with copper. Research focuses on studying collagen synthesis, tissue remodeling, and cellular repair mechanisms in laboratory research settings.',
  
  'Klow': 'Klow is a proprietary peptide blend containing multiple research peptides. This combination formulation is designed for laboratory studies investigating potential synergistic effects in cellular research applications.',
  
  'BPC-157': 'BPC-157 (Body Protection Compound-157) is a synthetic peptide derived from a protein found in gastric juice. Research applications include studies on tissue healing, gastrointestinal function, and cellular protection mechanisms in laboratory settings.',
  
  'Retatrutide': 'Retatrutide is a research peptide compound. Laboratory studies focus on investigating metabolic pathways and related cellular mechanisms in controlled research environments.',
  
  'Tirzepatide': 'Tirzepatide is a dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist. Research applications include studies on metabolic regulation, glucose homeostasis, and related cellular signaling pathways in laboratory settings.',
  
  'Sermorelin': 'Sermorelin is a growth hormone-releasing hormone (GHRH) analog. Research focuses on studying growth hormone secretion, cellular growth mechanisms, and related endocrine pathways in laboratory environments.',
  
  'Tesamorelin': 'Tesamorelin is a growth hormone-releasing factor analog. Research applications include studies on growth hormone regulation, metabolic processes, and related cellular mechanisms in laboratory settings.',
  
  'Cagrilintide': 'Cagrilintide is a research peptide compound. Laboratory studies focus on investigating metabolic pathways and related cellular mechanisms in controlled research environments.',
  
  'Mots-c': 'MOTS-c (Mitochondrial-Derived Peptide) is a peptide encoded in the mitochondrial genome. Research applications include studies on mitochondrial function, metabolic regulation, and cellular energy production in laboratory settings.',
  
  'Semax': 'Semax is a synthetic peptide derived from adrenocorticotropic hormone (ACTH). Research focuses on studying neuroprotective mechanisms, cognitive function, and related neurological pathways in laboratory environments.',
  
  'Selank': 'Selank is a synthetic peptide analog. Research applications include studies on neurological function, stress response mechanisms, and related cellular pathways in laboratory settings.',
  
  'SLU-PP-332': 'SLU-PP-332 is a research peptide compound. Laboratory studies focus on investigating cellular mechanisms and related pathways in controlled research environments.',
  
  'Epithalon': 'Epithalon (Epitalon) is a synthetic tetrapeptide. Research applications include studies on cellular aging, telomere function, and related longevity mechanisms in laboratory settings.',
  
  'SS31': 'SS-31 (Elamipretide) is a mitochondrial-targeted peptide. Research focuses on studying mitochondrial function, cellular energy production, and related metabolic pathways in laboratory environments.',
  
  'AOD-9604': 'AOD-9604 is a modified fragment of human growth hormone. Research applications include studies on metabolic regulation, fat metabolism, and related cellular mechanisms in laboratory settings.',
  
  'PT141': 'PT-141 (Bremelanotide) is a synthetic peptide analog. Research focuses on studying neurological signaling pathways and related cellular mechanisms in laboratory environments.',
  
  'Ipamorelin': 'Ipamorelin is a growth hormone secretagogue. Research applications include studies on growth hormone release, cellular growth mechanisms, and related endocrine pathways in laboratory settings.',
  
  'snap8': 'SNAP-8 is a synthetic peptide compound. Research focuses on studying cellular mechanisms and related pathways in controlled laboratory environments.',
  
  'MT-1': 'MT-1 (Melanotan I) is a synthetic peptide analog. Research applications include studies on melanocortin receptor pathways and related cellular signaling mechanisms in laboratory settings.',
  
  'MT-2': 'MT-2 (Melanotan II) is a synthetic peptide analog. Research focuses on studying melanocortin receptor function and related cellular signaling pathways in laboratory environments.',
  
  'CJC 1295': 'CJC-1295 (NO DAC) is a growth hormone-releasing hormone analog. Research applications include studies on growth hormone secretion, cellular growth mechanisms, and related endocrine pathways in laboratory settings.',
  
  'BB10': 'BB10 is a proprietary peptide blend containing TB-500 and BPC-157. This combination formulation is designed for laboratory studies investigating potential synergistic effects in tissue repair and cellular protection research.',
  
  'KPV': 'KPV is a tripeptide fragment. Research applications include studies on inflammatory pathways, cellular signaling, and related mechanisms in laboratory settings.',
  
  'BACwater': 'Bacteriostatic Water (BAC water) is sterile water containing 0.9% benzyl alcohol as a preservative. Used in laboratory research for reconstituting lyophilized peptides and maintaining sterility in research applications.',
  
  'Kisspeptin': 'Kisspeptin is a neuropeptide involved in reproductive function. Research focuses on studying reproductive hormone regulation, puberty onset mechanisms, and related endocrine pathways in laboratory environments.'
}

// Get category for a product
function getCategory(productName) {
  const name = productName.toLowerCase()
  if (name.includes('nad') || name.includes('ghk') || name.includes('glow') || name.includes('klow')) {
    return 'Anti-Aging & Skin Health'
  }
  if (name.includes('semaglutide') || name.includes('tirzepatide') || name.includes('retatrutide') || name.includes('cagrilintide')) {
    return 'Metabolic Research'
  }
  if (name.includes('bpc') || name.includes('tb-500') || name.includes('bb10')) {
    return 'Recovery & Healing'
  }
  if (name.includes('sermorelin') || name.includes('tesamorelin') || name.includes('ipamorelin') || name.includes('cjc') || name.includes('aod')) {
    return 'Growth Hormone Research'
  }
  if (name.includes('semax') || name.includes('selank') || name.includes('mots') || name.includes('epithalon') || name.includes('ss31')) {
    return 'Cognitive & Longevity'
  }
  if (name.includes('pt141') || name.includes('mt-1') || name.includes('mt-2') || name.includes('kisspeptin')) {
    return 'Specialized Research'
  }
  if (name.includes('bac') || name.includes('water')) {
    return 'Research Supplies'
  }
  return 'Research Peptides'
}

// All products from the price list
const products = [
  // NAD+
  { name: 'NAD+ (Buffered)', dose: '500mg', price: 80, vialSize: '500mg/vial' },
  { name: 'NAD+ (Buffered)', dose: '1000mg', price: 110, vialSize: '1000mg/vial' },
  
  // GLOW blends
  { name: 'GLOW (CU30+BP10+TB5) Mixed', dose: '50mg', price: 155, vialSize: '50mg/vial' },
  { name: 'GLOW (CU50+BP10+TB10) Mixed', dose: '70mg', price: 180, vialSize: '70mg/vial' },
  
  // Semaglutide
  { name: 'Semaglutide', dose: '20mg', price: 80, vialSize: '20mg/vial' },
  
  // TB-500
  { name: 'TB-500', dose: '10mg', price: 130, vialSize: '10mg/vial' },
  
  // GHK-CU
  { name: 'GHK-CU', dose: '50mg', price: 50, vialSize: '50mg/vial' },
  { name: 'GHK-CU', dose: '100mg', price: 80, vialSize: '100mg/vial' },
  
  // Klow
  { name: 'Klow (CU+BPC+TB+KPV) Mixed', dose: '80mg', price: 200, vialSize: '80mg/vial' },
  
  // BPC-157
  { name: 'BPC-157', dose: '10mg', price: 60, vialSize: '10mg/vial' },
  
  // Retatrutide
  { name: 'Retatrutide', dose: '5mg', price: 80, vialSize: '5mg/vial' },
  { name: 'Retatrutide', dose: '10mg', price: 130, vialSize: '10mg/vial' },
  { name: 'Retatrutide', dose: '15mg', price: 180, vialSize: '15mg/vial' },
  { name: 'Retatrutide', dose: '20mg', price: 208, vialSize: '20mg/vial' },
  { name: 'Retatrutide', dose: '30mg', price: 270, vialSize: '30mg/vial' },
  { name: 'Retatrutide', dose: '40mg', price: 300, vialSize: '40mg/vial' },
  { name: 'Retatrutide', dose: '50mg', price: 340, vialSize: '50mg/vial' },
  { name: 'Retatrutide', dose: '60mg', price: 380, vialSize: '60mg/vial' },
  
  // Tirzepatide
  { name: 'Tirzepatide', dose: '5mg', price: 55, vialSize: '5mg/vial' },
  { name: 'Tirzepatide', dose: '10mg', price: 78, vialSize: '10mg/vial' },
  { name: 'Tirzepatide', dose: '15mg', price: 98, vialSize: '15mg/vial' },
  { name: 'Tirzepatide', dose: '20mg', price: 108, vialSize: '20mg/vial' },
  { name: 'Tirzepatide', dose: '30mg', price: 138, vialSize: '30mg/vial' },
  { name: 'Tirzepatide', dose: '40mg', price: 170, vialSize: '40mg/vial' },
  { name: 'Tirzepatide', dose: '60mg', price: 250, vialSize: '60mg/vial' },
  { name: 'Tirzepatide', dose: '120mg', price: 450, vialSize: '120mg/vial' },
  
  // Sermorelin
  { name: 'Sermorelin', dose: '5mg', price: 121, vialSize: '5mg/vial' },
  { name: 'Sermorelin', dose: '10mg', price: 150, vialSize: '10mg/vial' },
  
  // Tesamorelin
  { name: 'Tesamorelin', dose: '5mg', price: 88, vialSize: '5mg/vial' },
  { name: 'Tesamorelin', dose: '10mg', price: 158, vialSize: '10mg/vial' },
  
  // Cagrilintide
  { name: 'Cagrilintide', dose: '5mg', price: 110, vialSize: '5mg/vial' },
  { name: 'Cagrilintide', dose: '10mg', price: 160, vialSize: '10mg/vial' },
  
  // MOTS-c
  { name: 'MOTS-c', dose: '10mg', price: 75, vialSize: '5mg/vial' },
  { name: 'MOTS-c', dose: '40mg', price: 200, vialSize: '10mg/vial' },
  
  // Semax
  { name: 'Semax', dose: '10mg', price: 65, vialSize: '10mg/vial' },
  
  // Selank
  { name: 'Selank', dose: '10mg', price: 55, vialSize: '10mg/vial' },
  
  // SLU-PP-332
  { name: 'SLU-PP-332', dose: '5mg', price: 65, vialSize: '10vials/kit' },
  
  // Epithalon
  { name: 'Epithalon', dose: '10mg', price: 55, vialSize: '10mg/vial' },
  
  // SS31
  { name: 'SS31', dose: '10mg', price: 100, vialSize: '10mg/vial' },
  
  // AOD-9604
  { name: 'AOD-9604', dose: '5mg', price: 90, vialSize: '5mg/vial' },
  
  // PT141
  { name: 'PT141', dose: '10mg', price: 58, vialSize: '10mg/vial' },
  
  // Ipamorelin
  { name: 'Ipamorelin', dose: '5mg', price: 50, vialSize: '5mg/vial' },
  { name: 'Ipamorelin', dose: '10mg', price: 75, vialSize: '10mg/vial' },
  
  // SNAP8
  { name: 'SNAP8', dose: '10mg', price: 70, vialSize: '10mg/vial' },
  
  // MT-1
  { name: 'MT-1', dose: '10mg', price: 55, vialSize: '10mg/vial' },
  
  // MT-2
  { name: 'MT-2', dose: '10mg', price: 55, vialSize: '10mg/vial' },
  
  // CJC 1295
  { name: 'CJC 1295 (NO DAC)', dose: '5mg', price: 90, vialSize: '5mg/vial' },
  { name: 'CJC 1295 (NO DAC)', dose: '10mg', price: 155, vialSize: '10mg/vial' },
  
  // BB10
  { name: 'BB10 (TB5+BPC5)', dose: '10mg', price: 120, vialSize: '10mg/vial' },
  
  // KPV
  { name: 'KPV', dose: '10mg', price: 55, vialSize: '10mg/vial' },
  
  // BACwater
  { name: 'BACwater', dose: '3ml', price: 10, vialSize: '3ml' },
  { name: 'BACwater', dose: '10ml', price: 25, vialSize: '10ml' },
  
  // Kisspeptin
  { name: 'Kisspeptin', dose: '10mg', price: 80, vialSize: '10mg/vial' },
]

// Get description for product
function getDescription(productName) {
  const name = productName.toLowerCase()
  for (const [key, desc] of Object.entries(productDescriptions)) {
    if (name.includes(key.toLowerCase())) {
      return desc
    }
  }
  return `${productName} is a research peptide compound designed for laboratory use. This product is intended for research purposes only and is not for human consumption, medical use, veterinary use, or household use. All products are synthesized and lyophilized in the United States with purity levels exceeding 99%.`
}

async function main() {
  console.log('Starting bulk product creation...\n')
  
  let created = 0
  let skipped = 0
  
  for (const product of products) {
    try {
      const fullName = `${product.name} ${product.dose}`
      const slug = slugify(fullName)
      
      const finalPrice = calculatePrice(product.price)
      const description = getDescription(product.name)
      const category = getCategory(product.name)
      const codename = generateCodename(product.name)
      
      // Check if product already exists
      const existing = await prisma.product.findUnique({
        where: { slug },
      })
      
      if (existing) {
        // Update existing product
        await prisma.product.update({
          where: { slug },
          data: {
            name: fullName,
            description: description,
            price: finalPrice,
            category: category,
            purity: '99%+',
            vialSize: product.vialSize,
            codename: codename,
            active: true,
            outOfStock: false,
          },
        })
        console.log(`🔄 Updated: ${fullName} (${codename}) - $${finalPrice} (was $${product.price})`)
        skipped++
      } else {
        // Create new product
        await prisma.product.create({
          data: {
            name: fullName,
            slug: slug,
            description: description,
            price: finalPrice,
            category: category,
            purity: '99%+',
            vialSize: product.vialSize,
            codename: codename,
            active: true,
            featured: false,
            outOfStock: false,
          },
        })
        console.log(`✅ Created: ${fullName} (${codename}) - $${finalPrice} (was $${product.price})`)
        created++
      }
    } catch (error) {
      console.error(`❌ Error processing ${product.name} ${product.dose}:`, error.message)
    }
  }
  
  console.log(`\n✨ Done! Created ${created} products, updated ${skipped} existing products.`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

