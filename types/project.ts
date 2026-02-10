
export interface ProjectSectionData {
  id: string;
  title: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentFolderId?: string; 
  status: 'active' | 'archived';
  progress: number;
  type?: 'goal' | 'subproject' | 'folder' | 'list';
  isStrategic: boolean;
  sphere?: 'health' | 'career' | 'finance' | 'education' | 'relationships' | 'rest';
  sections?: ProjectSectionData[];
  monthlyGoal?: string;
  monthlyKpi?: number;
  monthlyKpiCurrent?: number;
  startDate?: number; 
  leadMeasure?: string; 
  lagMeasure?: string;  
  updatedAt: number;
  // Налаштування відображення
  viewMode?: 'list' | 'kanban' | 'timeline';
  showCompleted?: boolean;
  showDetails?: boolean;
  sortBy?: 'priority' | 'name' | 'date';
}
