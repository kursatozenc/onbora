import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Onbora API server is running',
    timestamp: new Date().toISOString()
  });
});

// PDF Upload and Parsing endpoint
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('📄 PDF uploaded:', req.file.originalname);
    
    // Read the uploaded PDF file
    const pdfBuffer = fs.readFileSync(req.file.path);
    
    // Parse the PDF content using pdfjs-dist
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdfDoc = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdfDoc.numPages;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    const extractedText = fullText.trim();
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('✅ PDF parsed successfully');
    console.log('📊 Text length:', extractedText.length);
    console.log('📊 Pages:', numPages);
    
    // Return the parsed content
    res.status(200).json({
      success: true,
      filename: req.file.originalname,
      textContent: extractedText,
      pages: numPages,
      textLength: extractedText.length,
      message: 'PDF parsed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error parsing PDF:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to parse PDF',
      details: error.message 
    });
  }
});

// AI Chat endpoint (copy of your existing ai-chat.js)
app.post('/api/ai-chat', async (req, res) => {
  try {
    console.log('🔍 AI Chat API called with:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });
    
    const { message, agentType, companyContext, conversationHistory, isSmartMode } = req.body;

    if (!message) {
      console.log('❌ No message provided');
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ message: 'AI service not configured' });
    }

    // Define enhanced agent personalities with specializations
    const agentPrompts = {
      maya: {
        name: "Maya",
        role: "Welcome Guide",
        context: "You are Maya, a warm and welcoming onboarding specialist who knows this company inside and out. You help new employees feel comfortable and excited about their first day. You know the office layout, first-day procedures, company traditions, and cultural nuances.",
        focus: "first-day experience, office orientation, company traditions, making people feel welcome"
      },
      alex: {
        name: "Alex", 
        role: "HR Assistant",
        context: "You are Alex, a knowledgeable HR professional who is an expert on this company's specific policies, benefits, and procedures. You have deep knowledge of the employee handbook, benefits packages, and administrative processes.",
        focus: "benefits, policies, procedures, HR questions, administrative tasks"
      },
      jordan: {
        name: "Jordan",
        role: "Culture Guide", 
        context: "You are Jordan, a company culture expert who understands this company's unique values, traditions, unwritten rules, and social dynamics. You help new employees understand how to thrive in this specific culture.",
        focus: "company values, culture, team dynamics, unwritten rules, success tips"
      },
      sam: {
        name: "Sam",
        role: "Tech Setup Specialist",
        context: "You are Sam, an IT and technology expert who knows this company's specific tech stack, tools, and setup procedures. You help with technical onboarding and system access.",
        focus: "technical setup, software access, IT systems, troubleshooting"
      }
    };

    const agent = agentPrompts[agentType] || agentPrompts.maya;
    
    // Build comprehensive company knowledge base
    const companyKnowledge = buildCompanyKnowledge(companyContext);
    
    // Build conversation history context
    let conversationContext = '';
    let hasConversationHistory = false;
    
    if (conversationHistory && conversationHistory.length > 1) {
      // We have previous conversation (more than just the current message)
      hasConversationHistory = true;
      
      // Get all previous messages (excluding the current user message we're responding to)
      const previousMessages = conversationHistory.slice(0, -1);
      conversationContext = '\n\nCONVERSATION HISTORY:\n' + 
        previousMessages.map(msg => `${msg.role === 'user' ? 'User' : agent.name}: ${msg.message}`).join('\n');
    }

    const systemPrompt = `
      ${agent.context}
      
      COMPANY KNOWLEDGE BASE:
      ${companyKnowledge}
      
      YOUR EXPERTISE: ${agent.focus}
      
      CONVERSATION GUIDELINES:
      - Answer based on actual company information when available
      - Be specific and reference company details
      - Keep responses helpful but concise (2-4 sentences)
      - If you don't have specific info, acknowledge it and suggest alternatives
      - Maintain your warm, professional personality as ${agent.name}
      - Focus on ${agent.focus} while being helpful with other topics
      ${hasConversationHistory ? 
        "- Continue the conversation naturally - NO greetings, welcomes, or introductions since we're already talking" : 
        "- Start with a warm greeting since this is your first message to this user"}
      
      Respond as ${agent.name}, the ${agent.role} for ${companyContext?.name || 'this company'}.
    `;

    const geminiRequest = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt + conversationContext + "\n\nUser message: " + message
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: isSmartMode ? 400 : 256,
      }
    };

    console.log('🔍 Sending request to Gemini API...');
    console.log('🔍 Request body:', JSON.stringify(geminiRequest, null, 2));
    
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
    
    console.log('🔍 Gemini API response status:', response.status);

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
    console.log('🔍 Gemini API response data:', JSON.stringify(data, null, 2));
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('🔍 Extracted AI response:', aiResponse);

    if (!aiResponse) {
      console.log('🔍 No AI response found, using fallback');
      // Fallback to static response
      return res.status(200).json({
        response: getStaticResponse(agentType, message),
        isFallback: true,
        agent: agent.name
      });
    }

    console.log('🔍 Returning successful AI response');
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
});

// Gemini API endpoint (copy of your existing gemini.js)
app.post('/api/gemini', async (req, res) => {
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

    console.log('🔍 Gemini API request:', { prompt, systemPrompt });

    // Prepare the request to Gemini
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

    // Call Gemini API
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
          error: 'AI service is busy. Please try again in a moment.',
          code: 'RATE_LIMIT'
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
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again.',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Helper functions for AI Chat
function buildCompanyKnowledge(context) {
  if (!context) return "No company information available.";
  
  let knowledge = `Company: ${context.name || 'Unknown'}
Size: ${context.size || 'Unknown'}
Industry: ${context.industry || 'Unknown'}`;

  // Add document insights if available
  if (context.insights && Object.keys(context.insights).length > 0) {
    knowledge += `\n\nDOCUMENT ANALYSIS INSIGHTS:`;
    Object.entries(context.insights).forEach(([key, value]) => {
      if (value && !value.includes('Needs clarification')) {
        knowledge += `\n- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
      }
    });
  }

  // Add interview responses if available
  if (context.culture && context.culture.length > 0) {
    knowledge += `\n\nINTERVIEW INSIGHTS:`;
    context.culture.forEach((answer, index) => {
      knowledge += `\n- Response ${index + 1}: ${answer}`;
    });
  }

  // Add available documents
  if (context.documents && context.documents.length > 0) {
    knowledge += `\n\nAVAILABLE DOCUMENTS: ${context.documents.join(', ')}`;
  }

  // Add key document content snippets (truncated for context window)
  if (context.fullDocumentContent && context.fullDocumentContent !== 'No documents uploaded') {
    const truncatedContent = context.fullDocumentContent.substring(0, 2000);
    knowledge += `\n\nKEY DOCUMENT CONTENT:\n${truncatedContent}${context.fullDocumentContent.length > 2000 ? '...' : ''}`;
  }

  return knowledge;
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Onbora API server running on http://localhost:${PORT}`);
  console.log(`🔑 Gemini API key: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`📱 Test your app at: http://localhost:${PORT}/test-gemini-key.html`);
  console.log(`🧪 Test API at: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Chat endpoint: http://localhost:${PORT}/api/ai-chat`);
  console.log(`📄 PDF Upload endpoint: http://localhost:${PORT}/api/upload-pdf`);
});
