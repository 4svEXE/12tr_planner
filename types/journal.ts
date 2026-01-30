
export interface TimeBlock {
  id: string;
  title: string;
  startHour: number;
  endHour: number;
  color?: string;
  type: 'work' | 'rest' | 'routine' | 'study';
  dayOfWeek?: number;
}

export interface RoutinePreset {
  id: string;
  name: string;
  blocks: Omit<TimeBlock, 'id'>[];
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
}

export interface Hobby {
  id: string;
  name: string;
  color: string;
}

export interface ReportQuestion {
  id: string;
  text: string;
  page: number;
}

export interface AiSuggestion {
  id: string;
  type: 'task' | 'project' | 'habit' | 'achievement' | 'note' | 'event';
  title: string;
  description?: string;
  reason: string;
}
