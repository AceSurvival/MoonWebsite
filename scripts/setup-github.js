#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 GitHub Repository Setup\n');
console.log('Please provide your GitHub repository URL.');
console.log('Examples:');
console.log('  - HTTPS: https://github.com/username/repo-name.git');
console.log('  - SSH: git@github.com:username/repo-name.git\n');

rl.question('GitHub repository URL: ', (repoUrl) => {
  if (!repoUrl.trim()) {
    console.error('❌ Repository URL is required');
    process.exit(1);
  }

  try {
    console.log('\n🔄 Setting up remote...');
    
    // Check if remote already exists
    try {
      execSync('git remote get-url origin', { stdio: 'ignore' });
      console.log('⚠️  Remote "origin" already exists. Updating...');
      execSync(`git remote set-url origin ${repoUrl}`, { stdio: 'inherit' });
    } catch {
      execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
    }

    // Rename branch to main if it's master
    try {
      execSync('git branch -M main', { stdio: 'inherit' });
    } catch {
      // Branch might already be main
    }

    console.log('\n✅ Remote configured successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure you have push access to the repository');
    console.log('2. Run: npm run git:push');
    console.log('   Or: git push -u origin main');
    console.log('\n💡 After setup, I can automatically push changes using: npm run git:push');
    
  } catch (error) {
    console.error('❌ Error setting up remote:', error.message);
    process.exit(1);
  }

  rl.close();
});






