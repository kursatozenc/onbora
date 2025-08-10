# Onbora Deployment Guide

## 🚀 Quick Deploy to Vercel

### 1. **Prepare Your Repository**
```bash
# Make sure all files are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. **Deploy to Vercel**
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

### 3. **Set Environment Variables**
1. Go to your Vercel dashboard
2. Select your Onbora project
3. Go to Settings → Environment Variables
4. Add: `GEMINI_API_KEY` = `your_actual_api_key`

## 🔧 Manual Setup

### **Prerequisites**
- Vercel account
- Google Gemini API key
- Git repository

### **Step-by-Step**

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**
   - Framework Preset: Other
   - Build Command: Leave empty
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Set Environment Variables**
   - `GEMINI_API_KEY`: Your Gemini API key

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

## 🌐 Custom Domain (Optional)

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 📊 Post-Deployment

### **Test Your App**
1. Visit your deployed URL
2. Complete the setup flow
3. Test AI agents
4. Verify email functionality

### **Monitor Performance**
- Check Vercel analytics
- Monitor API usage
- Watch for errors in logs

## 🔍 Troubleshooting

### **Common Issues**

**AI Agents Not Responding**
- Check if `GEMINI_API_KEY` is set
- Verify API key is valid
- Check browser console for errors

**Build Failures**
- Ensure all files are committed
- Check package.json dependencies
- Verify vercel.json configuration

**API Routes Not Working**
- Check vercel.json rewrites
- Ensure API files are in `/api` folder
- Verify function exports

## 📈 Scaling Considerations

- **API Limits**: Monitor Gemini API usage
- **Performance**: Vercel automatically scales
- **Costs**: Pay-per-use pricing model

## 🔒 Security Best Practices

- Never commit API keys
- Use environment variables
- Enable Vercel security headers
- Regular dependency updates

---

**Need help?** Check the Vercel documentation or create an issue in your repository. 