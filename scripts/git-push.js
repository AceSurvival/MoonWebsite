#!/usr/bin/env node

/**
 * Git push script - pushes changes to GitHub
 * This will trigger automatic deployment if Vercel/Netlify is connected
 * 
 * Usage:
 *   npm run git:push
 *   npm run git:push "Your commit message"
 */

const { execSync } = require('child_process');

// Get commit message from command line argument or use default
const commitMessage = process.argv[2] || `Update website - ${new Date().toLocaleString()}`;

try {
  console.log('🚀 Publishing site...\n');
  
  // Check if git is initialized
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Error: Git repository not initialized.');
    console.log('💡 Run: git init');
    process.exit(1);
  }
  
  // Check if remote is configured
  try {
    execSync('git remote get-url origin', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Error: Git remote "origin" not configured.');
    console.log('💡 Run: git remote add origin <your-repo-url>');
    process.exit(1);
  }
  
  console.log('📦 Staging all changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  // Check if there are changes to commit
  try {
    execSync('git diff --cached --quiet', { stdio: 'ignore' });
    console.log('⚠️  No changes to commit.');
    console.log('💡 Skipping commit, but checking if push is needed...');
  } catch (error) {
    // There are changes, proceed with commit
    console.log('💾 Committing changes...');
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  }
  
  console.log('🚀 Pushing to GitHub...');
  console.log('📡 This will trigger automatic deployment if configured.\n');
  
  // Always push to main branch
  const branch = 'main';
  
  // Check if we're on a different branch and switch to main first
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  if (currentBranch !== 'main') {
    console.log(`⚠️  Currently on branch: ${currentBranch}`);
    console.log(`🔄 Switching to main branch...`);
    execSync('git checkout main', { stdio: 'inherit' });
  }
  
  execSync(`git push origin ${branch}`, { stdio: 'inherit' });
  
  console.log('\n✅ Successfully pushed to GitHub!');
  console.log('🔄 If Vercel/GitHub Actions is configured, deployment should start automatically.');
  console.log(`📝 Commit message: "${commitMessage}"`);
  console.log(`🌿 Branch: ${branch}`);
  
} catch (error) {
  console.error('\n❌ Push failed:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   - Make sure you have git configured');
  console.log('   - Check that you have push access to the repository');
  console.log('   - Verify your GitHub credentials are set up');
  process.exit(1);
}






