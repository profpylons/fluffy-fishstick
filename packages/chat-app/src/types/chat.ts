// Tool execution record (historical data about tools that ran)
export interface ToolExecution {
  toolName: string;
  args: Record<string, unknown>;
  timestamp: number;
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
