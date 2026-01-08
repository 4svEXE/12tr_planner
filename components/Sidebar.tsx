
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, ThemeType } from '../types';
import Typography from './ui/Typography';
import Button from './ui/Button';
import MiniCalendar from './sidebar/MiniCalendar';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, updateTask, scheduleTask, toggleTaskStatus, 
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings, updateSidebarSetting,
    theme, setTheme
  } = useApp();

  const primaryItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні дії', acceptDrop: true },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
  ];

  const widgetItems = [
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта світу' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Глибокий фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Профіль героя' },
    { id: 'people', icon: 'fa-users-between-lines', label: 'Люди' },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-clipboard-check', label: 'Завершено', acceptDrop: true },
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
      <div key={item.id} onDragOver={(e) => { e.preventDefault(); item.acceptDrop && setDropTargetId(item.id); }} onDragLeave={() => setDropTargetId(null)} onDrop={(e) => handleGlobalDrop(e, item.id)} className={`relative group mb-0.5 px-2 ${dropTargetId === item.id ? 'scale-105 z-20' : ''}`}>
        <button 
          onClick={() => setActiveTab(item.id)} 
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-600 font-black shadow-sm ring-1 ring-orange-100' : dropTargetId === item.id ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-[var(--sidebar-item-hover)] opacity-70 hover:opacity-100'}`}
        >
          <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-orange-600' : 'text-[var(--text-muted)]'}`}><i className={`fa-solid ${item.icon}`}></i></span>
          <span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
          {counts[item.id] > 0 && <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full text-[7px] font-black px-1 bg-[var(--border-color)] text-slate-500">{counts[item.id]}</span>}
        </button>
      </div>
    );
  };

  return (
    <>
      <div 
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
        className="hidden md:flex w-64 border-r border-[var(--border-color)] flex-col h-screen sticky top-0 z-40 transition-all shadow-sm shrink-0"
      >
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="text-xl font-black font-heading flex items-center gap-3 tracking-tighter text-[var(--text-main)]">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white text-sm shadow-lg shadow-orange-200">
               <i className="fa-solid fa-bolt-lightning"></i>
            </div>
            <span>12TR</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto custom-scrollbar no-scrollbar">
          {primaryItems.map(renderMenuItem)}
          <div className="my-4 mx-6 border-t border-[var(--border-color)] opacity-50"></div>
          <div className="px-6 mb-2"><span className="text-[8px] uppercase font-black tracking-[0.2em] text-[var(--text-muted)] opacity-40">Інструменти</span></div>
          {widgetItems.map(renderMenuItem)}
        </nav>

        <div className="py-4 border-t border-[var(--border-color)] opacity-80 shrink-0 bg-slate-50/30">
          <div className="px-4 mb-4">
             <MiniCalendar />
          </div>
          {bottomItems.map(renderMenuItem)}
          <div className="px-2 mt-2">
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-orange-50 text-orange-600 font-black shadow-sm ring-1 ring-orange-100' : 'text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-main)]'}`}
              >
                  <span className="w-4 flex justify-center text-xs"><i className="fa-solid fa-gear"></i></span>
                  <span className="font-black text-[9px] tracking-widest uppercase">Налаштування</span>
              </button>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-50 flex items-center justify-around px-2 pb-safe">
         {[primaryItems[0], primaryItems[2], widgetItems[1], widgetItems[2]].map(item => (
           <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${activeTab === item.id ? 'text-orange-600 bg-orange-50 font-black' : 'text-slate-400'}`}
           >
             <i className={`fa-solid ${item.icon} text-lg mb-1`}></i>
             <span className="text-[7px] font-black uppercase tracking-tight">{item.label}</span>
           </button>
         ))}
         <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${activeTab === 'settings' ? 'text-orange-600 bg-orange-50 font-black' : 'text-slate-400'}`}>
           <i className="fa-solid fa-gear text-lg mb-1"></i>
           <span className="text-[7px] font-black uppercase">Опції</span>
         </button>
      </div>
    </>
  );
};

export default Sidebar;
