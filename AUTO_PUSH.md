# Auto-Push Configuration

## ✅ Automatic Git Push Enabled

**All code changes are automatically pushed to GitHub main branch after completion.**

When you make changes to the codebase, I will:
1. ✅ Stage all changes (`git add .`)
2. ✅ Commit with a descriptive message
3. ✅ Push to GitHub main branch (`git push origin main`)

**Important:** All pushes go to the `main` branch, regardless of the current branch. If you're on a different branch, the script will automatically switch to `main` before pushing.

This ensures your code is always backed up and deployed automatically if you have Vercel/Netlify connected to your GitHub repository.

## Manual Push

If you need to manually push changes, you can use:

```bash
npm run deploy
```

Or with a custom message:

```bash
npm run deploy "Your commit message here"
```

## Deployment

Once pushed to GitHub:
- **Vercel**: Automatically deploys if connected
- **Netlify**: Automatically deploys if connected  
- **GitHub Actions**: Runs deployment workflow if configured

Check `DEPLOYMENT.md` for detailed deployment setup instructions.
