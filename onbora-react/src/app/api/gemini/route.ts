import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const geminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
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
          { error: 'AI service is busy. Please try again in a moment.', code: 'RATE_LIMIT' },
          { status: 429 }
        );
      }
      if (response.status === 400) {
        return NextResponse.json(
          { error: 'Invalid request to AI service', code: 'INVALID_REQUEST' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'AI service temporarily unavailable', code: 'SERVICE_ERROR' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json(
        { error: 'AI response format error', code: 'RESPONSE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: responseText,
      usage: data.usageMetadata,
      model: 'gemini-2.5-flash-lite',
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
