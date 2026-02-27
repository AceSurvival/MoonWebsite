const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const faqs = [
  {
    question: 'Why can\'t peptides be claimed for human consumption?',
    answer: 'Peptides sold for research purposes are not approved by the FDA for human consumption. They are manufactured and sold strictly for laboratory research use only. This is a legal requirement to ensure compliance with regulations and to protect both the manufacturer and the researcher. Our products are intended for scientific research, academic studies, and laboratory testing only.'
  },
  {
    question: 'What does "Research Use Only" mean?',
    answer: '"Research Use Only" means that our peptides are intended exclusively for laboratory research, scientific studies, and academic purposes. They are not approved for human consumption, medical use, veterinary use, or household use. This designation ensures compliance with regulatory requirements and maintains the integrity of scientific research.'
  },
  {
    question: 'Are your peptides safe for research?',
    answer: 'Yes, our peptides are manufactured in the United States under strict quality control standards with purity levels exceeding 99%+. They undergo rigorous testing to ensure consistency, stability, and purity. However, they must be handled according to proper laboratory safety protocols and are intended for research purposes only.'
  },
  {
    question: 'What is the purity of your peptides?',
    answer: 'All our peptides have purity levels exceeding 99%+. Each batch undergoes quality control testing to verify purity, and certificates of analysis are available upon request. We maintain the highest standards to ensure the quality and consistency of our research-grade peptides.'
  },
  {
    question: 'Where are your peptides manufactured?',
    answer: 'All our peptides are synthesized and lyophilized in the United States. We work with certified facilities that adhere to strict manufacturing standards and quality control measures to ensure the highest quality products for research purposes.'
  },
  {
    question: 'Can I use these peptides for medical purposes?',
    answer: 'No. Our peptides are strictly for laboratory research use only. They are not approved for medical use, human consumption, veterinary use, or any therapeutic applications. If you are conducting research that may have medical implications, please consult with appropriate regulatory bodies and ensure compliance with all applicable laws and regulations.'
  },
  {
    question: 'Do you offer custom peptide synthesis?',
    answer: 'Yes, we offer customizable peptide orders. Our expert team can work with you to create custom peptides tailored to your specific research needs. Please contact our customer support team through the Contact page to discuss your requirements and receive a quote.'
  },
  {
    question: 'What is the difference between standard peptides, blends, and topical peptides?',
    answer: 'Standard peptides are individual peptide compounds. Peptide blends are combinations of multiple peptides formulated for specific research applications. Topical peptides are designed for research involving topical application studies. All are manufactured to the same high purity standards and are for research use only.'
  },
  {
    question: 'How should peptides be stored?',
    answer: 'Peptides should be stored according to the specific storage instructions provided with each product. Generally, peptides should be kept in a cool, dry place, protected from light and moisture. Many peptides require refrigeration or freezing. Always follow the storage guidelines provided with your order to maintain product integrity.'
  },
  {
    question: 'What shipping methods do you use?',
    answer: 'We strive to provide fast and reliable delivery. Shipping methods may vary based on your location and order requirements. For orders over $200, shipping is free. We use reputable shipping carriers to ensure your research materials arrive safely and on time.'
  },
  {
    question: 'Can I return or exchange peptides?',
    answer: 'Due to the nature of research materials and to ensure product integrity, we have specific return and exchange policies. Please contact our customer support team if you have any concerns about your order, and we will work with you to find an appropriate solution.'
  },
  {
    question: 'Do you provide certificates of analysis?',
    answer: 'Yes, certificates of analysis (COA) are available for our products. These documents provide detailed information about purity, testing results, and quality control data. You can request a COA when placing your order or contact our customer support team for more information.'
  }
]

async function main() {
  console.log('Seeding FAQs...')
  
  for (const faq of faqs) {
    try {
      // Check if FAQ already exists
      const existing = await prisma.faq.findFirst({
        where: { question: faq.question }
      })
      
      if (!existing) {
        await prisma.faq.create({
          data: faq
        })
        console.log(`Created FAQ: ${faq.question}`)
      } else {
        console.log(`FAQ already exists: ${faq.question}`)
      }
    } catch (error) {
      console.error(`Error creating FAQ "${faq.question}":`, error)
    }
  }
  
  console.log('FAQ seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

