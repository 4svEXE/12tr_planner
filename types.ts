
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

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom';

export type ThemeType = 'classic' | 'midnight' | 'nordic' | 'sakura' | 'forest' | 'amethyst' | 'volcano' | 'slate';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Hobby {
  id: string;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface HabitDayData {
  status: 'completed' | 'skipped' | 'none';
  note?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  startHour: number;
  endHour: number;
  color?: string;
  type: 'work' | 'rest' | 'routine' | 'study';
  dayOfWeek?: number; // 0-6, if set, repeats weekly
}

export interface RoutinePreset {
  id: string;
  name: string;
  blocks: Omit<TimeBlock, 'id'>[];
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface InboxCategory {
  id: string;
  title: string;
  icon: string;
  isPinned: boolean;
  color?: 'slate' | 'orange' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'violet';
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
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
  reason: string; // Why AI suggested this
}

// --- PEOPLE / NETWORKING TYPES ---

export type PersonStatus = string; // Дозволяємо будь-який рядок для кастомних статусів

export interface Memory {
  id: string;
  event: string;
  emotion: 'joy' | 'neutral' | 'sad' | 'insight' | 'support';
  date: string;
}

export interface ImportantDate {
  id: string;
  label: string;
  date: string;
}

export interface PersonNote {
  id: string;
  text: string;
  date: string;
}

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  status: PersonStatus;
  rating: number; // 1-10
  birthDate?: string;
  location?: string;
  description?: string;
  tags: string[];
  hobbies: string[];
  socials: {
    telegram?: string;
    instagram?: string;
    linkedin?: string;
    threads?: string;
    tiktok?: string;
    website?: string;
  };
  notes: PersonNote[];
  memories: Memory[];
  importantDates: ImportantDate[];
  aiPortrait?: {
    summary: string;
    interests: string[];
    tone: string;
    topics: string[];
    updatedAt: number;
  };
  lastInteractionAt?: number;
  createdAt: number;
}

// --- END OF PEOPLE TYPES ---

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
  personId?: string; // Зв'язок із союзником
  projectSection?: ProjectSection;
  goalId?: string;
  createdAt: number;
  dueDate?: number;
  scheduledDate?: number; 
  endDate?: number; // For multi-day events
  isEvent?: boolean; // Distinguish between task and event
  isPinned?: boolean;
  isTactic?: boolean; 
  category?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  checklist?: ChecklistItem[];
  isDeleted?: boolean;
  color?: string; // Color for habits
  
  // Reminder & Recurrence fields
  reminderTime?: string; // e.g. "10:00"
  reminderEnabled?: boolean;
  recurrence?: RecurrenceType;
  recurrenceDays?: number[]; // 0-6 (Sun-Sat) or 1-7 (Mon-Sun) based on JS convention

  // Habit specific: history[dateString] = status/note data
  habitHistory?: Record<string, HabitDayData>;
}

export type ProjectType = 'goal' | 'subproject' | 'folder';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentFolderId?: string; 
  status: 'active' | 'archived';
  progress: number;
  type?: ProjectType;
  
  // 12 Week Year Fields
  isStrategic: boolean;
  kpiTitle?: string;
  kpiTarget?: number;
  kpiCurrent?: number;
  kpiUnit?: string;
  executionScore?: number;
}

export interface TwelveWeekYear {
  id: string;
  startDate: number;
  endDate: number;
  currentWeek: number;
  globalExecutionScore: number;
}

export interface Skill {
  name: string;
  level: number;
  xp: number;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface Character {
  name: string;
  race: 'Gnome' | 'Elf' | 'Human' | 'Dwarf';
  archetype: 'Strategist' | 'Builder' | 'Monk' | 'Explorer';
  level: number;
  xp: number;
  gold: number;
  bio: string;
  vision: string;
  avatarUrl: string;
  energy: number;
  maxEnergy: number;
  focus: number;
  goals: string[];
  views: string[];
  skills: Skill[];
  achievements: Achievement[];
  stats: {
    health: number;
    career: number;
    finance: number;
    education: number;
    relationships: number;
    rest: number;
  };
}

export interface StoreState {
  tasks: Task[];
  projects: Project[];
  people?: Person[];
  relationshipTypes?: string[];
  character: Character;
  tags: Tag[];
  hobbies?: Hobby[];
  cycle: TwelveWeekYear;
  diary?: DiaryEntry[];
  inboxCategories?: InboxCategory[];
  detailsWidth?: number;
  sidebarSettings?: Record<string, boolean>;
  isSidebarCollapsed?: boolean;
  aiEnabled?: boolean;
  timeBlocks?: TimeBlock[]; 
  blockHistory?: Record<string, Record<string, 'pending' | 'completed' | 'missed'>>;
  routinePresets?: RoutinePreset[];
  activeTab?: string;
  theme?: ThemeType;
  reportTemplate?: ReportQuestion[];
}
