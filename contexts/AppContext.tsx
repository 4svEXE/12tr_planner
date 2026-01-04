
import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Task, Project, Character, Tag, TaskStatus, Priority, TwelveWeekYear, ProjectSection, HabitDayData, DiaryEntry, InboxCategory } from '../types';
import { saveState, loadState } from '../store';

interface AppContextType {
  tasks: Task[];
  projects: Project[];
  cycle: TwelveWeekYear;
  character: Character;
  tags: Tag[];
  diary: DiaryEntry[];
  inboxCategories: InboxCategory[];
  activeTab: string;
  detailsWidth: number;
  setDetailsWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  addTask: (title: string, category?: string) => void;
  addProject: (project: Omit<Project, 'id' | 'progress' | 'status'>) => void;
  updateTask: (task: Task) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  deleteTask: (taskId: string) => void;
  moveTaskToCategory: (taskId: string, category: string, isPinned?: boolean) => void;
  moveTaskToProjectSection: (taskId: string, section: ProjectSection) => void;
  setProjectParent: (projectId: string, parentId: string | undefined) => void;
  scheduleTask: (taskId: string, date: number | undefined) => void;
  toggleTaskStatus: (task: Task) => void;
  toggleHabitStatus: (habitId: string, dateStr: string, status?: 'completed' | 'skipped' | 'none', note?: string) => void;
  toggleTaskPin: (taskId: string) => void;
  undoLastAction: () => void;
  pendingUndo: boolean;
  addTag: (name: string) => Tag;
  renameTag: (oldName: string, newName: string) => void;
  deleteTag: (tagName: string) => void;
  // Diary methods
  saveDiaryEntry: (date: string, content: string) => void;
  deleteDiaryEntry: (id: string) => void;
  // Inbox category methods
  addInboxCategory: (title: string) => void;
  updateInboxCategory: (id: string, updates: Partial<InboxCategory>) => void;
  deleteInboxCategory: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_INBOX_CATEGORIES: InboxCategory[] = [
  { id: 'pinned', title: 'Закріплено', icon: 'fa-thumbtack', isPinned: true },
  { id: 'unsorted', title: 'Несортовано', icon: 'fa-box-open', isPinned: false },
  { id: 'tasks', title: 'Завдання', icon: 'fa-check-to-slot', isPinned: false },
  { id: 'notes', title: 'Нотатки', icon: 'fa-note-sticky', isPinned: false },
  { id: 'hypothesis', title: 'Гіпотези', icon: 'fa-flask', isPinned: false },
  { id: 'useful', title: 'Корисне', icon: 'fa-bookmark', isPinned: false },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedState = loadState();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [detailsWidth, setDetailsWidth] = useState(savedState?.detailsWidth || 450);
  
  const [cycle, setCycle] = useState<TwelveWeekYear>(savedState?.cycle || {
    id: 'c1',
    startDate: Date.now() - (1000 * 60 * 60 * 24 * 25),
    endDate: Date.now() + (1000 * 60 * 60 * 24 * 59),
    currentWeek: 4,
    globalExecutionScore: 78
  });

  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks || []);
  const [diary, setDiary] = useState<DiaryEntry[]>(savedState?.diary || []);
  const [inboxCategories, setInboxCategories] = useState<InboxCategory[]>(savedState?.inboxCategories || DEFAULT_INBOX_CATEGORIES);
  const [projects, setProjects] = useState<Project[]>(savedState?.projects || []);
  const [tags, setTags] = useState<Tag[]>(savedState?.tags || []);
  const [character, setCharacter] = useState<Character>(savedState?.character || {
    name: 'Тален',
    race: 'Elf',
    level: 4,
    xp: 2450,
    gold: 152,
    bio: 'Розробник, що шукає шлях до ультимативної ефективності та потоку.',
    goals: ['Побудувати найкращий у світі двигун життя'],
    views: ['Простота — це найвища витонченість'],
    stats: { health: 85, wealth: 42, wisdom: 68, social: 30 }
  });

  useEffect(() => {
    saveState({ tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth });
  }, [tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth]);

