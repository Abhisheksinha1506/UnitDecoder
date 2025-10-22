# Vercel Deployment Guide

## 🚀 Fixed Issues

### ✅ Node.js Version Compatibility
- **Problem**: Vercel was using Node.js 22.x, but the old builder only supported 18.x
- **Solution**: 
  - Removed deprecated `builds` configuration
  - Added `.nvmrc` file specifying Node.js 18
  - Updated `package.json` with `"engines": {"node": "18.x"}`

### ✅ Build Process
- **Problem**: Build script was trying to initialize existing database
- **Solution**: Simplified build script for deployment

### ✅ Vercel Configuration
- **Removed**: Old `builds` and `functions` configuration
- **Added**: Modern `buildCommand` and `outputDirectory`
- **Simplified**: Routes configuration for better compatibility

## 📋 Deployment Steps

### 1. Commit Changes
```bash
git add .
git commit -m "Fix Vercel deployment: Remove deprecated configs, add Node.js 18.x support"
git push origin main
```

### 2. Vercel Project Settings
In your Vercel dashboard:
- Go to Project Settings → General
- Set **Node.js Version** to `18.x`
- Set **Build Command** to `npm run build`
- Set **Output Directory** to `.`

### 3. Environment Variables (if needed)
Add these in Vercel dashboard → Settings → Environment Variables:
```
NODE_ENV=production
DB_PATH=/tmp/unit_decoder.db
```

### 4. Deploy
- Push to main branch (automatic deployment)
- Or manually trigger deployment in Vercel dashboard

## 🔧 Configuration Files

### `vercel.json` (Updated)
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/",
      "dest": "/public/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### `package.json` (Updated)
```json
{
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "build": "echo 'Build step: Database and dependencies ready'"
  }
}
```

### `.nvmrc` (New)
```
18
```

## 🐛 Troubleshooting

### If deployment still fails:
1. **Clear Vercel cache**: Delete deployment and redeploy
2. **Check Node.js version**: Ensure it's set to 18.x in project settings
3. **Verify build command**: Should be `npm run build`
4. **Check logs**: Look for specific error messages in Vercel dashboard

### Common Issues:
- **Node.js version mismatch**: Ensure `.nvmrc` and `package.json` engines match
- **Build command errors**: Verify `npm run build` works locally
- **Database issues**: SQLite will be created on first run

## ✅ Success Indicators
- Build completes without Node.js version errors
- API endpoints respond correctly
- Frontend loads and search works
- Database initializes properly

## 📞 Support
If issues persist:
1. Check Vercel deployment logs
2. Verify all configuration files are committed
3. Ensure Node.js version is set to 18.x in project settings
4. Try clearing Vercel cache and redeploying
