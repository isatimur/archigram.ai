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

export interface Project {
  id: string;
  name: string;
  code: string;
  updatedAt: number;
  thumbnail?: string; // Optional future proofing
}

export type AppView = 'landing' | 'app';