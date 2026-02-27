/**
 * Script to set up the database schema
 * Run this after setting DATABASE_URL to your PostgreSQL connection string
 * 
 * Usage:
 * 1. Set DATABASE_URL in your .env file or environment
 * 2. Run: node scripts/setup-database.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up database schema...\n');

try {
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push schema to database (creates tables)
  console.log('\n🗄️  Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('\n✅ Database setup complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Create an admin user: node scripts/init-admin.js');
  console.log('   2. Your database is ready to use!');
} catch (error) {
  console.error('\n❌ Error setting up database:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   - DATABASE_URL is set correctly in your environment');
  console.log('   - Your PostgreSQL database is accessible');
  console.log('   - You have the necessary permissions');
  process.exit(1);
}

