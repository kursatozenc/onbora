import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('Make sure your .env.local file contains: GEMINI_API_KEY=your_key_here');
    return;
  }
  
  console.log('🔑 API Key loaded successfully');
  console.log('🧪 Testing Gemini API...\n');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: "Hello! Please respond with just 'API key is working!' if you can read this message."
            }]
          }]
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('✅ API Key Test Successful!');
      console.log(`📝 Response: ${text}`);
      console.log(`🔧 Model: ${data.model || 'gemini-1.5-flash'}`);
      
      if (data.usageMetadata) {
        console.log(`📊 Usage: ${JSON.stringify(data.usageMetadata, null, 2)}`);
      }
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your API key is correct');
      console.log('2. Verify the API key has proper permissions');
      console.log('3. Check if you have billing enabled on Google AI Studio');
    }
  }
}

// Run the test
testGeminiAPI();
