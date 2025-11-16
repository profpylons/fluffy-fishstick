'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

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

      const data = await response.json();

      if (!response.ok) {
        // Use the error message from the API response
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Game Data Analytics Chat
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Powered by RAWG API & Gemini AI
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
