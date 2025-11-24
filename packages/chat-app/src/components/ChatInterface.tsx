'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

// Helper function to convert error messages into user-friendly text
function formatErrorMessage(errorMsg: string): string {
  if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
    return `⚠️ API Rate Limit Exceeded

I've hit the API rate limit. This usually resets in about a minute.

Please try again in a moment, or check your API quota at:
https://console.anthropic.com/`;
  }

  if (errorMsg.includes('MCP server') || errorMsg.includes('MCP_SERVER_URL')) {
    return `⚠️ MCP Server Connection Error

${errorMsg}

If running locally, make sure to start the MCP server:
cd packages/mcp-server && npm run cf:dev`;
  }

  if (errorMsg.includes('authentication') || errorMsg.includes('api_key')) {
    return `⚠️ API Key Issue

There's a problem with the API key configuration. Please check that your ANTHROPIC_API_KEY is set correctly in the .env file.`;
  }

  return `⚠️ Error\n\n${errorMsg}`;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you analyze game data from the RAWG database. Ask me about games, ratings, platforms, genres, or any other gaming statistics!',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Add a temporary "thinking" message
    const thinkingId = (Date.now() + 1).toString();
    const thinkingMessage: Message = {
      id: thinkingId,
      role: 'assistant',
      content: '🤔 Thinking...',
      timestamp: new Date(),
      toolExecutions: [],
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    // Track tool executions outside try block so catch can access them
    const allToolExecutions: Array<{ toolName: string; args: Record<string, unknown>; timestamp: number; result?: unknown }> = [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: messages,
        }),
      });

      if (!response.ok) {
        // Remove thinking message and throw error
        setMessages((prev) => prev.filter(m => m.id !== thinkingId));
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let finalResponse = '';
      let buffer = ''; // Buffer for incomplete lines

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Add chunk to buffer and split by newlines
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              // Skip empty data lines
              if (!data) continue;

              try {
                const event = JSON.parse(data);

                if (event.type === 'tool_start') {
                  // Add tool to the thinking message in real-time
                  allToolExecutions.push(event.data);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === thinkingId
                        ? { ...m, toolExecutions: [...allToolExecutions] }
                        : m
                    )
                  );
                } else if (event.type === 'response') {
                  finalResponse = event.data;
                } else if (event.type === 'done') {
                  // Final update with complete response
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === thinkingId
                        ? {
                            ...m,
                            content: finalResponse,
                            toolExecutions: event.data.toolExecutions,
                          }
                        : m
                    )
                  );
                } else if (event.type === 'error') {
                  // Handle error from stream - display friendly message to user
                  const errorText = formatErrorMessage(event.data);

                  const errorMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: errorText,
                    timestamp: new Date(),
                    toolExecutions: allToolExecutions, // Keep tool data for debugging
                  };

                  // Replace thinking message with error message
                  setMessages((prev) =>
                    prev.map((m) => (m.id === thinkingId ? errorMessage : m))
                  );
                  // Exit the stream reading loop
                  break;
                }
              } catch (e) {
                console.error('Error parsing SSE event:', e);
              }
            }
          }
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Display friendly error messages to the user
      const errorText = formatErrorMessage(
        error.message || 'Sorry, I encountered an error. Please try again.'
      );

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date(),
        toolExecutions: allToolExecutions, // Keep tool data for debugging
      };
      // Remove thinking message if it exists
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== thinkingId);
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
