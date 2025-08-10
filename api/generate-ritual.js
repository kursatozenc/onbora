export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { intent, trigger, audience, time, vibe } = req.body;

    if (!intent || !trigger || !audience || !time || !vibe) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ message: 'Internal Server Error: AI configuration missing.' });
    }

    const systemPrompt = `
      You are an expert in designing short, impactful team rituals for the workplace. 
      Your goal is to generate a ritual based on user-provided constraints.
      The output MUST be a valid JSON object. Do not include any text or markdown formatting before or after the JSON object.
      The JSON object should have the following structure:
      {
        "title": "A creative and concise title for the ritual.",
        "category": "The 'vibe' provided by the user.",
        "time_estimate": "The time constraint provided by the user.",
        "participant_count": "The audience size provided by the user.",
        "description": "A short, one-sentence summary of the ritual's purpose and what it entails.",
        "content": "A detailed, step-by-step guide on how to perform the ritual. Use markdown for formatting, like using bullet points or numbered lists. Be clear and actionable. Explain the 'why' behind the steps."
      }
    `;

    const userPrompt = `
      Generate a team ritual with the following properties:
      - Intent (The Goal): ${intent}
      - Trigger (The Moment): ${trigger}
      - Audience (The Who): ${audience}
      - Time (The How Long): ${time}
      - Tone / Vibe (The Feeling): ${vibe}
    `;

    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt + "\n\n" + userPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      
      if (response.status === 429) {
        return res.status(429).json({ 
          message: 'AI service is busy. Please try again in a moment.',
          code: 'RATE_LIMIT'
        });
      }
      
      return res.status(500).json({ message: 'Error generating ritual' });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("AI returned an empty response.");
    }
    
    // Parse the JSON response from AI
    let generatedRitual;
    try {
      generatedRitual = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to static response if AI response is invalid
      generatedRitual = {
        title: "Team Connection Ritual",
        category: vibe,
        time_estimate: time,
        participant_count: audience,
        description: "A team ritual to foster connection and collaboration.",
        content: "1. Gather the team in a circle\n2. Share one thing you're grateful for\n3. Discuss how to support each other this week"
      };
    }
    
    // Add the other fields that our app expects
    const finalRitual = {
      ...generatedRitual,
      is_starter_pack: false,
      image_url: 'https://images.unsplash.com/photo-1529119232895-694a4a5894b8?q=80&w=2940&auto=format&fit=crop'
    };

    return res.status(200).json(finalRitual);

  } catch (error) {
    console.error('Error generating ritual:', error);
    return res.status(500).json({ message: 'Error generating ritual' });
  }
} 