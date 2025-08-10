# Environment Variables Setup

## Required for Vercel Deployment

### 1. GEMINI_API_KEY
- **Purpose**: Your Google Gemini API key for AI functionality
- **How to get**: 
  1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create a new API key
  3. Copy the key (starts with "AIza...")

### 2. Vercel Configuration
1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add a new variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your actual API key
   - **Environment**: Production (and Preview if you want)

## Local Development

Create a `.env.local` file in your project root:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

## Security Notes

✅ **DO**: Store API keys in Vercel environment variables
✅ **DO**: Use the secure API routes we created
❌ **DON'T**: Commit API keys to your repository
❌ **DON'T**: Expose API keys in frontend code

## API Routes Created

- `/api/gemini` - General Gemini API calls
- `/api/generate-ritual` - Team ritual generation
- `/api/ai-chat` - AI agent conversations

All routes now securely use your environment variables instead of exposing them in the frontend. 