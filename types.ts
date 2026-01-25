
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  codeSnapshot?: string;
  timestamp: number;
  feedback?: 'helpful' | 'unhelpful'; // Phase 1: Data Feedback Loop
}

export enum ViewMode {
  Split = 'SPLIT',
  Code = 'CODE',
  Preview = 'PREVIEW'
}

export type DiagramTheme = 'dark' | 'midnight' | 'forest' | 'neutral';

export type CopilotDomain = 'General' | 'Healthcare' | 'Finance' | 'E-commerce';

export type BackgroundPattern = 'solid' | 'dots' | 'grid' | 'crossline';
export type DiagramLook = 'classic' | 'handDrawn';

export interface DiagramStyleConfig {
  nodeColor?: string;
  lineColor?: string;
  textColor?: string;
  backgroundColor?: string;
  backgroundPattern?: BackgroundPattern;
  backgroundOpacity?: number; // 0 to 1
  diagramLook?: DiagramLook;
}

export interface DiagramState {
  code: string;
  lastValidCode: string;
  error: string | null;
}

export interface ProjectVersion {
  id: string;
  timestamp: number;
  code: string;
  label: string;
  source: 'ai' | 'manual' | 'auto';
}

export interface Project {
  id: string;
  name: string;
  code: string;
  updatedAt: number;
  thumbnail?: string; 
  styleConfig?: DiagramStyleConfig;
  versions?: ProjectVersion[];
  type?: 'mermaid' | 'plantuml'; 
}

export interface CommunityDiagram {
  id: string;
  title: string;
  author: string;
  description: string;
  code: string;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
}

export type AppView = 'landing' | 'app' | 'plantuml' | 'docs' | 'gallery' | 'faq' | 'privacy' | 'terms' | 'license';
