import type { Message } from './chat';

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export interface ChatMessageProps {
  message: Message;
}
