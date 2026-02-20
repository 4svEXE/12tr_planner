import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TaskStatus } from '../../types/base';
import Typography from '../ui/Typography';
import MiniCalendar from '../sidebar/MiniCalendar';
import ExplorerNode from './ExplorerNode';

interface ListsSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onOpenListModal: (initialData: any, parentId?: string) => void;
  isMobile: boolean;
  onClose?: () => void;
}

const EXPANDED_NODES_KEY = '12tr_sidebar_expanded_nodes';

const ListsSidebar: React.FC<ListsSidebarProps> = ({ selectedProjectId, onSelectProject, onOpenListModal, isMobile, onClose }) => {
  const { projects, tasks, updateProject, deleteProject, deleteProjectSection, updateTask, setActiveTab } = useApp();

  const [isCollectionsExpanded, setIsCollectionsExpanded] = useState(true);
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(true);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(EXPANDED_NODES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(EXPANDED_NODES_KEY, JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  const folders = useMemo(() =>
    projects.filter(p => p &&
      (p.type === 'folder' || p.type === 'list' || !p.type) &&
      p.description !== 'SYSTEM_PLANNER_CONFIG'
    ),
    [projects]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const inboxCount = tasks.filter(t => t.status === TaskStatus.INBOX && !t.projectId && t.category !== 'note' && !t.isDeleted && !t.scheduledDate && t.projectSection !== 'habits' && !t.tags.includes('habit')).length;
  const calendarCount = tasks.filter(t => t.scheduledDate && !t.isDeleted).length;
  const notesCount = tasks.filter(t => !t.projectId && t.category === 'note' && !t.isDeleted && !t.scheduledDate).length;

  return (
    <aside className="w-full h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col shadow-xl md:shadow-none overflow-hidden">
      <header className="p-4 md:p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-transparent shrink-0">
        <Typography variant="h2" className="text-lg font-black uppercase tracking-tight text-[var(--text-sidebar)]">Записник</Typography>
        {isMobile && (
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center active:scale-90 transition-all">
            <i className="fa-solid fa-xmark text-lg" style={{ color: 'var(--text-sidebar)' }}></i>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6">

        {/* SECTION: PRIMARY */}
        <div>
          <button
            onClick={() => onSelectProject('system_inbox')}
            className={`w-full flex items-center gap-2 px-3 h-8 rounded-xl transition-all relative group ${selectedProjectId === 'system_inbox' ? 'bg-[var(--primary)] shadow-lg' : 'hover:bg-black/5'}`}
          >
            <i className={`fa-solid fa-inbox text-[12px] w-5 text-center ${selectedProjectId === 'system_inbox' ? 'text-white' : 'text-blue-400'}`}></i>
            <span className={`text-[12px] truncate flex-1 text-left font-bold tracking-tight ${selectedProjectId === 'system_inbox' ? 'text-white' : ''}`}>Вхідні</span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${selectedProjectId === 'system_inbox' ? 'bg-white/20 text-white' : 'bg-black/5'}`} style={selectedProjectId !== 'system_inbox' ? { color: 'var(--text-sidebar)' } : {}}>{inboxCount}</span>
          </button>

          <button
            onClick={() => onSelectProject('system_calendar')}
            className={`w-full flex items-center gap-2 px-3 h-8 rounded-xl transition-all relative group ${selectedProjectId === 'system_calendar' ? 'bg-rose-500 shadow-lg' : 'hover:bg-black/5'}`}
          >
            <i className={`fa-solid fa-calendar-day text-[12px] w-5 text-center ${selectedProjectId === 'system_calendar' ? 'text-white' : 'text-rose-400'}`}></i>
            <span className={`text-[12px] truncate flex-1 text-left font-bold tracking-tight ${selectedProjectId === 'system_calendar' ? 'text-white' : ''}`}>Календар</span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${selectedProjectId === 'system_calendar' ? 'bg-white/20 text-white' : 'bg-black/5'}`} style={selectedProjectId !== 'system_calendar' ? { color: 'var(--text-sidebar)' } : {}}>{calendarCount}</span>
          </button>

          <button
            onClick={() => onSelectProject('system_notes')}
            className={`w-full flex items-center gap-2 px-3 h-8 rounded-xl transition-all relative group ${selectedProjectId === 'system_notes' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-black/5'}`}
          >
            <i className={`fa-solid fa-note-sticky text-[12px] w-5 text-center ${selectedProjectId === 'system_notes' ? 'text-white' : 'text-indigo-400'}`}></i>
            <span className={`text-[12px] truncate flex-1 text-left font-bold tracking-tight ${selectedProjectId === 'system_notes' ? 'text-white' : ''}`}>Нотатки</span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${selectedProjectId === 'system_notes' ? 'bg-white/20 text-white' : 'bg-black/5'}`} style={selectedProjectId !== 'system_notes' ? { color: 'var(--text-sidebar)' } : {}}>{notesCount}</span>
          </button>
        </div>

        {/* SECTION: COLLECTIONS */}
        <div className="">
          <div className="px- mb- flex justify-between items-center group/sec-header opacity-60">
            <div
              onClick={() => setIsCollectionsExpanded(!isCollectionsExpanded)}
              className="flex items-center gap-2 cursor-pointer flex-1"
            >
              <i className={`fa-solid fa-chevron-right text-[7px] transition-transform duration-200 ${isCollectionsExpanded ? 'rotate-90' : ''}`} style={{ color: 'var(--text-sidebar)' }}></i>
              <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-sidebar)' }}>Колекції</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onOpenListModal({ type: 'folder' })} className="hover:scale-110 transition-transform p-1" title="Нова папка" style={{ color: 'var(--text-sidebar)' }}><i className="fa-solid fa-folder-plus text-[10px]"></i></button>
              <button onClick={() => onOpenListModal({ type: 'list' })} className="hover:scale-110 transition-transform p-1" title="Новий список" style={{ color: 'var(--text-sidebar)' }}><i className="fa-solid fa-plus text-[10px]"></i></button>
            </div>
          </div>

          {isCollectionsExpanded && (
            <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
              const sourceProjectId = e.dataTransfer.getData('projectId');
              if (sourceProjectId) updateProject({ ...projects.find(p => p.id === sourceProjectId)!, parentFolderId: undefined });
            }}>
              {folders.filter(p => !p.parentFolderId).map(rootProject => (
                <ExplorerNode
                  key={rootProject.id}
                  project={rootProject}
                  level={0}
                  expandedFolders={expandedFolders}
                  selectedProjectId={selectedProjectId}
                  onToggle={toggleFolder}
                  onSelect={onSelectProject}
                  onEdit={(p) => onOpenListModal(p)}
                  onAddChild={(parentId, type) => onOpenListModal({ type }, parentId)}
                  onDelete={(id) => { if (confirm('Видалити?')) deleteProject(id); }}
                  onDeleteSection={deleteProjectSection}
                  onMoveNode={(src, target) => updateProject({ ...projects.find(p => p.id === src)!, parentFolderId: target })}
                  onUpdateTask={updateTask}
                  allTasks={tasks}
                  allProjects={projects}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto shrink-0 border-t border-[var(--border-color)] bg-black/[0.05] pt-2">
        <div className="space-y-1 pb-2">
          <div
            onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
            className="px-4 mb-1 flex items-center gap-2 cursor-pointer group/sec opacity-50"
          >
            <i className={`fa-solid fa-chevron-right text-[7px] transition-transform duration-200 ${isArchiveExpanded ? 'rotate-90' : ''}`} style={{ color: 'var(--text-sidebar)' }}></i>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-sidebar)' }}>Системний архів</span>
          </div>

          {isArchiveExpanded && (
            <div className="grid grid-cols-1 gap-0.5 px-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
              {[
                { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги', color: 'text-amber-400' },
                { id: 'completed', icon: 'fa-check-double', label: 'Готово', color: 'text-emerald-400' },
                { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', color: 'text-rose-400' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/10"
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center ${item.color} text-[12px]`}></i>
                  <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: 'var(--text-sidebar)' }}>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-black/10">
          <div className="bg-[var(--bg-input)] rounded-2xl p-2 shadow-inner border border-black/5 overflow-hidden">
            <MiniCalendar />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ListsSidebar;