
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
  sidebarSettings: Record<string, boolean>;
  isSidebarCollapsed: boolean;
  aiEnabled: boolean;
  setDetailsWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiEnabled: (enabled: boolean) => void;
  updateSidebarSetting: (key: string, visible: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addTask: (title: string, category?: string, projectId?: string, projectSection?: ProjectSection) => void;
  addProject: (project: Omit<Project, 'id' | 'progress' | 'status'>) => void;
  updateTask: (task: Task) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  deleteTask: (taskId: string, permanent?: boolean) => void;
  restoreTask: (taskId: string) => void;
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
  saveDiaryEntry: (date: string, content: string) => void;
  deleteDiaryEntry: (id: string) => void;
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

const INITIAL_MOCK_PROJECTS: Project[] = [
  { id: 'dreams', name: 'Мрії', color: '#a855f7', isStrategic: false, status: 'active', progress: 0, description: 'FOLDER_NOTE' },
  { id: 'ideas', name: 'Ідеї', color: '#fbbf24', isStrategic: false, status: 'active', progress: 0, description: 'FOLDER_NOTE' },
  { id: 'achievements', name: 'Ачівки', color: '#10b981', isStrategic: false, status: 'active', progress: 0, description: 'FOLDER_NOTE' },
  { id: 'someday', name: 'Можливо колись', color: '#64748b', isStrategic: false, status: 'active', progress: 0, description: 'FOLDER_NOTE' },
  { id: 'p1', name: 'Запуск AI Асистента', color: '#f97316', isStrategic: true, status: 'active', progress: 45, kpiTitle: 'Реалізація функцій', kpiTarget: 10, kpiCurrent: 4, kpiUnit: 'модулів', executionScore: 68 },
  { id: 'p1_sub1', name: 'Фронтенд ядро', color: '#f97316', parentFolderId: 'p1', isStrategic: false, status: 'active', progress: 80 },
];

const INITIAL_MOCK_TASKS: Task[] = [
  { id: 'in1', title: 'Оплатити рахунки за інтернет', category: 'tasks', status: TaskStatus.INBOX, priority: Priority.UI, difficulty: 1, xp: 20, tags: ['life'], createdAt: Date.now(), habitHistory: {} },
  { id: 'na1', title: 'Зателефонувати постачальнику', status: TaskStatus.NEXT_ACTION, priority: Priority.UI, difficulty: 1, xp: 50, tags: ['work'], createdAt: Date.now(), habitHistory: {} },
  { id: 'h1', title: 'Ранкова йога', status: TaskStatus.INBOX, priority: Priority.NUI, projectSection: 'habits', tags: ['habit', 'health'], difficulty: 2, xp: 30, createdAt: Date.now(), recurrence: 'daily', habitHistory: { '2024-05-20': { status: 'completed' }, '2024-05-21': { status: 'completed' } } },
  { id: 'pt1', title: 'Налаштувати Redux Store', projectId: 'p1_sub1', projectSection: 'actions', status: TaskStatus.INBOX, priority: Priority.UI, difficulty: 2, xp: 100, tags: ['code'], createdAt: Date.now(), habitHistory: {} },
];

const INITIAL_DIARY: DiaryEntry[] = [
  { id: 'de1', date: new Date().toISOString().split('T')[0], content: '# Чудовий ранок\nСьогодні я почав день з медитації. Відчуваю приплив енергії!', createdAt: Date.now(), updatedAt: Date.now() },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedState = loadState();

  const [activeTab, setActiveTab] = useState('today');
  const [detailsWidth, setDetailsWidth] = useState(savedState?.detailsWidth || 450);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(savedState?.isSidebarCollapsed || false);
  const [sidebarSettings, setSidebarSettings] = useState<Record<string, boolean>>(savedState?.sidebarSettings || {});
  const [aiEnabled, setAiEnabled] = useState<boolean>(savedState?.aiEnabled || false);
  
  const [cycle, setCycle] = useState<TwelveWeekYear>(savedState?.cycle || {
    id: 'c1',
    startDate: Date.now() - (1000 * 60 * 60 * 24 * 25),
    endDate: Date.now() + (1000 * 60 * 60 * 24 * 59),
    currentWeek: 4,
    globalExecutionScore: 78
  });

  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks && savedState.tasks.length > 0 ? savedState.tasks : INITIAL_MOCK_TASKS);
  const [diary, setDiary] = useState<DiaryEntry[]>(savedState?.diary && savedState.diary.length > 0 ? savedState.diary : INITIAL_DIARY);
  const [inboxCategories, setInboxCategories] = useState<InboxCategory[]>(savedState?.inboxCategories || DEFAULT_INBOX_CATEGORIES);
  const [projects, setProjects] = useState<Project[]>(savedState?.projects && savedState.projects.length > 0 ? savedState.projects : INITIAL_MOCK_PROJECTS);
  const [tags, setTags] = useState<Tag[]>(savedState?.tags || []);
  const [character, setCharacter] = useState<Character>(savedState?.character || {
    name: 'Тален',
    race: 'Elf',
    archetype: 'Strategist',
    level: 4,
    xp: 2450,
    gold: 152,
    bio: 'Розробник, що шукає шлях до ультимативної ефективності та потоку.',
    vision: 'Побудувати найкращий у світі двигун життя, який допомагає мільйонам досягати цілей без вигорання.',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Talent',
    energy: 85,
    maxEnergy: 100,
    focus: 92,
    goals: ['Побудувати найкращий у світі двигун життя'],
    views: ['Простота — це найвища витонченість'],
    skills: [
      { name: 'Дисципліна', level: 5, xp: 450, icon: 'fa-shield-halved' },
      { name: 'Фокус', level: 7, xp: 720, icon: 'fa-bullseye' },
      { name: 'Комунікація', level: 3, xp: 120, icon: 'fa-comments' },
    ],
    achievements: [
      { id: 'a1', title: 'Рання пташка', description: '7 днів поспіль підйом о 6:00', icon: 'fa-sun', unlockedAt: Date.now() },
      { id: 'a2', title: 'Майстер фокусу', description: '100 годин глибокої роботи', icon: 'fa-brain' },
    ],
    stats: { health: 85, career: 42, finance: 68, education: 30, relationships: 55, rest: 40 }
  });

  useEffect(() => {
    saveState({ tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled });
  }, [tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled]);

  const [undoInfo, setUndoInfo] = useState<{ taskId: string, prevStatus: TaskStatus } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const updateCharacter = useCallback((updates: Partial<Character>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSidebarSetting = (key: string, visible: boolean) => {
    setSidebarSettings(prev => ({ ...prev, [key]: visible }));
  };

  const addTask = useCallback((title: string, categoryId: string = 'tasks', projectId?: string, projectSection: ProjectSection = 'actions') => {
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
      projectId: projectId,
      projectSection: projectSection,
      isPinned: isPinnedCategory,
      habitHistory: {},
      isDeleted: false
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

  const deleteTask = useCallback((taskId: string, permanent: boolean = false) => {
    setTasks(prev => {
      if (permanent) return prev.filter(t => t.id !== taskId);
      return prev.map(t => t.id === taskId ? { ...t, isDeleted: true } : t);
    });
  }, []);

  const restoreTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isDeleted: false } : t));
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
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
    detailsWidth, setDetailsWidth, sidebarSettings, isSidebarCollapsed, setSidebarCollapsed, updateSidebarSetting,
    aiEnabled, setAiEnabled, updateCharacter,
    addTask, addProject, updateTask, updateProject, deleteProject, deleteTask, restoreTask, moveTaskToCategory, moveTaskToProjectSection, setProjectParent, scheduleTask, toggleTaskStatus, toggleHabitStatus, toggleTaskPin, undoLastAction,
    saveDiaryEntry, deleteDiaryEntry, addInboxCategory, updateInboxCategory, deleteInboxCategory,
    pendingUndo: !!undoInfo,
    addTag, renameTag, deleteTag
  }), [tasks, projects, cycle, character, tags, diary, inboxCategories, activeTab, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, undoInfo, updateCharacter]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
