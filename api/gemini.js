export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { prompt, systemPrompt } = req.body;

    // Validate input
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required' 
      });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ 
        error: 'AI service not configured' 
      });
    }

    // Prepare the request to Gemini with proper format
    const geminiRequest = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    // Call Gemini API with correct endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest)
      }
    );
    
    console.log('🔍 Gemini API request sent');
    console.log('🔍 Request body:', JSON.stringify(geminiRequest, null, 2));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      
      // Handle specific error cases
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'AI service is busy. Please try again in a moment.',
          code: 'RATE_LIMIT'
        });
      }
      
      if (response.status === 400) {
        return res.status(400).json({ 
          error: 'Invalid request to AI service',
          code: 'INVALID_REQUEST'
        });
      }
      
      return res.status(500).json({ 
        error: 'AI service temporarily unavailable',
        code: 'SERVICE_ERROR'
      });
    }

    const data = await response.json();
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      return res.status(500).json({ 
        error: 'AI response format error',
        code: 'RESPONSE_ERROR'
      });
    }

    // Return the AI response
    res.status(200).json({
      response: responseText,
      usage: data.usageMetadata,
      model: 'gemini-1.5-flash'
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Return user-friendly error message
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again.',
      code: 'INTERNAL_ERROR'
    });
  }
} 