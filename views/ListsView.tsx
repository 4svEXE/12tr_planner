
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';
import Typography from '../components/ui/Typography';
import ListsSidebar from '../components/lists/ListsSidebar';
import ListContent from '../components/lists/ListContent';

const ListsView: React.FC = () => {
  const {
    tasks, projects, updateTask, deleteTask, toggleTaskStatus
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('system_inbox');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { detailsWidth, startResizing, isResizing } = useResizer(350, 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeProject = useMemo(() => {
    if (selectedProjectId === 'system_inbox') {
      return { id: 'system_inbox', name: 'Вхідні', color: 'var(--primary)', type: 'list', sections: [{ id: 'actions', title: 'Загальне' }] } as any;
    }
    if (selectedProjectId === 'system_notes') {
      return { id: 'system_notes', name: 'Нотатки', color: '#818cf8', type: 'list', sections: [{ id: 'actions', title: 'Всі нотатки' }] } as any;
    }
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const projectTasks = useMemo(() => {
    if (selectedProjectId === 'system_inbox') {
      return tasks.filter(t => !t.projectId && t.category !== 'note' && !t.isDeleted);
    }
    if (selectedProjectId === 'system_notes') {
      return tasks.filter(t => !t.projectId && t.category === 'note' && !t.isDeleted);
    }
    return tasks.filter(t => t.projectId === selectedProjectId && !t.isDeleted);
  }, [tasks, selectedProjectId]);

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)]">
      <div className={`flex flex-1 overflow-hidden transition-all duration-300 h-full`}>
        <ListsSidebar 
          selectedProjectId={selectedProjectId} 
          onSelectProject={setSelectedProjectId}
          isMobile={isMobile}
        />
        
        <main className={`flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] h-full ${isMobile && !selectedProjectId ? 'hidden' : 'flex'}`}>
          {activeProject ? (
            <ListContent 
              project={activeProject}
              tasks={projectTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onBack={() => setSelectedProjectId(null)}
              isMobile={isMobile}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center opacity-10">
               <i className="fa-solid fa-list-check text-9xl"></i>
            </div>
          )}
        </main>
      </div>

      <div className={`bg-[var(--bg-card)] shrink-0 relative transition-none border-l border-[var(--border-color)] flex flex-col ${selectedTaskId ? 'z-[100]' : 'hidden lg:flex'}`} style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0 }}>
        {!isMobile && <div onMouseDown={startResizing} className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[100] transition-colors -ml-0.5 ${isResizing ? 'bg-[var(--primary)]' : 'bg-transparent hover:bg-[var(--primary)]/20'}`} />}
        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-mountain-sun text-9xl mb-8 text-[var(--text-main)]"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest text-[var(--text-muted)]">Оберіть елемент</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListsView;
