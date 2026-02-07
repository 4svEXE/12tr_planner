
import React from 'react';
import Typography from '../ui/Typography';
import Button from '../ui/Button';
import { Project } from '../../types';

interface ListHeaderProps {
  project: Project;
  taskCount: number;
  isMobile: boolean;
  onBack: () => void;
  onUpdateProject: (p: Project) => void;
  onAddSection: (pId: string, title: string) => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({ project, taskCount, isMobile, onBack, onUpdateProject, onAddSection }) => {
  return (
    <header className="px-4 md:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center text-[var(--text-muted)] mr-1">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0" 
          style={{ backgroundColor: project.color || 'var(--primary)' }}
        >
          <i className="fa-solid fa-list-check"></i>
        </div>
        <div className="min-w-0">
          <input
            value={project.name}
            onChange={e => onUpdateProject({ ...project, name: e.target.value })}
            className="text-base md:text-lg font-black uppercase tracking-tight bg-transparent border-none p-0 focus:ring-0 w-full outline-none text-[var(--text-main)]"
          />
          <Typography variant="tiny" className="text-[var(--text-muted)] text-[7px] uppercase tracking-widest leading-none">
            {taskCount} елементів
          </Typography>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
<<<<<<< HEAD
          variant="ghost" 
          icon="fa-plus" 
          className="text-[8px] h-7 rounded px-2 opacity-40 hover:opacity-100 hover:bg-black/5 transition-all font-black uppercase tracking-widest border-none" 
=======
          variant="white" 
          icon="fa-plus" 
          className="text-[8px] h-8 rounded px-3 md:h-9" 
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
          onClick={() => onAddSection(project.id, 'Нова секція')}
        >
          {!isMobile && 'СЕКЦІЯ'}
        </Button>
      </div>
    </header>
  );
};

export default ListHeader;
