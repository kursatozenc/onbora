# Onbora Environment Setup

## Required Environment Variables

### Gemini API Key
To enable AI-powered onboarding agents, you need to set up a Gemini API key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Set the environment variable in your `.env.local` file (see below)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in a `.env.local` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   **Important**: Replace `your_actual_api_key_here` with your actual Gemini API key. Never commit this file to version control.

3. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

The app is configured for Vercel deployment with:
- Static hosting for the main app
- Serverless functions for AI API endpoints
- Proper routing configuration

## Features

- **AI Interviewer**: Captures company culture through conversation
- **AI Onboarding Agents**: Personalized support for new employees
- **Preview Mode**: Test the experience before inviting employees
- **Email Integration**: Send personalized welcome emails
- **Progress Tracking**: Checklists for onboarding milestones 