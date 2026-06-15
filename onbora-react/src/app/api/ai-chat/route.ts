import { NextRequest, NextResponse } from 'next/server';

// Agent personality definitions
const agentPrompts = {
  maya: {
    name: 'Maya',
    role: 'Welcome Guide',
    context:
      'You are Maya, a warm and welcoming onboarding specialist who knows this company inside and out. You help new employees feel comfortable and excited about their first day. You know the office layout, first-day procedures, company traditions, and cultural nuances.',
    focus: 'first-day experience, office orientation, company traditions, making people feel welcome',
  },
  alex: {
    name: 'Alex',
    role: 'HR Assistant',
    context:
      'You are Alex, a knowledgeable HR professional who is an expert on this company\'s specific policies, benefits, and procedures. You have deep knowledge of the employee handbook, benefits packages, and administrative processes.',
    focus: 'benefits, policies, procedures, HR questions, administrative tasks',
  },
  jordan: {
    name: 'Jordan',
    role: 'Culture Guide',
    context:
      'You are Jordan, a company culture expert who understands this company\'s unique values, traditions, unwritten rules, and social dynamics. You help new employees understand how to thrive in this specific culture.',
    focus: 'company values, culture, team dynamics, unwritten rules, success tips',
  },
  sam: {
    name: 'Sam',
    role: 'Tech Setup Specialist',
    context:
      'You are Sam, an IT and technology expert who knows this company\'s specific tech stack, tools, and setup procedures. You help with technical onboarding and system access.',
    focus: 'technical setup, software access, IT systems, troubleshooting',
  },
} as const;

type AgentId = keyof typeof agentPrompts;

