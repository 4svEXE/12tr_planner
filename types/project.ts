
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
  updatedAt: number;
}
