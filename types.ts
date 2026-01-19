
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

export type DiagramTheme = 'dark' | 'midnight' | 'forest' | 'neutral';

export interface DiagramStyleConfig {
  nodeColor?: string;
  lineColor?: string;
  textColor?: string;
  backgroundColor?: string;
}

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
  styleConfig?: DiagramStyleConfig;
}

export type AppView = 'landing' | 'app' | 'docs';
