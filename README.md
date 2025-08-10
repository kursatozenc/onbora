# Onbora - AI-Powered Employee Onboarding

Onbora helps companies create personalized onboarding experiences that make every new employee feel welcomed, informed, and ready to contribute.

## ✨ Features

### 🎯 **Smart Company Setup**
- **Company Profile**: Capture company name, size, and industry
- **Document Upload**: Upload employee handbooks and policies
- **AI Interview**: 10-minute conversation to understand your company culture

### 🤖 **AI Onboarding Agents**
- **Maya** - Welcome Guide for first-day orientation
- **Alex** - HR Assistant for policies and benefits
- **Jordan** - Culture Guide for company values and traditions
- **Sam** - Tech Setup Specialist for equipment and software

### 👀 **Preview & Test**
- **Experience Preview**: Test your AI agents before inviting employees
- **Full Demo**: Experience the complete onboarding flow
- **Real-time AI**: Powered by Google Gemini for intelligent responses

### 📧 **Employee Invitation**
- **Email Templates**: Pre-written welcome emails
- **Direct Sending**: Send emails directly from the app
- **Copy & Paste**: Easy email content copying

## 🚀 Getting Started

### 1. **Setup Your Company**
- Enter company information
- Upload relevant documents
- Complete the AI culture interview

### 2. **Preview the Experience**
- Test your AI agents
- Review company profile
- Customize if needed

### 3. **Invite New Employees**
- Send personalized welcome emails
- Share onboarding access
- Monitor progress

## 🛠️ Technical Details

### **Frontend**
- React-based single-page application
- Tailwind CSS for styling
- Responsive design for all devices

### **Backend**
- Vercel serverless functions
- Google Gemini AI integration
- Secure API key management

### **AI Integration**
- Real-time conversation with AI agents
- Company culture personalization
- Fallback responses when AI is unavailable

## 🔧 Setup

### **Prerequisites**
- Node.js 18+ 
- Vercel account
- Google Gemini API key

### **Installation**
```bash
# Clone the repository
git clone <your-repo-url>
cd Onbora

# Install dependencies
npm install

# Set environment variables
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# Run locally
npm run dev

# Deploy to Vercel
npm run deploy
```

### **Environment Variables**
- `GEMINI_API_KEY`: Your Google Gemini API key

## 📱 Usage Flow

1. **Landing Page** → Learn about Onbora
2. **Setup** → Configure your company (3 steps)
3. **Preview** → Test your AI agents
4. **Employee Experience** → Full onboarding demo
5. **Invite** → Send welcome emails to new hires

## 🔒 Security

- API keys stored in environment variables
- Secure API routes for AI communication
- No sensitive data exposed in frontend

## 🚀 Deployment

The app is configured for Vercel deployment with:
- Static hosting for the main app
- Serverless functions for AI endpoints
- Automatic API routing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for better employee experiences** 