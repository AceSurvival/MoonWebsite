# GitHub Setup Guide

## Quick Setup

### Option 1: Automatic Setup Script
```bash
node scripts/setup-github.js
```
Follow the prompts to enter your GitHub repository URL.

### Option 2: Manual Setup

1. **Create a GitHub repository** (if you haven't already):
   - Go to https://github.com/new
   - Create a new repository (don't initialize with README)
   - Copy the repository URL

2. **Add the remote**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   ```

3. **Push for the first time**:
   ```bash
   git push -u origin main
   ```

## Automatic Pushing

After setup, I can automatically push changes to GitHub using:

```bash
npm run git:push
```

Or with a custom commit message:
```bash
npm run git:push "Your commit message here"
```

## How It Works

- The `git-push.js` script automatically:
  1. Stages all changes (`git add .`)
  2. Commits with a message
  3. Pushes to GitHub (`git push origin main`)

- I'll run this script after making changes to your codebase

## Authentication

Make sure you have:
- **HTTPS**: GitHub Personal Access Token configured
- **SSH**: SSH keys set up with GitHub

For HTTPS, you may need to configure credentials:
```bash
git config --global credential.helper store
```

Then on first push, enter your GitHub username and Personal Access Token (not password).






