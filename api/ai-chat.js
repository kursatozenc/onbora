export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, agentType, companyContext, isSmartMode } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ message: 'AI service not configured' });
    }

    // Define agent personalities and contexts
    const agentPrompts = {
      maya: {
        name: "Maya",
        role: "Welcome Guide",
        context: "You are Maya, a warm and welcoming onboarding specialist. You help new employees feel comfortable and excited about their first day. Be encouraging, informative, and make them feel like they belong."
      },
      alex: {
        name: "Alex",
        role: "HR Assistant", 
        context: "You are Alex, a knowledgeable HR professional. You help with benefits, policies, paperwork, and company procedures. Be clear, professional, and helpful with administrative questions."
      },
      jordan: {
        name: "Jordan",
        role: "Culture Guide",
        context: "You are Jordan, a company culture expert. You help new employees understand company values, traditions, unwritten rules, and how to fit in. Be friendly, insightful, and share cultural context."
      },
      sam: {
        name: "Sam",
        role: "Tech Setup Specialist",
        context: "You are Sam, an IT and technology expert. You help with computer setup, software access, tools, and technical questions. Be patient, clear, and step-by-step in your explanations."
      }
    };

    const agent = agentPrompts[agentType] || agentPrompts.maya;
    
    const systemPrompt = `
      ${agent.context}
      
      Company Context: ${companyContext || 'A welcoming company focused on employee success'}
      
      Guidelines:
      - Keep responses concise but helpful (2-4 sentences)
      - Be warm and encouraging
      - Provide actionable advice when possible
      - If you don't know something, suggest who to ask
      - Always maintain your agent personality
      
      Respond as ${agent.name}, the ${agent.role}.
    `;

    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt + "\n\nUser message: " + message
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
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
      
      // Fallback to static responses if AI is unavailable
      return res.status(200).json({
        response: getStaticResponse(agentType, message),
        isFallback: true,
        agent: agent.name
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      // Fallback to static response
      return res.status(200).json({
        response: getStaticResponse(agentType, message),
        isFallback: true,
        agent: agent.name
      });
    }

    return res.status(200).json({
      response: aiResponse,
      isFallback: false,
      agent: agent.name,
      usage: data.usageMetadata
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    
    // Fallback to static response
    return res.status(200).json({
      response: getStaticResponse(req.body.agentType || 'maya', req.body.message || ''),
      isFallback: true,
      agent: 'AI Assistant'
    });
  }
}

// Fallback static responses when AI is unavailable
function getStaticResponse(agentType, message) {
  const responses = {
    maya: [
      "Welcome! I'm so excited to have you join our team. Your first day is going to be amazing!",
      "I'm here to make your onboarding smooth and enjoyable. What would you like to know about your first day?",
      "Let's get you settled in! I'll guide you through everything step by step."
    ],
    alex: [
      "I'm here to help with all your HR questions. What do you need to know about benefits or policies?",
      "Let me guide you through the paperwork and procedures. What's your main concern?",
      "I can help with benefits, policies, and company procedures. What would you like to know?"
    ],
    jordan: [
      "Welcome to our company culture! I'm here to help you understand how we work together.",
      "Let me share some insights about our company values and traditions. What interests you most?",
      "I'll help you understand our culture and how to thrive here. What would you like to know?"
    ],
    sam: [
      "I'm here to help with all your tech setup needs. What equipment or software do you need help with?",
      "Let me guide you through the technical setup process. What's your main question?",
      "I can help with computer setup, software access, and technical questions. What do you need?"
    ]
  };
  
  const agentResponses = responses[agentType] || responses.maya;
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
} 