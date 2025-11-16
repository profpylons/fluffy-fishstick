import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation history
    const conversationHistory = history.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Generate response using Gemini with MCP tool calling
    // The model will automatically call fetch_game_data when needed
    const responseText = await generateChatResponse(
      message,
      conversationHistory
    );

    return NextResponse.json({
      message: responseText,
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);

    // Return user-friendly error messages
    const errorMessage = error?.message || 'Failed to process request';

    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      statusCode = 429; // Too Many Requests
    } else if (errorMessage.includes('invalid API key') || errorMessage.includes('API_KEY_INVALID')) {
      statusCode = 401; // Unauthorized
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
