# 🚀 Deploy AfroGIF to Render

## Prerequisites
- GitHub account
- Render account (free)

## Step 1: Push Code to GitHub

1. **Create a new GitHub repository**:
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name it `afrogif` or `ai-afrogif`
   - Make it public
   - Don't initialize with README (we already have one)

2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/afrogif.git
   git push -u origin main
   ```

## Step 2: Deploy on Render

1. **Sign up for Render**:
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create a new Web Service**:
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Select the `afrogif` repository

3. **Configure the service**:
   - **Name**: `afrogif` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. **Environment Variables** (optional):
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will set this automatically)

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

## Step 3: Access Your App

- Your app will be available at: `https://your-app-name.onrender.com`
- Render provides automatic HTTPS
- The app will auto-deploy when you push changes to GitHub

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Make sure all dependencies are in `package.json`
- Verify the build command works locally

### App Won't Start
- Check the start command: `npm start`
- Verify `server.js` is the main file
- Check environment variables

### CORS Errors
- Update the CORS configuration with your actual Render URL
- Make sure the origin matches exactly

## Benefits of Hosting

✅ **No more local network issues**  
✅ **Better Reddit API access**  
✅ **HTTPS support**  
✅ **24/7 availability**  
✅ **Anyone can access your app**  
✅ **Automatic deployments**  

## Next Steps

After deployment:
1. Test all features (search, navigation, videos)
2. Share the URL with others
3. Monitor the Render dashboard for any issues
4. Push updates to GitHub for automatic deployment 