
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

export type ThemeType = 
  | 'classic' | 'midnight' | 'obsidian' | 'cyberpunk' | 'dracula' | 'nordic-dark'
  | 'diablo' | 'witcher' | 'minecraft' | 'fallout' | 'skyrim'
  | 'sakura' | 'ocean' | 'forest' | 'lavender' | 'desert'
  | 'toxic' | 'synthwave' | 'mars' | 'gold' | 'matrix'
  | 'slate' | 'glass' | 'coffee' | 'linear' | 'apple'
  | 'uber' | 'slack' | 'spotify' | 'stripe' | 'github'
  | 'clay' | 'olive' | 'steel' | 'wine' | 'midnight-blue'
  | 'gameboy' | 'commodore' | 'sepia' | 'paper' | 'blueprint';

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

export interface ShoppingStore {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface PriceEntry {
  id: string;
  price: number;
  storeName: string;
  date: number;
}

export interface ShoppingItem {
  id: string;
  storeId: string;
  name: string;
  isBought: boolean;
  priceHistory?: PriceEntry[];
  note?: string;
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
  reason: string;
}

export type PersonStatus = 'friend' | 'colleague' | 'family' | 'mentor' | 'acquaintance' | string;

export interface Interaction {
  id: string;
  type: 'call' | 'meeting' | 'chat' | 'event' | 'coffee' | 'walk' | 'other';
  date: number;
  summary: string;
  emotion: 'joy' | 'insight' | 'support' | 'neutral' | 'tense';
}

export interface Memory {
  id: string;
  event: string;
  emotion: 'joy' | 'insight' | 'support' | 'neutral' | 'sad';
  date: string;
}

export interface PersonNote {
  id: string;
  text: string;
  date: string;
}

export interface ImportantDate {
  id: string;
  label: string;
  date: string;
  showInCalendar: boolean;
  repeatYearly: boolean;
}

export type RelationshipLoop = 'week' | 'month' | 'quarter' | 'year' | 'none';

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  status: PersonStatus;
  rating: number;
  birthDate?: string;
  birthDateShowInCalendar?: boolean;
  birthDateRepeatYearly?: boolean;
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
  interactions: Interaction[];
  importantDates: ImportantDate[];
  loop: RelationshipLoop;
  aiPortrait?: any;
  lastInteractionAt?: number;
  createdAt: number;
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
  dueDate?: number;
  scheduledDate?: number; 
  endDate?: number; 
  isEvent?: boolean; 
  isPinned?: boolean;
  isTactic?: boolean; 
  category?: string;
  checklist?: ChecklistItem[];
  isDeleted?: boolean;
  color?: string; 
  recurrence?: RecurrenceType;
  daysOfWeek?: number[]; // 0-6 (Mon-Sun)
  habitHistory?: Record<string, HabitDayData>;
  completedAt?: number;
  plannerWeek?: number;
  plannerDay?: number; // 0-6 (Mon-Sun)
  plannerComment?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentFolderId?: string; 
  status: 'active' | 'archived';
  progress: number;
  type?: 'goal' | 'subproject' | 'folder';
  isStrategic: boolean;
  sphere?: 'health' | 'career' | 'finance' | 'education' | 'relationships' | 'rest';
  monthlyGoal?: string;
  monthlyKpi?: number;
  monthlyKpiCurrent?: number;
}

export interface TwelveWeekYear {
  id: string;
  startDate: number;
  endDate: number;
  currentWeek: number;
  globalExecutionScore: number;
  manualDailyStatus?: Record<string, boolean>;
  weeklyScores?: Record<number, { score: number; comment: string }>;
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
  role: string;
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
  beliefs: string[];
  preferences: {
    workStyle?: string;
    planningStyle?: string;
    focusBlockers: string[];
  };
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
  shoppingStores?: ShoppingStore[];
  shoppingItems?: ShoppingItem[];
}