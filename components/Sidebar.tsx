
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { TaskStatus, Project } from '../types';
import Typography from './ui/Typography';
import MiniCalendar from './sidebar/MiniCalendar';

const EXPANDED_NODES_KEY = '12tr_sidebar_expanded_nodes';
const LISTS_SECTION_COLLAPSED_KEY = '12tr_sidebar_lists_collapsed';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, projects, updateTask, scheduleTask, toggleTaskStatus, 
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings = {},
    isSyncing, syncData, addProject, deleteProject
  } = useApp();
  const { user, logout, setIsAuthModalOpen } = useAuth();
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dragExpandTimerRef = useRef<number | null>(null);
  
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(EXPANDED_NODES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [isListsExpanded, setIsListsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem(LISTS_SECTION_COLLAPSED_KEY);
    return saved !== 'true'; 
  });

  useEffect(() => {
    localStorage.setItem(EXPANDED_NODES_KEY, JSON.stringify(Array.from(expandedNodes)));
  }, [expandedNodes]);

  useEffect(() => {
    localStorage.setItem(LISTS_SECTION_COLLAPSED_KEY, (!isListsExpanded).toString());
  }, [isListsExpanded]);

  const primaryItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні', acceptDrop: true },
    { id: 'lists', icon: 'fa-folder-tree', label: 'Списки', acceptDrop: true },
    { id: 'planner', icon: 'fa-calendar-check', label: 'Планувальник' },
    { id: 'projects', icon: 'fa-flag-checkered', label: 'Цілі' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
  ];

  const widgetItems = [
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'people', icon: 'fa-user-ninja', label: 'Люди' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Герой' },
    { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки' },
  ];

  const bottomItems = [
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
    { id: 'hobbies', icon: 'fa-masks-theater', label: 'Хобі' },
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово', acceptDrop: true },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
  ];

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (dragExpandTimerRef.current) {
      window.clearTimeout(dragExpandTimerRef.current);
      dragExpandTimerRef.current = null;
    }
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (targetId.startsWith('proj_')) {
      const projectId = targetId.replace('proj_', '');
      updateTask({ ...task, projectId, projectSection: 'actions' as any, isDeleted: false });
      return;
    }

    switch (targetId) {
      case 'today': scheduleTask(taskId, new Date().setHours(0,0,0,0)); break;
      case 'inbox': updateTask({ ...task, status: TaskStatus.INBOX, scheduledDate: undefined, projectId: undefined, category: 'unsorted', isDeleted: false }); break;
      case 'next_actions': updateTask({ ...task, status: TaskStatus.NEXT_ACTION, isDeleted: false }); break;
      case 'notes': updateTask({ ...task, category: 'note', status: TaskStatus.INBOX, isDeleted: false }); break;
      case 'completed': if (task.status !== TaskStatus.DONE) toggleTaskStatus(task); break;
      case 'trash': updateTask({ ...task, isDeleted: true }); break;
      case 'lists': setActiveTab('lists'); break;
    }
  };

  const handleDragOverLists = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isListsExpanded && !dragExpandTimerRef.current) {
      dragExpandTimerRef.current = window.setTimeout(() => {
        setIsListsExpanded(true);
      }, 600);
    }
  };

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const handleSidebarCreate = (type: 'folder' | 'list', parentId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const name = prompt(`Назва ${type === 'folder' ? 'папки' : 'списку'}:`);
    if (!name) return;
    
    addProject({
      name,
      type,
      color: type === 'folder' ? 'var(--text-muted)' : 'var(--primary)',
      isStrategic: false,
      parentFolderId: parentId,
      sections: type === 'list' ? [{ id: 'actions', title: 'Завдання' }] : []
    });
    
    if (parentId) {
      const next = new Set(expandedNodes);
      next.add(parentId);
      setExpandedNodes(next);
    }
  };

  const renderRecursiveLists = (parentId: string | undefined, level: number) => {
    const children = projects.filter(p => 
      p.parentFolderId === parentId && 
      (p.type === 'folder' || p.type === 'list' || !p.type) && 
      p.description !== 'FOLDER_NOTE' &&
      p.description !== 'SYSTEM_PLANNER_CONFIG'
    );
    if (children.length === 0) return null;

    return (
      <div className={`mt-0.5 space-y-0.5 ${level === 0 ? 'ml-1' : 'ml-2 border-l border-[var(--border-color)] pl-1'}`}>
        {children.map(p => {
          const isFolder = p.type === 'folder';
          const isExpanded = expandedNodes.has(p.id);
          return (
            <div key={p.id} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={(e) => { e.stopPropagation(); handleGlobalDrop(e, `proj_${p.id}`); }}>
              <div 
                className="group/item flex items-center gap-1 px-1.5 py-1 rounded text-[8px] font-bold text-[var(--text-muted)] hover:bg-black/5 transition-all truncate cursor-pointer"
                onClick={() => {
                  if (isFolder) toggleNode(p.id);
                  else setActiveTab('lists');
                }}
              >
                <i className={`fa-solid ${isFolder ? (isExpanded ? 'fa-chevron-down' : 'fa-chevron-right') : 'fa-file-lines'} opacity-40 w-3 text-center`}></i>
                <i className={`fa-solid ${isFolder ? (isExpanded ? 'fa-folder-open' : 'fa-folder') : 'fa-folder'} opacity-40 text-[9px]`}></i>
                <span className="truncate flex-1 uppercase tracking-tight">{p.name}</span>
                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  {isFolder && (
                    <button onClick={(e) => handleSidebarCreate('list', p.id, e)} className="hover:text-[var(--primary)]"><i className="fa-solid fa-plus"></i></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити?')) deleteProject(p.id); }} className="hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
                </div>
              </div>
              {isExpanded && renderRecursiveLists(p.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMenuItem = (item: any) => {
    if (sidebarSettings && sidebarSettings[item.id] === false) return null;
    const isActive = activeTab === item.id;
    const isLists = item.id === 'lists';
    
    return (
      <div 
        key={item.id} 
        onDragOver={isLists ? handleDragOverLists : (e) => e.preventDefault()} 
        onDrop={(e) => handleGlobalDrop(e, item.id)} 
        className="relative group px-1"
      >
        <div className="flex items-center">
          <button 
            onClick={() => setActiveTab(item.id)} 
            className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isActive ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
          >
            <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-white' : ''}`}><i className={`fa-solid ${item.icon}`}></i></span>
            {!isSidebarCollapsed && (
              <><span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
                {counts[item.id] > 0 && <span className={`h-3.5 min-w-[14px] flex items-center justify-center rounded-full text-[7px] font-black px-1 ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[var(--text-muted)]'}`}>{counts[item.id]}</span>}</>
            )}
          </button>
          {isLists && !isSidebarCollapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsListsExpanded(!isListsExpanded); }}
              className={`w-6 h-8 flex items-center justify-center text-[8px] transition-all ${isListsExpanded ? 'rotate-180 text-[var(--primary)]' : 'text-muted opacity-40'}`}
            >
              <i className="fa-solid fa-chevron-up"></i>
            </button>
          )}
        </div>
        {isLists && !isSidebarCollapsed && isListsExpanded && renderRecursiveLists(undefined, 0)}
      </div>
    );
  };

  return (
    <>
      <div className={`${isSidebarCollapsed ? 'w-14' : 'w-48'} hidden md:flex bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shrink-0`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="text-xl font-black font-heading text-[var(--primary)] flex items-center gap-2 tracking-tighter leading-none">
               <span>12TR</span>
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center gap-1">
            {user && (
              <button onClick={syncData} disabled={isSyncing} className={`w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all ${isSyncing ? 'animate-spin text-[var(--primary)] bg-[var(--primary)]/5' : ''}`}>
                <i className="fa-solid fa-rotate text-[10px]"></i>
              </button>
            )}
            <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-xl hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
              <i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'} text-[10px]`}></i>
            </button>
          </div>
        </div>
        
        {!isSidebarCollapsed && (
          <div className="px-4 py-2 mb-2">
             <div className="flex items-center gap-3 bg-black/5 p-2 rounded-2xl border border-[var(--border-color)] relative group/user">
                <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Guest'}`} className="w-8 h-8 rounded-xl border border-[var(--bg-card)] shadow-sm" />
                <div className="flex-1 min-w-0">
                   <div className="text-[9px] font-black uppercase truncate text-[var(--text-main)]">{user?.displayName || 'Мандрівник'}</div>
                   {user ? (
                     <button onClick={logout} className="text-[7px] font-black uppercase text-rose-500 hover:underline">Вийти</button>
                   ) : (
                     <button onClick={() => setIsAuthModalOpen(true)} className="text-[7px] font-black uppercase text-[var(--primary)] hover:underline">Увійти</button>
                   )}
                </div>
             </div>
          </div>
        )}

        {!isSidebarCollapsed && (
          <div className="px-4 mb-4">
            <MiniCalendar />
          </div>
        )}

        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto no-scrollbar pl-0.5">
          {primaryItems.map(renderMenuItem)}
          <div className="my-3 mx-4 border-t border-[var(--border-color)] opacity-50"></div>
          {!isSidebarCollapsed && <div className="px-4 mb-1"><span className="text-[7px] uppercase font-black tracking-widest text-[var(--text-muted)] opacity-50">Toolbox</span></div>}
          {widgetItems.map(renderMenuItem)}
        </nav>
        
        <div className="px-1 py-4 border-t border-[var(--border-color)] space-y-0.5">
          {bottomItems.map(renderMenuItem)}
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:bg-black/5'}`}>
            <span className="w-4 flex justify-center text-[10px]"><i className="fa-solid fa-gear"></i></span>
            {!isSidebarCollapsed && <span className="font-black text-[9px] tracking-widest uppercase">Опції</span>}
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-card)]/90 backdrop-blur-xl border-t border-[var(--border-color)] z-[210] flex items-center justify-around px-4 pb-safe transition-colors duration-300">
         {[
           { id: 'today', icon: 'fa-star', label: 'Сьогодні' },
           { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні' },
           { id: 'lists', icon: 'fa-folder-tree', label: 'Списки' },
           { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
           { id: 'menu', icon: 'fa-grid-2', label: 'Меню', isMenuTrigger: true }
         ].map(item => (
           <button 
             key={item.id} 
             onClick={() => {
                if (item.isMenuTrigger) {
                  setShowMobileMenu(!showMobileMenu);
                } else {
                  setActiveTab(item.id);
                  setShowMobileMenu(false); // Закриваємо меню при натисканні на пункт нижнього бару
                }
             }} 
             className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${!item.isMenuTrigger && activeTab === item.id ? 'text-[var(--primary)] bg-black/5' : 'text-[var(--text-muted)]'}`}
           >
             <i className={`fa-solid ${item.isMenuTrigger ? 'fa-table-cells-large' : item.icon} text-lg mb-0.5`}></i>
             <span className="text-[6px] font-black uppercase tracking-tighter">{item.label}</span>
           </button>
         ))}
      </div>

      {showMobileMenu && (
        <div className="fixed top-0 left-0 right-0 bottom-16 z-[200] bg-[var(--bg-main)] md:hidden animate-in fade-in slide-in-from-bottom duration-300 flex flex-col">
           <header className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-[var(--primary)] shadow-sm">
                    {user ? (
                      <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Guest'}`} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <i className="fa-solid fa-user-ninja"></i>
                    )}
                 </div>
                 <div className="flex flex-col">
                    <Typography variant="h2" className="text-xl leading-none mb-1">{user?.displayName || 'Мандрівник'}</Typography>
                    {user ? (
                      <button onClick={logout} className="text-[9px] font-black uppercase text-rose-500 text-left">Вийти</button>
                    ) : (
                      <button onClick={() => setIsAuthModalOpen(true)} className="text-[9px] font-black uppercase text-[var(--primary)] text-left">Увійти в хмару</button>
                    )}
                 </div>
              </div>
              <div className="flex gap-2">
                 {user && (
                    <button 
                       onClick={syncData} 
                       disabled={isSyncing}
                       className={`w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all ${isSyncing ? 'animate-spin text-[var(--primary)]' : ''}`}
                       title="Синхронізувати"
                    >
                       <i className="fa-solid fa-rotate text-lg"></i>
                    </button>
                 )}
                 <button 
                    onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }} 
                    className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
                 >
                    <i className="fa-solid fa-gear text-lg"></i>
                 </button>
                 <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-[var(--text-muted)]"><i className="fa-solid fa-xmark text-lg"></i></button>
              </div>
           </header>
           <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-main)]">
              <div className="grid grid-cols-3 gap-4 pb-10">
                 {primaryItems.concat(widgetItems).concat(bottomItems).map(item => {
                   if (sidebarSettings && sidebarSettings[item.id] === false) return null;
                   // Виключаємо ті розділи, що вже є в нижньому барі
                   if (['today', 'inbox', 'lists', 'calendar'].includes(item.id)) return null;
                   
                   const isActive = activeTab === item.id;
                   return (
                     <button 
                        key={item.id} 
                        onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }} 
                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${isActive ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-xl' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] shadow-sm'}`}
                     >
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${isActive ? 'bg-white/10' : 'bg-black/5'}`}><i className={`fa-solid ${item.icon} text-lg`}></i></div>
                       <span className="text-[8px] font-black uppercase text-center leading-tight">{item.label}</span>
                     </button>
                   );
                 })}
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
