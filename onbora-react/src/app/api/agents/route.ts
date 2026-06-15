import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Agent definitions ────────────────────────────────────────────────────────

const SPECIALISTS = {
  maya: {
    name: 'Maya',
    role: 'Welcome Guide',
    persona:
      'You are Maya, a warm and enthusiastic Welcome Guide who helps new employees feel excited and comfortable. You know every detail about first-day procedures, office logistics, company traditions, and how to make people feel at home.',
    focus: 'first-day experience, office orientation, introductions, getting settled, company traditions',
  },
  alex: {
    name: 'Alex',
    role: 'HR Assistant',
    persona:
      'You are Alex, a knowledgeable HR professional with deep expertise in this company\'s policies, benefits, compensation, and administrative procedures. You give accurate, helpful guidance on HR topics.',
    focus: 'benefits enrollment, PTO policies, payroll, employee handbook, HR paperwork, administrative tasks',
  },
  jordan: {
    name: 'Jordan',
    role: 'Culture Guide',
    persona:
      'You are Jordan, an insider who truly understands this company\'s culture, values, and social dynamics. You share the unwritten rules, how decisions really get made, and how to build relationships and thrive here.',
    focus: 'company values, team dynamics, unwritten norms, how to succeed here, culture, relationships',
  },
  sam: {
    name: 'Sam',
    role: 'Tech Specialist',
    persona:
      'You are Sam, an IT and tech expert who knows this company\'s full tech stack, tools, and system access procedures. You guide people through every setup step and troubleshoot technical issues.',
    focus: 'laptop setup, software installation, system access, credentials, IT tools, tech troubleshooting',
  },
  buddy: {
    name: 'Buddy',
    role: 'Peer Connector',
    persona:
      'You are Buddy, a friendly peer connector who helps new employees build social connections and integrate into the team. You share tips for meeting colleagues, navigating team dynamics, finding lunch spots, joining social groups, and feeling like you belong.',
    focus: 'meeting colleagues, team social life, lunch spots, social integration, making friends, team events, belonging',
  },
  coach: {
    name: 'Coach',
    role: 'Role Coach',
    persona:
      'You are Coach, a role-specific performance coach who helps new employees succeed in their specific job. You give personalized advice about ramp-up priorities, how to show early impact, what success looks like in the first 30/60/90 days, and how to navigate their specific role.',
    focus: '30-60-90 day plan, role-specific success, early wins, priorities, performance expectations, career growth',
  },
} as const;

type SpecialistId = keyof typeof SPECIALISTS;

// ─── Routing tool for the orchestrator ───────────────────────────────────────

