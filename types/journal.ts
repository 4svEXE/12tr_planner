
export interface TimeBlock {
  id: string;
  title: string;
  startHour: number;
  endHour: number;
  color?: string;
  type: 'work' | 'rest' | 'routine' | 'study';
  dayOfWeek?: number;
  updatedAt?: number;
}

export interface RoutinePreset {
  id: string;
  name: string;
  blocks: TimeBlock[];
  updatedAt: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface InboxCategory {
  id: string;
  title: string;
  icon: string;
  isPinned: boolean;
  scope?: 'inbox' | 'actions';
  color?: 'slate' | 'orange' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'violet';
  updatedAt: number;
}

export interface Hobby {
  id: string;
  name: string;
  color: string;
  updatedAt: number;
}

export type ReportQuestionType = 
  | 'mood' 
  | 'gratitude_people' 
  | 'gratitude_self' 
  | 'positive_events' 
  | 'habits' 
  | 'victory' 
  | 'ideas' 
  | 'text';

export interface ReportQuestion {
  id: string;
  text: string;
  type: ReportQuestionType;
  required: boolean;
}

export interface ReportPreset {
  id: string;
  name: string;
  questions: ReportQuestion[];
  updatedAt: number;
}

export interface AiSuggestion {
  id: string;
  type: 'task' | 'project' | 'habit' | 'achievement' | 'note' | 'event';
  title: string;
  description?: string;
  reason: string;
}
