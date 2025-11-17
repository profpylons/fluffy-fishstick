'use client';

import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [timeString, setTimeString] = useState<string>('');
  
  // Format time on client side only to avoid hydration mismatch
  useEffect(() => {
    setTimeString(new Date(message.timestamp).toLocaleTimeString());
  }, [message.timestamp]);
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        {timeString && (
          <div className="text-xs mt-2 opacity-70">
            {timeString}
          </div>
        )}
      </div>
    </div>
  );
}
