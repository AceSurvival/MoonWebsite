/**
 * One-off: fix product/variant names that say 1010MG to 10MG (e.g. GLP3-RETA 1010MG -> GLP3-RETA 10MG)
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function fix1010(str) {
  if (!str || typeof str !== 'string') return str
  return str.replace(/\b1010\s*mg\b/gi, '10mg').replace(/\b1010MG\b/g, '10MG')
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: '1010', mode: 'insensitive' } },
        { variantName: { contains: '1010', mode: 'insensitive' } },
      ],
    },
  })
  console.log(`Found ${products.length} product(s) with 1010 in name or variantName`)
  for (const p of products) {
    const newName = fix1010(p.name)
    const newVariantName = p.variantName ? fix1010(p.variantName) : null
    if (newName !== p.name || (newVariantName !== null && newVariantName !== p.variantName)) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          ...(newName !== p.name && { name: newName }),
          ...(p.variantName != null && newVariantName !== p.variantName && { variantName: newVariantName }),
        },
      })
      console.log(`Updated ${p.id}: name "${p.name}" -> "${newName}"${p.variantName != null ? `, variantName "${p.variantName}" -> "${newVariantName}"` : ''}`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
