
import { Task } from './task';
import { Project } from './project';
import { Person } from './person';
import { Character } from './character';
import { Tag } from './task';
import { Hobby, DiaryEntry, InboxCategory, ReportQuestion, ReportPreset } from './journal';
import { TimeBlock, RoutinePreset } from './journal';
import { ShoppingStore, ShoppingItem } from './shopping';
import { ThemeType } from './base';



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
  diaryNotificationEnabled?: boolean;
  diaryNotificationTime?: string;
  timeBlocks?: TimeBlock[];
  blockHistory?: Record<string, Record<string, 'pending' | 'completed' | 'missed'>>;
  routinePresets?: RoutinePreset[];
  activeTab?: string;
  theme?: ThemeType;
  reportTemplate?: ReportQuestion[];
  reportPresets?: ReportPreset[];
  updatedAt?: number;
  shoppingStores?: ShoppingStore[];
  shoppingItems?: ShoppingItem[];
}

export interface TwelveWeekYear {
  id: string;
  startDate: number;
  endDate: number;
  currentWeek: number;
  globalExecutionScore: number;
  updatedAt: number;
  // Added weeklyScores to support historical review comments and scores
  weeklyScores?: Record<number, { score: number; comment: string }>;
}
