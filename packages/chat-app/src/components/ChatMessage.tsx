'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessageProps } from '@/types/components';

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Format time - using suppressHydrationWarning on the element instead of client-side state
  const formattedTime = new Date(message.timestamp).toLocaleTimeString();

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
        {message.toolExecutions && message.toolExecutions.length > 0 && (
          <div className="mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
            <div className="text-xs opacity-70 mb-1">🔧 Tools used:</div>
            <div className="flex flex-wrap gap-1">
              {message.toolExecutions.map((tool, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-medium"
                >
                  {tool.toolName.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="text-sm markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        {formattedTime && (
          <div className="text-xs mt-2 opacity-70" suppressHydrationWarning>
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
}