function buildCompanyKnowledge(context: Record<string, unknown> | null): string {
  if (!context) return 'No company information available.';

  let knowledge = `Company: ${context.name || 'Unknown'}
Size: ${context.size || 'Unknown'}
Industry: ${context.industry || 'Unknown'}`;

  const insights = context.insights as Record<string, string> | undefined;
  if (insights && Object.keys(insights).length > 0) {
    knowledge += '\n\nDOCUMENT ANALYSIS INSIGHTS:';
    Object.entries(insights).forEach(([key, value]) => {
      if (value && !String(value).includes('Needs clarification')) {
        knowledge += `\n- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
      }
    });
  }

  const culture = context.culture as string[] | undefined;
  if (culture && culture.length > 0) {
    knowledge += '\n\nHR INTERVIEW INSIGHTS:';
    culture.forEach((answer, index) => {
      knowledge += `\n- Response ${index + 1}: ${answer}`;
    });
  }

  const documents = context.documents as string[] | undefined;
  if (documents && documents.length > 0) {
    knowledge += `\n\nAVAILABLE DOCUMENTS: ${documents.join(', ')}`;
  }

  const fullDocumentContent = context.fullDocumentContent as string | undefined;
  if (fullDocumentContent && fullDocumentContent !== 'No documents uploaded') {
    const truncated = fullDocumentContent.substring(0, 2000);
    knowledge += `\n\nKEY DOCUMENT CONTENT:\n${truncated}${fullDocumentContent.length > 2000 ? '...' : ''}`;
  }

  return knowledge;
}

function buildNewHireContext(newHireContext: Record<string, string> | null): string {
  if (!newHireContext) return '';
  return `

NEW HIRE CONTEXT (personalize your responses to this person):
- Role/Background: ${newHireContext.role || 'Not specified'}
- What they're excited about: ${newHireContext.excitement || 'Not specified'}
- What they're nervous about: ${newHireContext.concerns || 'Not specified'}
${newHireContext.name ? `- Name: ${newHireContext.name}` : ''}

Use this context to make your responses feel personally tailored to them. Reference their specific excitement or concerns when relevant.`;
}

function getStaticResponse(agentType: string): string {
  const responses: Record<string, string[]> = {
    maya: [
      "Welcome! I'm so excited to have you join our team. Your first day is going to be amazing!",
      "I'm here to make your onboarding smooth and enjoyable. What would you like to know about your first day?",
    ],
    alex: [
      "I'm here to help with all your HR questions. What do you need to know about benefits or policies?",
      "Let me guide you through the paperwork and procedures. What's your main concern?",
    ],
    jordan: [
      "Welcome to our company culture! I'm here to help you understand how we work together.",
      "Let me share some insights about our company values and traditions. What interests you most?",
    ],
    sam: [
      "I'm here to help with all your tech setup needs. What equipment or software do you need help with?",
      "Let me guide you through the technical setup process. What's your main question?",
    ],
  };
  const agentResponses = responses[agentType] || responses.maya;
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentType, companyContext, conversationHistory, newHireContext, isSmartMode } = body;

    if (!message) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'AI service not configured' }, { status: 500 });
    }

    const agent = agentPrompts[(agentType as AgentId)] || agentPrompts.maya;

    const companyKnowledge = buildCompanyKnowledge(companyContext);
    const newHireInfo = buildNewHireContext(newHireContext);

    let conversationContext = '';
    let hasHistory = false;
    if (conversationHistory && conversationHistory.length > 1) {
      hasHistory = true;
      const previousMessages = conversationHistory.slice(0, -1);
      conversationContext =
        '\n\nCONVERSATION HISTORY:\n' +
        previousMessages
          .map((msg: { role: string; message: string }) =>
            `${msg.role === 'user' ? 'User' : agent.name}: ${msg.message}`
          )
          .join('\n');
    }

    const systemPrompt = `
${agent.context}

COMPANY KNOWLEDGE BASE:
${companyKnowledge}
${newHireInfo}

YOUR EXPERTISE: ${agent.focus}

CONVERSATION GUIDELINES:
- Answer based on actual company information when available
- Be specific and reference company details
- Keep responses helpful but concise (2-4 sentences)
- If you don't have specific info, acknowledge it and suggest alternatives
- Maintain your warm, professional personality as ${agent.name}
- Focus on ${agent.focus} while being helpful with other topics
${hasHistory
  ? '- Continue the conversation naturally — NO greetings or re-introductions since we are already talking'
  : '- Start with a warm greeting since this is your first message to this user'}

HANDOFF PROTOCOL:
When a question falls outside your expertise, suggest the best agent:
${agentType !== 'maya' ? '- First-day questions, welcome → suggest Maya, Welcome Guide' : ''}
${agentType !== 'alex' ? '- Benefits, policies, HR → suggest Alex, HR Assistant' : ''}
${agentType !== 'jordan' ? '- Culture, values, team → suggest Jordan, Culture Guide' : ''}
${agentType !== 'sam' ? '- Tech setup, IT → suggest Sam, Tech Specialist' : ''}

SUGGESTED FOLLOW-UPS:
After your response, add exactly 2 suggested follow-up questions on a new line starting with "SUGGESTIONS:" followed by two questions separated by "|".
Example: SUGGESTIONS: What does a typical first week look like?|Are there any team events coming up?

Respond as ${agent.name}, the ${agent.role} for ${(companyContext as Record<string, unknown>)?.name || 'this company'}.
`;

    const geminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + conversationContext + '\n\nUser message: ' + message }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: isSmartMode ? 400 : 256,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      if (response.status === 429) {
        return NextResponse.json(
          { message: 'AI service is busy. Please try again in a moment.', code: 'RATE_LIMIT' },
          { status: 429 }
        );
      }
      return NextResponse.json({
        response: getStaticResponse(agentType),
        isFallback: true,
        agent: agent.name,
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      return NextResponse.json({
        response: getStaticResponse(agentType),
        isFallback: true,
        agent: agent.name,
      });
    }

    return NextResponse.json({
      response: aiResponse,
      isFallback: false,
      agent: agent.name,
      usage: data.usageMetadata,
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({
      response: getStaticResponse('maya'),
      isFallback: true,
      agent: 'AI Assistant',
    });
  }
}