  const [undoInfo, setUndoInfo] = useState<{ taskId: string, prevStatus: TaskStatus } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const addTask = useCallback((title: string, categoryId: string = 'tasks') => {
    const isPinnedCategory = inboxCategories.find(c => c.id === categoryId)?.isPinned || false;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      status: TaskStatus.INBOX,
      priority: Priority.NUI,
      difficulty: 1,
      xp: 50,
      tags: [],
      createdAt: Date.now(),
      category: categoryId,
      isPinned: isPinnedCategory,
      habitHistory: {}
    };
    setTasks(prev => [newTask, ...prev]);
  }, [inboxCategories]);

  const addInboxCategory = useCallback((title: string) => {
    const newCat: InboxCategory = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      icon: 'fa-folder',
      isPinned: false
    };
    setInboxCategories(prev => [...prev, newCat]);
  }, []);

  const updateInboxCategory = useCallback((id: string, updates: Partial<InboxCategory>) => {
    setInboxCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteInboxCategory = useCallback((id: string) => {
    if (['tasks', 'pinned', 'unsorted'].includes(id)) return;
    setInboxCategories(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.map(t => t.category === id ? { ...t, category: 'unsorted' } : t));
  }, []);

  const saveDiaryEntry = useCallback((date: string, content: string) => {
    setDiary(prev => {
      const existing = prev.find(e => e.date === date);
      if (existing) {
        return prev.map(e => e.date === date ? { ...e, content, updatedAt: Date.now() } : e);
      }
      return [{
        id: Math.random().toString(36).substr(2, 9),
        date,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, ...prev];
    });
  }, []);

  const deleteDiaryEntry = useCallback((id: string) => {
    setDiary(prev => prev.filter(e => e.id !== id));
  }, []);

  const toggleHabitStatus = useCallback((habitId: string, dateStr: string, requestedStatus?: 'completed' | 'skipped' | 'none', note?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === habitId) {
        const history = { ...(t.habitHistory || {}) };
        const currentData = history[dateStr] || { status: 'none' };
        
        let newStatus: 'completed' | 'skipped' | 'none';
        if (requestedStatus !== undefined) {
          newStatus = requestedStatus;
        } else {
          newStatus = currentData.status === 'completed' ? 'none' : 'completed';
        }
        
        const newData: HabitDayData = { 
          status: newStatus, 
          note: note !== undefined ? note : currentData.note 
        };
        
        history[dateStr] = newData;
        
        if (newStatus === 'completed' && currentData.status !== 'completed') {
           setCharacter(c => ({ ...c, xp: c.xp + (t.xp || 10) }));
        } else if (newStatus !== 'completed' && currentData.status === 'completed') {
           setCharacter(c => ({ ...c, xp: Math.max(0, c.xp - (t.xp || 10)) }));
        }

        return { ...t, habitHistory: history };
      }
      return t;
    }));
  }, []);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'progress' | 'status'>) => {
    const newProject: Project = {
      ...projectData,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'active',
      executionScore: projectData.isStrategic ? 0 : undefined
    };
    setProjects(prev => [newProject, ...prev]);
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updatedTask.id);
      if (exists) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      }
      return [updatedTask, ...prev];
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    // Move tasks to 'unsorted' or remove their project association
    setTasks(prev => prev.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t));
  }, []);

  const moveTaskToCategory = useCallback((taskId: string, category: string, isPinned?: boolean) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          category: category, 
          isPinned: isPinned !== undefined ? isPinned : t.isPinned 
        };
      }
      return t;
    }));
  }, []);

  const moveTaskToProjectSection = useCallback((taskId: string, section: ProjectSection) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, projectSection: section } : t));
  }, []);

  const setProjectParent = useCallback((projectId: string, parentId: string | undefined) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, parentFolderId: parentId } : p));
  }, []);

  const scheduleTask = useCallback((taskId: string, date: number | undefined) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, scheduledDate: date } : t));
  }, []);

  const toggleTaskStatus = useCallback((task: Task) => {
    const isNowDone = task.status !== TaskStatus.DONE;
    const newStatus = isNowDone ? TaskStatus.DONE : TaskStatus.INBOX;
    
    if (newStatus === TaskStatus.DONE) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoInfo({ taskId: task.id, prevStatus: task.status });
      undoTimerRef.current = window.setTimeout(() => setUndoInfo(null), 5000);
      setCharacter(prev => ({
        ...prev,
        xp: prev.xp + (task.xp || 50),
        gold: prev.gold + Math.floor((task.xp || 50) / 10)
      }));
    } else {
      setCharacter(prev => ({
        ...prev,
        xp: Math.max(0, prev.xp - (task.xp || 50)),
        gold: Math.max(0, prev.gold - Math.floor((task.xp || 50) / 10))
      }));
    }
    updateTask({ ...task, status: newStatus });
  }, [updateTask]);

  const toggleTaskPin = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newPinned = !t.isPinned;
        let newCategory = t.category;
        if (newPinned && t.category !== 'pinned') newCategory = 'pinned';
        else if (!newPinned && t.category === 'pinned') newCategory = 'unsorted';
        
        return { ...t, isPinned: newPinned, category: newCategory };
      }
      return t;
    }));
  }, []);

  const undoLastAction = useCallback(() => {
    if (undoInfo) {
      setTasks(prev => prev.map(t => {
        if (t.id === undoInfo.taskId) {
          setCharacter(cp => ({
            ...cp,
            xp: Math.max(0, cp.xp - (t.xp || 50)),
            gold: Math.max(0, cp.gold - Math.floor((t.xp || 50) / 10))
          }));
          return { ...t, status: undoInfo.prevStatus };
        }
        return t;
      }));
      setUndoInfo(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }
  }, [undoInfo]);

  const addTag = useCallback((name: string) => {
    const cleanName = name.toLowerCase().replace('#', '').trim();
    if (!cleanName) return { id: '', name: '', color: '' };
    const existing = tags.find(t => t.name === cleanName);
    if (existing) return existing;
    const colors = ['#06b6d4', '#f43f5e', '#fbbf24', '#a855f7', '#10b981', '#f97316', '#6366f1'];
    const newTag: Tag = {
      id: Math.random().toString(36).substr(2, 9),
      name: cleanName,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setTags(prev => [...prev, newTag]);
    return newTag;
  }, [tags]);

  const renameTag = useCallback((oldName: string, newName: string) => {
    const cleanOld = oldName.toLowerCase().trim();
    const cleanNew = newName.toLowerCase().replace('#', '').trim();
    if (!cleanNew || cleanOld === cleanNew) return;
    setTags(prev => prev.map(t => t.name === cleanOld ? { ...t, name: cleanNew } : t));
    setTasks(prev => prev.map(task => ({
      ...task,
      tags: task.tags.includes(cleanOld) ? task.tags.map(tag => tag === cleanOld ? cleanNew : tag) : task.tags
    })));
  }, []);

  const deleteTag = useCallback((tagName: string) => {
    const cleanName = tagName.toLowerCase().trim();
    setTags(prev => prev.filter(t => t.name !== cleanName));
    setTasks(prev => prev.map(task => ({
      ...task,
      tags: task.tags.filter(tag => tag !== cleanName)
    })));
  }, []);

  const value = useMemo(() => ({
    tasks, projects, cycle, character, tags, diary, inboxCategories, activeTab, setActiveTab,
    detailsWidth, setDetailsWidth,
    addTask, addProject, updateTask, updateProject, deleteProject, deleteTask, moveTaskToCategory, moveTaskToProjectSection, setProjectParent, scheduleTask, toggleTaskStatus, toggleHabitStatus, toggleTaskPin, undoLastAction,
    saveDiaryEntry, deleteDiaryEntry, addInboxCategory, updateInboxCategory, deleteInboxCategory,
    pendingUndo: !!undoInfo,
    addTag, renameTag, deleteTag
  }), [tasks, projects, cycle, character, tags, diary, inboxCategories, activeTab, detailsWidth, undoInfo]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
