
import { TaskStatus, Priority, ProjectSection, RecurrenceType } from './base';

export interface Tag {
  id: string;
  name: string;
  color: string;
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface HabitDayData {
  status: 'completed' | 'skipped' | 'none';
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  content?: string;
  status: TaskStatus;
  priority: Priority;
  difficulty: number;
  xp: number;
  tags: string[];
  projectId?: string;
  personId?: string; 
  projectSection?: ProjectSection;
  goalId?: string;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  scheduledDate?: number; 
  endDate?: number; 
  isEvent?: boolean; 
  isPinned?: boolean;
  isTactic?: boolean; 
  category?: string;
  checklist?: ChecklistItem[];
  isDeleted?: boolean;
  isArchived?: boolean;
  color?: string; 
  recurrence?: RecurrenceType;
  daysOfWeek?: number[]; // 0-6 (Mon-Sun)
  habitHistory?: Record<string, HabitDayData>;
  completedAt?: number;
  plannerWeek?: number;
  plannerDay?: number; // 0-6 (Mon-Sun)
  plannerComment?: string;
}
