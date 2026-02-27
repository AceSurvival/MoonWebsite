const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Create output directory
const outputDir = path.join(process.cwd(), 'public', 'product-images')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Helper function to generate codename (same as bulk script)
function generateCodename(productName) {
  const name = productName.trim()
  if (name.toLowerCase().endsWith('tide')) {
    const withoutTide = name.slice(0, -4).trim()
    if (withoutTide.length <= 5) {
      return withoutTide
    }
    return withoutTide.substring(0, 4)
  }
  return name
}

// Extract dose from product name or variant name (e.g., "Retatrutide 20mg" -> "20mg")
function extractDose(productName, variantName = null) {
  // Try variant name first
  if (variantName) {
    const match = variantName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
    if (match) {
      return `${match[1]}${match[2].toLowerCase()}`
    }
  }
  // Then try product name
  const match = productName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
  if (match) {
    return `${match[1]}${match[2].toLowerCase()}`
  }
  return ''
}

// Extract product name without mg amount
function extractProductName(productName) {
  // Remove mg amounts and common suffixes
  return productName
    .replace(/\s*\d+(?:\.\d+)?\s*(mg|ml|g).*/i, '')
    .replace(/\s*\(.*?\)/g, '') // Remove parentheses content
    .trim()
}

// Generate product code from name and dose (format like "GLP-3 RT" or "RETA 20")
function generateProductCode(productName, dose) {
  const codename = generateCodename(productName)
  const doseNum = dose.match(/\d+/)?.[0] || ''
  
  // Format like "GLP-3 RT" - use codename and dose
  // For Retatrutide -> Reta, format as "RETA 20"
  if (codename.length <= 4) {
    return `${codename.toUpperCase()} ${doseNum}`
  }
  // For longer codenames, use first 3-4 chars
  const shortCode = codename.substring(0, 3).toUpperCase()
  return `${shortCode} ${doseNum}`
}

// Helper to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// Helper to wrap text to fit within max width
function wrapText(ctx, text, maxWidth, fontSize) {
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0]
  
  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + ' ' + word).width
    if (width < maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}

async function generateProductImage(product) {
  // Load base image template
  const baseImagePath = path.join(process.cwd(), 'public', 'product-template.png')
  
  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Base image not found at: ${baseImagePath}. Please place your product template image at public/product-template.png`)
  }
  
  const baseImage = await loadImage(baseImagePath)
  const width = baseImage.width
  const height = baseImage.height
  
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  // Draw the base image
  ctx.drawImage(baseImage, 0, 0, width, height)
  
  // Now overlay text on the image
  // Product name in white area below logo (centered)
  const productName = extractProductName(product.name)
  
  // Calculate positions based on image dimensions
  // Adjust these values based on your actual image layout
  const labelCenterX = width / 2
  const productNameY = height * 0.25 // Adjust this to position product name in white area below logo
  
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 56px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Wrap text if too long
  const maxWidth = width * 0.7
  const productNameLines = wrapText(ctx, productName, maxWidth, 56)
  let lineY = productNameY - (productNameLines.length - 1) * 35
  productNameLines.forEach(line => {
    ctx.fillText(line, labelCenterX, lineY)
    lineY += 70
  })
  
  // MG amount text above purple band (in white area)
  const dose = extractDose(product.name, product.variantName)
  const mgY = height * 0.45 // Adjust this to position MG amount above purple band
  
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 64px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (dose) {
    ctx.fillText(dose, labelCenterX, mgY)
  }
  
  // "99% PURITY" text on purple band (white text, bold)
  const purityY = height * 0.52 // Adjust this to position on purple band
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.fillText('99% PURITY', labelCenterX, purityY)
  
  // Save image
  // Use variant name in filename if it's a variant, otherwise use slug
  let filename
  if (product.variantName && product.parentProductId) {
    // For variants, use parent slug + variant name
    // Get parent product slug
    let parentSlug = product.slug
    if (product.parentProduct) {
      parentSlug = product.parentProduct.slug
    } else if (product.parentProductId) {
      const parentProduct = await prisma.product.findUnique({
        where: { id: product.parentProductId },
        select: { slug: true }
      })
      if (parentProduct) {
        parentSlug = parentProduct.slug
      }
    }
    const variantSlug = product.variantName.replace(/\s+/g, '').toLowerCase()
    filename = `${parentSlug}-${variantSlug}.png`
  } else {
    filename = `${product.slug}.png`
  }
  
  const filepath = path.join(outputDir, filename)
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(filepath, buffer)
  
  return `/product-images/${filename}`
}

async function main() {
  console.log('Starting product image generation with new design...\n')
  
  try {
    // Get all active products, including variants
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        parentProduct: {
          select: { slug: true }
        }
      },
      orderBy: [
        { parentProductId: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log(`Found ${products.length} products to process\n`)
    
    let generated = 0
    let updated = 0
    
    for (const product of products) {
      try {
        const imageUrl = await generateProductImage(product)
        
        // Update product with generated image URL
        // For variants, update variantImageUrl; for parents, update imageUrl
        const updateData = product.parentProductId 
          ? { variantImageUrl: imageUrl }
          : { imageUrl }
        
        await prisma.product.update({
          where: { id: product.id },
          data: updateData,
        })
        
        const displayName = product.variantName 
          ? `${product.name} (${product.variantName})`
          : product.name
        
        console.log(`✅ Generated: ${displayName} -> ${imageUrl}`)
        generated++
        updated++
      } catch (error) {
        console.error(`❌ Error generating image for ${product.name}:`, error.message)
        console.error(error.stack)
      }
    }
    
    console.log(`\n✨ Done! Generated ${generated} images and updated ${updated} products.`)
    console.log(`Images saved to: ${outputDir}`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
