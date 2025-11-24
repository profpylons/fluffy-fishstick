'use client';

import { useState } from 'react';
import type { ToolExecution } from '@/types/chat';

interface DebugPanelProps {
  toolExecutions: ToolExecution[];
}

export default function DebugPanel({ toolExecutions }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!toolExecutions || toolExecutions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-gray-300 dark:border-gray-600 pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
        <span>🔍 Debug: Tool Calls & Raw Data ({toolExecutions.length})</span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-3">
          {toolExecutions.map((execution, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs font-mono"
            >
              <div className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                Tool: {execution.toolName}
              </div>

              <div className="mb-2">
                <div className="text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Request Arguments:
                </div>
                <pre className="bg-white dark:bg-gray-950 p-2 rounded overflow-x-auto text-[10px] leading-relaxed">
                  {JSON.stringify(execution.args, null, 2)}
                </pre>
              </div>

              {execution.result !== undefined && (
                <div>
                  <div className="text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    Raw JSON Response:
                  </div>
                  <pre className="bg-white dark:bg-gray-950 p-2 rounded overflow-x-auto text-[10px] leading-relaxed max-h-96 overflow-y-auto">
                    {(() => {
                      try {
                        // Parse the result if it's a string
                        let data = typeof execution.result === 'string'
                          ? JSON.parse(execution.result)
                          : execution.result;

                        // If data is an array, check each item for nested JSON strings
                        if (Array.isArray(data)) {
                          data = data.map(item => {
                            if (item && typeof item === 'object' && item.type === 'text' && typeof item.text === 'string') {
                              try {
                                // Try to parse the text field as JSON
                                return { ...item, text: JSON.parse(item.text) };
                              } catch {
                                // If parsing fails, keep original
                                return item;
                              }
                            }
                            return item;
                          });
                        }

                        return JSON.stringify(data, null, 2);
                      } catch {
                        // If parsing fails, display as-is
                        return typeof execution.result === 'string'
                          ? execution.result
                          : JSON.stringify(execution.result, null, 2);
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
