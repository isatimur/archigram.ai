export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  codeSnapshot?: string;
  timestamp: number;
}

export enum ViewMode {
  Split = 'SPLIT',
  Code = 'CODE',
  Preview = 'PREVIEW'
}

export type DiagramTheme = 'dark' | 'forest' | 'neutral' | 'base';

export interface DiagramState {
  code: string;
  lastValidCode: string;
  error: string | null;
}