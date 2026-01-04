
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { tasks, updateTask, scheduleTask, toggleTaskStatus } = useApp();
  
  const [mainItems, setMainItems] = useState([
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта світу' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Глибокий фокус' },
    { id: 'finances', icon: 'fa-coins', label: 'Фінанси' },
    { id: 'contacts', icon: 'fa-users-between-lines', label: 'Нетворкінг' },
    { id: 'character', icon: 'fa-user-shield', label: 'Профіль героя' },
  ]);

  const [bottomItems, setBottomItems] = useState([
    { id: 'completed', icon: 'fa-check-double', label: 'Завершено', acceptDrop: true },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Хештеги' },
  ]);

  const [draggedSidebarIndex, setDraggedSidebarIndex] = useState<{ section: 'main' | 'bottom', index: number } | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const onDragStartSidebar = (section: 'main' | 'bottom', index: number) => {
    setDraggedSidebarIndex({ section, index });
  };

  const onDragOverSidebar = (e: React.DragEvent, itemId: string, canAccept: boolean) => {
    e.preventDefault();
    if (canAccept) {
      setDropTargetId(itemId);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    
    // Check if it's a sidebar reorder
    if (draggedSidebarIndex) {
      const targetSection = mainItems.some(i => i.id === targetId) ? 'main' : 'bottom';
      if (draggedSidebarIndex.section !== targetSection) return;

      const items = targetSection === 'main' ? [...mainItems] : [...bottomItems];
      const targetIndex = items.findIndex(i => i.id === targetId);
      
      const [removed] = items.splice(draggedSidebarIndex.index, 1);
      items.splice(targetIndex, 0, removed);

      if (targetSection === 'main') setMainItems(items);
      else setBottomItems(items);
      setDraggedSidebarIndex(null);
      return;
    }

    // Handle task drop
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (targetId) {
      case 'today':
        const today = new Date();
        today.setHours(0,0,0,0);
        scheduleTask(taskId, today.getTime());
        break;
      case 'inbox':
        updateTask({ 
          ...task, 
          status: TaskStatus.INBOX, 
          scheduledDate: undefined, 
          projectId: undefined, 
          category: 'unsorted' 
        });
        break;
      case 'notes':
        updateTask({ ...task, category: 'note', status: TaskStatus.INBOX });
        break;
      case 'completed':
        if (task.status !== TaskStatus.DONE) {
          toggleTaskStatus(task);
        }
        break;
      default:
        break;
    }
  };

  const renderMenuItem = (item: any, section: 'main' | 'bottom', index: number) => (
    <div
      key={item.id}
      draggable
      onDragStart={() => onDragStartSidebar(section, index)}
      onDragOver={(e) => onDragOverSidebar(e, item.id, !!item.acceptDrop || !!draggedSidebarIndex)}
      onDragLeave={() => setDropTargetId(null)}
      onDrop={(e) => handleGlobalDrop(e, item.id)}
      className={`relative group ${draggedSidebarIndex?.section === section && draggedSidebarIndex?.index === index ? 'dragging' : ''} ${
        dropTargetId === item.id ? 'scale-105 z-20' : ''
      }`}
    >
      <button
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg transition-all ${
          activeTab === item.id 
            ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm font-bold' 
            : dropTargetId === item.id
              ? 'bg-orange-600 text-white shadow-lg ring-4 ring-orange-100'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-5 flex justify-center text-sm ${activeTab === item.id ? 'text-orange-600' : dropTargetId === item.id ? 'text-white' : ''}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </span>
          <span className="hidden md:inline font-medium text-[11px] tracking-tight">{item.label}</span>
        </div>
        
        {counts[item.id] !== undefined && counts[item.id] > 0 && dropTargetId !== item.id && (
          <span className={`hidden md:flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold px-1 border ${
            activeTab === item.id ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {counts[item.id]}
          </span>
        )}
      </button>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab px-0.5 pointer-events-none">
        <i className="fa-solid fa-grip-vertical text-[8px] text-slate-300"></i>
      </div>
    </div>
  );

  return (
    <div className="w-16 md:w-56 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 transition-none">
      <div className="p-4 text-xl font-bold font-heading text-orange-600 flex items-center gap-2">
        <i className="fa-solid fa-bolt-lightning text-pink-500 text-base"></i>
        <span className="hidden md:inline">12TR</span>
      </div>
      
      <nav className="flex-1 px-2 space-y-0.5 py-2 overflow-y-auto custom-scrollbar transition-none">
        {mainItems.map((item, index) => renderMenuItem(item, 'main', index))}
      </nav>

      <div className="px-2 py-2 border-t border-slate-100 space-y-0.5 transition-none">
        <div className="px-3 mb-1 hidden md:block">
          <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-slate-400">Архів та мітки</span>
        </div>
        {bottomItems.map((item, index) => renderMenuItem(item, 'bottom', index))}
      </div>

      <div className="p-3 border-t border-slate-100 transition-none">
        <div className="bg-orange-50/50 rounded-lg p-2 hidden md:block border border-orange-100 text-center">
          <p className="text-[9px] text-orange-400 mb-1 uppercase tracking-widest font-bold">Ref Code: 12TR-PRO</p>
          <button className="text-[9px] w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-1 rounded shadow-sm">Unlock Unlimited</button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
