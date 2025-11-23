'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

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
      const allToolExecutions: Array<{ toolName: string; args: Record<string, unknown>; timestamp: number }> = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));

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
                  throw new Error(event.data);
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
      let errorText = 'Sorry, I encountered an error. Please try again.';

      if (error.message) {
        const msg = error.message;

        // Customize message based on error type
        if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          errorText = `⚠️ API Quota Exceeded

I've hit the API rate limit. This usually resets in about a minute.

Please try again in a moment, or check your API quota at:
https://aistudio.google.com/app/apikey`;
        } else if (msg.includes('invalid API key') || msg.includes('API_KEY_INVALID')) {
          errorText = `⚠️ API Key Issue

There's a problem with the API key configuration. Please check that your GEMINI_API_KEY is set correctly in the .env.local file.`;
        } else if (msg.includes('model not found') || msg.includes('not available')) {
          errorText = `⚠️ Model Not Available

The AI model (gemini-2.0-flash-exp) may not be available in your region or has been deprecated. The administrator should try using "gemini-1.5-flash" instead.`;
        } else {
          // Use the actual error message for other errors
          errorText = `⚠️ Error\n\n${msg}`;
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date(),
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