const routingTool: Anthropic.Tool = {
  name: 'route_to_specialist',
  description:
    'Route the user\'s question to the most appropriate specialist agent. Choose the best specialist based on what the user is asking about.',
  input_schema: {
    type: 'object' as const,
    properties: {
      specialist: {
        type: 'string',
        enum: ['maya', 'alex', 'jordan', 'sam', 'buddy', 'coach'],
        description: 'The specialist agent best suited to answer this question',
      },
      reason: {
        type: 'string',
        description: 'Brief reason why this specialist is the best choice',
      },
    },
    required: ['specialist', 'reason'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

  const fullDocumentContent = context.fullDocumentContent as string | undefined;
  if (fullDocumentContent && fullDocumentContent !== 'No documents uploaded') {
    const truncated = fullDocumentContent.substring(0, 2000);
    knowledge += `\n\nKEY DOCUMENT CONTENT:\n${truncated}${fullDocumentContent.length > 2000 ? '...' : ''}`;
  }

  return knowledge;
}

function buildNewHireContext(ctx: Record<string, string> | null): string {
  if (!ctx) return '';
  return `
NEW HIRE CONTEXT:
- Name: ${ctx.name || 'Not provided'}
- Role/Background: ${ctx.role || 'Not specified'}
- Excited about: ${ctx.excitement || 'Not specified'}
- Nervous about: ${ctx.concerns || 'Not specified'}

Personalize your response to this person specifically.`;
}

// ─── Orchestrator: decide which specialist should respond ─────────────────────

async function routeToSpecialist(
  client: Anthropic,
  message: string,
  requestedAgent: SpecialistId,
  conversationSummary: string,
): Promise<SpecialistId> {
  const orchestratorSystem = `You are the Onboarding Manager for an employee onboarding platform.
Your job is to route user questions to the best specialist agent.

Available specialists:
- maya: Welcome Guide — first day, orientation, office, getting settled
- alex: HR Assistant — benefits, policies, payroll, paperwork, HR procedures
- jordan: Culture Guide — company values, unwritten rules, team dynamics, how to thrive
- sam: Tech Specialist — laptop setup, software, system access, IT tools
- buddy: Peer Connector — meeting colleagues, social integration, team events, making friends
- coach: Role Coach — 30/60/90 day plan, role-specific success, early wins, priorities

The user is currently talking to "${SPECIALISTS[requestedAgent].name}" (${requestedAgent}).
Route to the most appropriate specialist — this may be the same agent or a different one.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: orchestratorSystem,
      tools: [routingTool],
      tool_choice: { type: 'tool', name: 'route_to_specialist' },
      messages: [
        {
          role: 'user',
          content: `${conversationSummary ? `Recent context: ${conversationSummary}\n\n` : ''}New question: ${message}`,
        },
      ],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    if (toolUse?.input && typeof toolUse.input === 'object') {
      const input = toolUse.input as { specialist: string };
      if (input.specialist in SPECIALISTS) {
        return input.specialist as SpecialistId;
      }
    }
  } catch (err) {
    console.error('Routing error:', err);
  }

  return requestedAgent;
}

// ─── Specialist: generate the actual response ─────────────────────────────────

async function getSpecialistResponse(
  client: Anthropic,
  specialist: SpecialistId,
  message: string,
  companyKnowledge: string,
  newHireInfo: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  isFirstMessage: boolean,
  wasRouted: boolean,
  fromAgent: SpecialistId,
): Promise<string> {
  const s = SPECIALISTS[specialist];

  const systemPrompt = `${s.persona}

COMPANY KNOWLEDGE BASE:
${companyKnowledge}
${newHireInfo}

YOUR EXPERTISE: ${s.focus}

RESPONSE GUIDELINES:
- Be specific and reference actual company details when available
- Keep responses helpful and concise (2-4 sentences for simple questions, more for complex ones)
- Maintain a warm, professional tone as ${s.name}
${isFirstMessage ? `- Start with a brief warm greeting as ${s.name}` : '- Continue naturally — NO re-greetings'}
${wasRouted ? `- The user was talking to ${SPECIALISTS[fromAgent].name} but this question is better handled by you. Briefly acknowledge the handoff naturally, e.g. "I can take that one!"` : ''}

SUGGESTED FOLLOW-UPS:
After your response, on a new line add exactly 2 follow-up questions formatted as:
SUGGESTIONS: <question 1>|<question 2>

These should be naturally relevant to what you just answered.`;

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return textBlock?.text || `Hi! I'm ${s.name}. How can I help you today?`;
}

// ─── Mock mode ───────────────────────────────────────────────────────────────

const MOCK_RESPONSES: Record<SpecialistId, string[]> = {
  maya: [
    "Welcome! Your first day starts at 9am — head to reception and ask for your onboarding buddy. You'll get a full office tour after the all-hands intro.\n\nSUGGESTIONS: What should I bring on my first day?|How do I find the cafeteria?",
    "Great question! The office badge takes 24hrs to activate, so tomorrow you'll have full access. In the meantime, anyone can swipe you in.\n\nSUGGESTIONS: Where do I park?|What's the dress code?",
    "Your first week is mostly meetings and setup. Day 1 you'll meet your manager, Day 2 is team intro, and Day 3 onwards is hands-on ramp-up. It goes fast!\n\nSUGGESTIONS: Who will be my onboarding buddy?|What should I prioritize learning first?",
  ],
  alex: [
    "Benefits enrollment opens on Day 1 via the HR portal — you have 30 days to complete it. Health, dental, and vision kick in on the 1st of the following month.\n\nSUGGESTIONS: How do I enroll in the 401k?|What's the PTO policy?",
    "PTO is 15 days/year in your first year, accruing monthly. You can take days as soon as they accrue. Submit requests in Workday at least 2 weeks in advance.\n\nSUGGESTIONS: Do unused PTO days roll over?|How does sick leave work?",
    "Payroll is bi-weekly, every other Friday. Direct deposit takes 1 pay cycle to set up, so your first check may be a paper check.\n\nSUGGESTIONS: How do I set up direct deposit?|Where do I find my pay stubs?",
  ],
  jordan: [
    "The big unwritten rule here: people value direct communication over hierarchy. You can message anyone — including execs — directly on Slack. No need to go through your manager first.\n\nSUGGESTIONS: How are decisions typically made here?|What's the vibe in team meetings?",
    "The company runs on results, not hours. Nobody watches the clock — but people notice output. Ship something visible in your first 30 days and you'll be remembered well.\n\nSUGGESTIONS: What's the best way to get visibility early on?|How do teams collaborate across departments?",
    "Fridays are low-meeting days by culture norm — most people use them for deep work or wrapping up. Great time to ship things.\n\nSUGGESTIONS: Are there any regular company rituals I should know about?|What do people do for lunch?",
  ],
  sam: [
    "Your MacBook should be waiting at your desk. Day 1, run the IT setup script linked in your welcome email — it installs all core tools in one shot and takes about 20 minutes.\n\nSUGGESTIONS: How do I get access to GitHub?|What password manager does the company use?",
    "For system access, submit a ticket in Jira under IT Requests. Standard tools (Slack, Notion, GSuite) are auto-provisioned. Specialized tools need manager approval.\n\nSUGGESTIONS: How do I connect to the VPN?|Where do I find the internal wiki?",
    "The VPN is required for anything internal. Download GlobalProtect from the IT portal — credentials are the same as your company email. Connect before your first internal meeting.\n\nSUGGESTIONS: What video conferencing tool do we use?|How do I set up 2FA?",
  ],
  buddy: [
    "Best way to meet people early: join the #introductions Slack channel and post a quick note about yourself. People are genuinely welcoming here and someone will reach out.\n\nSUGGESTIONS: Are there any team lunches or socials coming up?|How do I find people with similar interests?",
    "There's a team lunch every Thursday — it's optional but a great way to meet people outside your immediate team. Just show up, anyone can join.\n\nSUGGESTIONS: Are there any clubs or interest groups?|How do people usually celebrate birthdays or milestones?",
    "The #random Slack channel is where the real culture lives. Memes, weekend plans, pet photos — it's how people actually connect day-to-day.\n\nSUGGESTIONS: Is there a buddy program I can join?|What team events are coming up this month?",
  ],
  coach: [
    "In your first 30 days, focus on listening and learning — don't try to change things yet. Map out how decisions get made and who the key stakeholders are in your area.\n\nSUGGESTIONS: What should my 60-day goals look like?|How do I identify quick wins early on?",
    "A strong 30/60/90 plan: 30 days = understand the landscape, 60 days = identify one quick win and ship it, 90 days = propose something bigger. Your manager will love this structure.\n\nSUGGESTIONS: How do I set up a 1:1 with my manager?|What does success look like in this role at 6 months?",
    "Quick wins matter a lot here. Find one recurring pain point your team has and fix it in your first 6 weeks — even something small. It sets the tone for how people see you.\n\nSUGGESTIONS: How should I handle my first performance review?|What skills should I be building in this role?",
  ],
};

// Simple keyword-based routing for mock mode
function mockRoute(message: string, requestedAgent: SpecialistId): SpecialistId {
  const m = message.toLowerCase();
  if (/benefit|pto|pay|salary|insurance|401|vacation|sick|leave|hr|policy|handbook/.test(m)) return 'alex';
  if (/tech|laptop|software|slack|github|password|vpn|access|setup|it |install|login/.test(m)) return 'sam';
  if (/culture|value|norm|how does|unwritten|rule|decision|vibe|work.?life/.test(m)) return 'jordan';
  if (/meet|friend|lunch|social|team event|colleague|people|connect|belong/.test(m)) return 'buddy';
  if (/goal|30.day|60.day|90.day|success|win|ramp|performance|grow|career|first week/.test(m)) return 'coach';
  if (/first day|office|tour|badge|start|arrival|park|dress/.test(m)) return 'maya';
  return requestedAgent;
}

function getMockResponse(agentId: SpecialistId): string {
  const pool = MOCK_RESPONSES[agentId];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      agentId,
      companyContext,
      conversationHistory,
      newHireContext,
    } = body as {
      message: string;
      agentId: SpecialistId;
      companyContext: Record<string, unknown> | null;
      conversationHistory: Array<{ role: string; message: string; agentId: string }>;
      newHireContext: Record<string, string> | null;
    };

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const mockMode = process.env.MOCK_AGENTS === 'true' || !apiKey;

    // ── Mock mode: no API calls, deterministic routing ─────────────────────
    if (mockMode) {
      const resolvedAgent = mockRoute(message, agentId as SpecialistId);
      const wasRouted = resolvedAgent !== agentId;
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800)); // fake latency
      return NextResponse.json({
        response: getMockResponse(resolvedAgent),
        agent: SPECIALISTS[resolvedAgent].name,
        agentId: resolvedAgent,
        wasRouted,
        isFallback: false,
        mock: true,
      });
    }

    const client = new Anthropic({ apiKey: apiKey! });

    const companyKnowledge = buildCompanyKnowledge(companyContext);
    const newHireInfo = buildNewHireContext(newHireContext);

    // Build conversation context for this agent's thread
    const agentHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of conversationHistory || []) {
      if (msg.agentId === agentId) {
        agentHistory.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.message,
        });
      }
    }
    // Remove the current message if it's in history
    const priorHistory = agentHistory.slice(0, -1);

    // Build a short summary of recent cross-agent context for the orchestrator
    const recentMessages = (conversationHistory || []).slice(-6);
    const conversationSummary = recentMessages
      .map((m) => `${m.role}: ${m.message.substring(0, 80)}`)
      .join('\n');

    // Step 1: Route to best specialist
    const resolvedAgent = await routeToSpecialist(
      client,
      message,
      agentId as SpecialistId,
      conversationSummary,
    );

    const wasRouted = resolvedAgent !== agentId;
    const isFirstMessage = priorHistory.length === 0 && !wasRouted;

    // Step 2: Get specialist response
    const responseText = await getSpecialistResponse(
      client,
      resolvedAgent,
      message,
      companyKnowledge,
      newHireInfo,
      priorHistory,
      isFirstMessage,
      wasRouted,
      agentId as SpecialistId,
    );

    return NextResponse.json({
      response: responseText,
      agent: SPECIALISTS[resolvedAgent].name,
      agentId: resolvedAgent,
      wasRouted,
      isFallback: false,
    });
  } catch (error) {
    console.error('Multi-agent error:', error);
    return NextResponse.json({ error: 'Agent service unavailable' }, { status: 503 });
  }
}
