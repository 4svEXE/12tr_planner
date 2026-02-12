export enum TaskStatus {
  INBOX = 'INBOX',
  NEXT_ACTION = 'NEXT_ACTION',
  DOING = 'DOING',
  DONE = 'DONE',
  WAITING = 'WAITING',
  REFERENCE = 'REFERENCE'
}

export enum Priority {
  UI = 'UI',
  UNI = 'UNI',
  NUI = 'NUI',
  NUNI = 'NUNI'
}

export type ProjectSection = 'actions' | 'bosses' | 'goals' | 'habits' | 'planner';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom';

export type ThemeType = 
  | 'classic' | 'midnight' | 'obsidian' | 'cyberpunk' | 'dracula' | 'nordic'
  | 'espresso' | 'royal' | 'steel' | 'abyssal'
  | 'sakura' | 'ocean' | 'forest' | 'sepia' | 'paper';