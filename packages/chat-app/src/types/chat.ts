// Tool execution record (historical data about tools that ran)
export interface ToolExecution {
  toolName: string;
  args: Record<string, unknown>;
  timestamp: number;
  result?: unknown; // Raw JSON result from tool execution (for debug mode)
}

// Tool status for real-time UI notifications
export interface ToolStatus {
  id: string;
  toolName: string;
  status: 'pending' | 'completed' | 'error';
  message: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolExecutions?: ToolExecution[];
  debugData?: {
    toolExecutions: ToolExecution[];
  };
}

export interface ChatRequest {
  message: string;
  history: Message[];
}

export interface ChatResponse {
  message: string;
  gameData?: unknown;
  toolExecutions?: ToolExecution[];
}

export type StreamEvent =
  | { type: 'tool_start'; data: ToolExecution }
  | { type: 'tool_complete'; data: { toolName: string } }
  | { type: 'response'; data: string }
  | { type: 'done'; data: { toolExecutions: ToolExecution[] } }
  | { type: 'error'; data: string };
