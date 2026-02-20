import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';
import Typography from '../components/ui/Typography';
import ListsSidebar from '../components/lists/ListsSidebar';
import ListContent from '../components/lists/ListContent';
import QuickAddModal from '../components/lists/QuickAddModal';
import ListEditModal from '../components/lists/ListEditModal';

const LISTS_PROJECT_KEY = '12tr_lists_selected_project';

const ListsView: React.FC = () => {
  const {
    tasks, projects, addProject, updateProject
  } = useApp();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Restore selected project preference
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(() =>
    localStorage.getItem(LISTS_PROJECT_KEY) || 'system_inbox'
  );

  const setSelectedProjectId = (id: string | null) => {
    setSelectedProjectIdState(id);
    if (id) localStorage.setItem(LISTS_PROJECT_KEY, id);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const [listModal, setListModal] = useState<{ isOpen: boolean; initialData?: any; parentId?: string } | null>(null);

  const { detailsWidth, startResizing, isResizing } = useResizer(350, 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeProject = useMemo(() => {
    if (selectedProjectId === 'system_inbox') {
      return { id: 'system_inbox', name: 'Вхідні', color: 'var(--primary)', type: 'list', sections: [{ id: 'actions', title: 'Несортоване' }] } as any;
    }
    if (selectedProjectId === 'system_calendar') {
      return { id: 'system_calendar', name: 'Календар', color: '#f43f5e', type: 'list', sections: [{ id: 'actions', title: 'Заплановано' }] } as any;
    }
    if (selectedProjectId === 'system_notes') {
      return { id: 'system_notes', name: 'Нотатки', color: '#818cf8', type: 'list', sections: [{ id: 'actions', title: 'Всі нотатки' }] } as any;
    }
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const projectTasks = useMemo(() => {
    if (selectedProjectId === 'system_inbox') {
      return tasks.filter(t => !t.projectId && t.category !== 'note' && !t.isDeleted && !t.scheduledDate);
    }
    if (selectedProjectId === 'system_calendar') {
      return tasks.filter(t => t.scheduledDate && !t.isDeleted);
    }
    if (selectedProjectId === 'system_notes') {
      return tasks.filter(t => !t.projectId && t.category === 'note' && !t.isDeleted && !t.scheduledDate);
    }
    return tasks.filter(t => t.projectId === selectedProjectId && !t.isDeleted);
  }, [tasks, selectedProjectId]);

  const handleSaveListModal = (data: any) => {
    if (listModal?.initialData?.id) {
      updateProject({ ...listModal.initialData, ...data });
    } else {
      const id = addProject(data);
      if (data.type === 'list') setSelectedProjectId(id);
    }
    setListModal(null);
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)]">
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-[1111] w-[280px] transform transition-transform duration-300 ease-out' : 'relative w-64'}
        ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        h-full
      `}>
        <ListsSidebar
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            if (isMobile) setIsSidebarOpen(false);
          }}
          onOpenListModal={(data, parentId) => setListModal({ isOpen: true, initialData: data, parentId })}
          isMobile={isMobile}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] h-full">
        {activeProject ? (
          <ListContent
            project={activeProject}
            tasks={projectTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onBack={() => setIsSidebarOpen(true)}
            isMobile={isMobile}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-10">
            <i className="fa-solid fa-layer-group text-9xl mb-4"></i>
            <button onClick={() => setIsSidebarOpen(true)} className="px-6 py-3 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest opacity-100">Відкрити списки</button>
          </div>
        )}
      </main>

      <div className={`bg-[var(--bg-card)] shrink-0 relative transition-none border-l border-[var(--border-color)] flex flex-col ${selectedTaskId ? 'z-[1200]' : 'hidden lg:flex'}`} style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0 }}>
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

      {isQuickAddOpen && activeProject && (
        <QuickAddModal
          project={activeProject}
          onClose={() => setIsQuickAddOpen(false)}
        />
      )}

      {listModal?.isOpen && (
        <ListEditModal
          initialData={listModal.initialData}
          parentId={listModal.parentId}
          onClose={() => setListModal(null)}
          onSave={handleSaveListModal}
        />
      )}
      {isMobile && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-20 left-4 w-12 h-12 rounded-2xl bg-[var(--bg-card)] text-[var(--text-main)] shadow-2xl flex items-center justify-center z-[1000] border border-[var(--border-color)] active:scale-95 transition-all"
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
      )}
    </div>
  );
};

export default ListsView;
