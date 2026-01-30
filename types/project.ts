
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
  updatedAt: number;
}
