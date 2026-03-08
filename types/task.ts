
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

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  daysOfWeek?: number[]; // 0-6
  endDate?: number;
}

export interface TableColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'badge' | 'date' | 'checkbox';
  width?: number;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  color?: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
}

export interface TableRow {
  id: string;
  cells: Record<string, any>; // key is column.id
  cellStyles?: Record<string, CellStyle>; // key is column.id
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
  theme?: 'default' | 'dark' | 'professional' | 'pastel' | 'ocean';
}

export interface MindmapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  shape?: 'rectangle' | 'ellipse' | 'diamond';
  isCollapsed?: boolean;
  type?: 'note' | 'task';
  completed?: boolean;
}

export interface MindmapEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  viewport?: { x: number; y: number; zoom: number };
  theme?: 'default' | 'dark' | 'ocean' | 'sunset' | 'forest';
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
  scheduledDate?: number; // Start timestamp
  endDate?: number;       // End timestamp
  isEvent?: boolean;
  isPinned?: boolean;
  isTactic?: boolean;
  category?: 'tasks' | 'note' | 'table' | 'mindmap' | string;
  checklist?: ChecklistItem[];
  isDeleted?: boolean;
  isArchived?: boolean;
  color?: string;
  recurrence?: RecurrenceType;
  recurrenceConfig?: RecurrenceConfig;
  reminders?: number[]; // Minutes before
  daysOfWeek?: number[];
  habitHistory?: Record<string, HabitDayData>;
  completedAt?: number;
  plannerWeek?: number;
  plannerDay?: number;
  plannerComment?: string;
  order?: number;
  isAllDay?: boolean;
  showInCalendar?: boolean;
  isHypothesis?: boolean;
  hypothesisDetails?: string;
  hypothesisNotes?: string;
  tableData?: TableData;
  mindmapData?: MindmapData;
}
