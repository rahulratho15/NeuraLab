export const Screen = {
  HOME: 'HOME',
  CURRICULUM: 'CURRICULUM',
  LESSON: 'LESSON',
  LAB: 'LAB',
} as const;
export type Screen = typeof Screen[keyof typeof Screen];

export const LabType = {
  TERMINAL: 'TERMINAL',
  CODE_EDITOR: 'CODE_EDITOR',
  VISUALIZER: 'VISUALIZER',
  QUIZ: 'QUIZ',
  CHAT_TUTOR: 'CHAT_TUTOR'
} as const;
export type LabType = typeof LabType[keyof typeof LabType];

export interface Module {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  labType: LabType;
  topics: string[];
  isCompleted?: boolean; // New: Track progress
}

export interface Course {
  id: string;
  topic: string;
  overview: string;
  modules: Module[];
}

// New Activity Types
export type ActivityType = 'QUIZ' | 'MEMORY' | 'SORTING' | 'MATCHING';

export interface Activity {
  type: ActivityType;
  title: string;
  
  // Common
  explanation?: string; // Feedback when complete

  // QUIZ Data
  question?: string;
  options?: string[];
  correctAnswer?: number; // index

  // MEMORY Data
  pairs?: { front: string; back: string }[]; // e.g. Term <-> Definition

  // SORTING Data (Flow Builder)
  steps?: string[]; // The correct order of steps

  // MATCHING Data (Concept Builder)
  matchPairs?: { term: string; definition: string }[];
}

export interface LessonSection {
  id: string;
  title: string;
  content: string; // Markdown/HTML explanation
  imageUrl?: string; // Dynamic image URL
  videoSearchTerm?: string; // New: Search query for YouTube Embed (more reliable)
  visualData?: any; // For graph visualization specific to this section
  codeExample?: string;
  language?: string;
  activity?: Activity; 
}

export interface LessonContent {
  title: string;
  sections: LessonSection[];
}

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
}

export interface LabState {
  id: string;
  moduleId: string;
  title: string;
  scenario: string; // New: Rich background story
  instruction: string; // Detailed technical steps
  goal: string;
  initialCode?: string;
  initialFiles?: string[];
  hints: string[];
  labType: LabType;
  visualData?: any; 
  language?: string; 
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}