# Deployment Guide

This guide explains how to deploy the Math Chapter Tracker to Render (backend) and GitHub Pages (frontend).

## Prerequisites

- GitHub account (https://github.com)
- Render account (https://render.com) - free tier available
- Git installed locally
- MongoDB Atlas account (or local MongoDB instance)

## Quick Start

Run the interactive deployment script:

```bash
npm run deploy:render
```

This script will:
1. Check your environment setup
2. Help initialize/push your Git repository
3. Create a `render.yaml` configuration file
4. Provide step-by-step deployment instructions

## Manual Deployment Steps

### Step 1: Push Your Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Math Chapter Tracker with MongoDB & Express"
git remote add origin https://github.com/YOUR_USERNAME/quant-practice.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend to Render

1. **Create Render Account**
   - Go to https://render.com and sign up

2. **Create a Web Service**
   - Dashboard → New → Web Service
   - Connect your GitHub repository (quant-practice)

3. **Configure Deployment Settings**
   - **Name:** `quant-practice-api`
   - **Environment:** Node
   - **Region:** Oregon (or your preference)
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server:start`

4. **Add Environment Variables**
   - Click "Advanced" and add:
   - `MONGODB_URI` = your MongoDB connection string
   - `PORT` = 3001
   - `NODE_ENV` = production

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Copy your Render URL: `https://quant-practice-api.onrender.com`

### Step 3: Deploy Frontend to GitHub Pages

1. **Get Your Backend URL**
   - Copy the Render deployment URL from Step 2
   - Format: `https://your-app.onrender.com`

2. **Set GitHub Action Secret**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - New secret:
     - **Name:** `VITE_API_BASE`
     - **Value:** `https://your-render-app.onrender.com`

3. **Update .env** (local testing)
   ```bash
   VITE_API_BASE=https://your-render-app.onrender.com
   MONGODB_URI=your-mongodb-uri
   PORT=3001
   ```

4. **Enable GitHub Pages**
   - Go to Repository → Settings → Pages
   - **Source:** Deploy from a branch
   - **Branch:** gh-pages
   - Workflow will create this branch automatically

5. **Push to Deploy**
   ```bash
   git push origin main
   ```
   - GitHub Actions will automatically build and deploy
   - Your site will be live at `https://your-username.github.io/quant-practice`

## Configuration Files Explained

### `render.yaml`
Render's infrastructure-as-code configuration. Specifies:
- Service name and type
- Build & start commands
- Environment variables

### `.github/workflows/deploy.yml`
GitHub Actions workflow that:
- Builds the frontend when you push to main
- Deploys to GitHub Pages
- Uses `VITE_API_BASE` secret for API URL configuration

### `.env` / `.env.example`
Environment variables for local development and deployment.

## MongoDB Setup

### Using MongoDB Atlas (Cloud)

1. Create account at https://mongodb.com/cloud
2. Create a free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/quant-practice`
4. Add Render IP to whitelist (IP Address List in Security)

### Using Local MongoDB

1. Install MongoDB (https://docs.mongodb.com/manual/installation/)
2. Use connection string: `mongodb://localhost:27017/quant-practice`

## Troubleshooting

### Backend won't start on Render
- Check logs in Render dashboard (Logs tab)
- Verify MongoDB URI is correct
- Ensure MongoDB is running/accessible
- Check that IP whitelist includes Render (use 0.0.0.0/0 for testing)

### Frontend shows blank page
- Check browser console for API errors
- Verify `VITE_API_BASE` environment variable is set
- Ensure backend URL is reachable
- Clear browser cache

### API calls fail on GitHub Pages
- Verify `VITE_API_BASE` is set in GitHub Actions secrets
- Check backend is running on Render
- Verify CORS is enabled (it is by default in server.js)

### MongoDB connection timeout
- Check MongoDB URI is correct
- Verify IP is whitelisted in MongoDB Atlas
- Test connection with MongoDB Compass locally

## After Deployment

Your application will be running at:
- **Frontend:** https://your-username.github.io/quant-practice
- **Backend API:** https://your-render-app.onrender.com

Test it:
```bash
# Frontend should load
curl https://your-username.github.io/quant-practice

# Backend health check
curl https://your-render-app.onrender.com/health
# Should return: {"status":"ok"}

# API test
curl https://your-render-app.onrender.com/api/chapters
```

## Updating Your Application

After deployment, any push to the `main` branch will:
1. Trigger GitHub Actions to rebuild and deploy frontend
2. Trigger Render to rebuild and deploy backend (if code changed)

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# Check deployment status
# Frontend: GitHub repo → Actions tab
# Backend: Render dashboard → Logs tab
```

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `PORT` | No | `3001` |
| `NODE_ENV` | No | `production` |
| `VITE_API_BASE` | Yes (Frontend) | `https://app.onrender.com` |

## Support & Resources

- **Render Docs:** https://render.com/docs
- **GitHub Pages:** https://pages.github.com
- **MongoDB Docs:** https://docs.mongodb.com
- **Express Docs:** https://expressjs.com
- **Vue 3 Docs:** https://vuejs.org

## Next Steps

1. ✅ Run `npm run deploy:render`
2. ✅ Push to GitHub
3. ✅ Deploy backend to Render
4. ✅ Deploy frontend to GitHub Pages
5. ✅ Test your app
6. 🎉 Share with others!
