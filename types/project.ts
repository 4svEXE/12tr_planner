
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
  startDate?: number; // Дата початку 12-тижневого плану для цієї цілі
  leadMeasure?: string; // Випереджаючий показник (що робимо)
  lagMeasure?: string;  // Запізнілий показник (що отримаємо в кінці)
  updatedAt: number;
}
