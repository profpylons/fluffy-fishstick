import { NextRequest } from 'next/server';
import { generateChatResponseStream } from '@/lib/claude-mcp';

export async function POST(request: NextRequest) {
  try {
    const { message, history, clientToken } = await request.json();

    // Validate client token
    const expectedToken = process.env.CLIENT_TOKEN;
    if (!expectedToken || clientToken !== expectedToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing client token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation history
    const conversationHistory = (history as Array<{ role: string; content: string }>).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of generateChatResponseStream(message, conversationHistory)) {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
          const errorData = `data: ${JSON.stringify({ type: 'error', data: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Error in chat API:', error);

    // Return user-friendly error messages
    const errorMessage = (error instanceof Error ? error.message : null) || 'Failed to process request';

    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      statusCode = 429; // Too Many Requests
    } else if (errorMessage.includes('invalid API key') || errorMessage.includes('API_KEY_INVALID')) {
      statusCode = 401; // Unauthorized
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
