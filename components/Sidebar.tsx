
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, updateTask, scheduleTask, toggleTaskStatus, 
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings, theme
  } = useApp();
  
  const primaryItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні', acceptDrop: true },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
  ];

  const widgetItems = [
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'people', icon: 'fa-user-ninja', label: 'Люди' },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
    { id: 'hobbies', icon: 'fa-masks-theater', label: 'Хобі' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Герой' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово', acceptDrop: true },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
  ];

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (targetId) {
      case 'today': scheduleTask(taskId, new Date().setHours(0,0,0,0)); break;
      case 'inbox': updateTask({ ...task, status: TaskStatus.INBOX, scheduledDate: undefined, projectId: undefined, category: 'unsorted', isDeleted: false }); break;
      case 'next_actions': updateTask({ ...task, status: TaskStatus.NEXT_ACTION, isDeleted: false }); break;
      case 'notes': updateTask({ ...task, category: 'note', status: TaskStatus.INBOX, isDeleted: false }); break;
      case 'completed': if (task.status !== TaskStatus.DONE) toggleTaskStatus(task); break;
      case 'trash': updateTask({ ...task, isDeleted: true }); break;
    }
  };

  const renderMenuItem = (item: any) => {
    if (sidebarSettings[item.id] === false) return null;
    const isActive = activeTab === item.id;
    
    return (
      <div key={item.id} onDragOver={(e) => { e.preventDefault(); item.acceptDrop && setDropTargetId(item.id); }} onDragLeave={() => setDropTargetId(null)} onDrop={(e) => handleGlobalDrop(e, item.id)} className={`relative group px-1 ${dropTargetId === item.id ? 'scale-105 z-20' : ''}`}>
        <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isActive ? 'bg-[var(--primary)] text-white shadow-md' : dropTargetId === item.id ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'}`}>
          <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-white' : ''}`}><i className={`fa-solid ${item.icon}`}></i></span>
          {!isSidebarCollapsed && (
            <><span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
              {counts[item.id] > 0 && <span className={`h-3.5 min-w-[14px] flex items-center justify-center rounded-full text-[7px] font-black px-1 ${isActive ? 'bg-white/20' : 'bg-[var(--border-color)]'}`}>{counts[item.id]}</span>}</>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-14' : 'w-48'} hidden md:flex bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shrink-0`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && <div className="text-xl font-black text-[var(--primary)] flex items-center gap-2 tracking-tighter leading-none"><span>12TR</span></div>}
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-xl hover:bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)]"><i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i></button>
        </div>
        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto custom-scrollbar pl-0.5">
          {primaryItems.map(renderMenuItem)}
          <div className="my-3 mx-4 border-t border-[var(--border-color)] opacity-50"></div>
          {!isSidebarCollapsed && <div className="px-4 mb-1"><span className="text-[7px] uppercase font-black tracking-widest text-[var(--text-muted)]">Toolbox</span></div>}
          {widgetItems.map(renderMenuItem)}
        </nav>
        <div className="px-1 py-4 border-t border-[var(--border-color)] space-y-0.5">
          {bottomItems.map(renderMenuItem)}
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'}`}
          >
            <span className={`w-4 flex justify-center text-[10px] ${activeTab === 'settings' ? 'text-white' : ''}`}><i className="fa-solid fa-gear"></i></span>
            {!isSidebarCollapsed && <span className="font-black text-[9px] tracking-widest uppercase">Опції</span>}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--bg-sidebar)]/90 backdrop-blur-lg border-t border-[var(--border-color)] z-50 flex items-center justify-around px-2">
         {[primaryItems[0], primaryItems[2], widgetItems[1], widgetItems[2], widgetItems[3]].map(item => (
           <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === item.id ? 'text-[var(--primary)] bg-[var(--primary)]/5' : 'text-[var(--text-muted)]'}`}
           >
             <i className={`fa-solid ${item.icon} text-sm mb-0.5`}></i>
             <span className="text-[6px] font-black uppercase tracking-tighter">{item.label}</span>
           </button>
         ))}
         <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'settings' ? 'text-[var(--primary)] bg-[var(--primary)]/5' : 'text-[var(--text-muted)]'}`}
          >
            <i className="fa-solid fa-ellipsis text-sm"></i>
            <span className="text-[6px] font-black uppercase">Опції</span>
          </button>
      </div>
    </>
  );
};

export default Sidebar;
