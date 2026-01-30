
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
  | 'classic' | 'midnight' | 'obsidian' | 'cyberpunk' | 'dracula' | 'nordic-dark'
  | 'diablo' | 'witcher' | 'minecraft' | 'fallout' | 'skyrim'
  | 'sakura' | 'ocean' | 'forest' | 'lavender' | 'desert'
  | 'toxic' | 'synthwave' | 'mars' | 'gold' | 'matrix'
  | 'slate' | 'glass' | 'coffee' | 'linear' | 'apple'
  | 'uber' | 'slack' | 'spotify' | 'stripe' | 'github'
  | 'clay' | 'olive' | 'steel' | 'wine' | 'midnight-blue'
  | 'gameboy' | 'commodore' | 'sepia' | 'paper' | 'blueprint';
