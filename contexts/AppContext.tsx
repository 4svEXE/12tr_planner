
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Task, Project, Character, Tag, TaskStatus, Priority, TwelveWeekYear, ProjectSection, HabitDayData, DiaryEntry, InboxCategory, TimeBlock, RoutinePreset, ThemeType, ChecklistItem, ReportQuestion } from '../types';
import { saveState, loadState } from '../store';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

interface AppContextType {
  tasks: Task[];
  projects: Project[];
  cycle: TwelveWeekYear;
  character: Character;
  tags: Tag[];
  diary: DiaryEntry[];
  inboxCategories: InboxCategory[];
  timeBlocks: TimeBlock[];
  blockHistory: Record<string, Record<string, 'pending' | 'completed' | 'missed'>>;
  routinePresets: RoutinePreset[];
  activeTab: string;
  theme: ThemeType;
  detailsWidth: number;
  sidebarSettings: Record<string, boolean>;
  isSidebarCollapsed: boolean;
  aiEnabled: boolean;
  calendarDate: number;
  calendarViewMode: CalendarViewMode;
  reportTemplate: ReportQuestion[];
  setCalendarDate: (date: number) => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  setDetailsWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: ThemeType) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiEnabled: (enabled: boolean) => void;
  updateSidebarSetting: (key: string, visible: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addTask: (title: string, category?: string, projectId?: string, projectSection?: ProjectSection, isEvent?: boolean, scheduledDate?: number) => string;
  addProject: (project: Omit<Project, 'id' | 'progress' | 'status'>) => string;
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
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (block: TimeBlock) => void;
  deleteTimeBlock: (blockId: string) => void;
  setBlockStatus: (dateStr: string, blockId: string, status: 'pending' | 'completed' | 'missed') => void;
  saveRoutineAsPreset: (name: string, dayOfWeek: number) => void;
  applyRoutinePreset: (presetId: string, dayOfWeek: number) => void;
  addChecklistItem: (taskId: string, title: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  removeChecklistItem: (taskId: string, itemId: string) => void;
  updateReportTemplate: (newTemplate: ReportQuestion[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_REPORT_TEMPLATE: ReportQuestion[] = [
  { id: 'q1', text: 'Як твій день? (продуктивність, настрій)', page: 1 },
  { id: 'q2', text: 'Чи були ситуації, від яких я почувався не так, як зазвичай? (тривога, злість, несподіванка)', page: 1 },
  { id: 'q3', text: 'Які звички не виконав? чому? (мінімум 1)', page: 2 },
  { id: 'q4', text: 'За що і кому я вдячний?', page: 3 },
  { id: 'q5', text: 'За що вдячний собі?', page: 3 },
  { id: 'q6', text: 'Що було позитивного сьогодні?', page: 4 },
  { id: 'q7', text: 'Що не хочу терпіти / що змінив би?', page: 4 },
  { id: 'q8', text: 'Які можливості і ресурси у мене зараз є?', page: 5 },
  { id: 'q9', text: 'Як я можу вижати максимум з моєї ситуації?', page: 5 },
  { id: 'q10', text: 'Висновок дня:', page: 5 },
  { id: 'q11', text: 'Що лишнє в житті і побуті?', page: 6 },
  { id: 'q12', text: 'Як я спав? Що вплинуло на якість сну?', page: 6 },
  { id: 'q13', text: 'Чи ок калораж? чому?', page: 6 },
  { id: 'q14', text: 'Чи підготував їжу на завтра?', page: 6 },
];

const DEFAULT_INBOX_CATEGORIES: InboxCategory[] = [
  { id: 'pinned', title: 'Закріплено', icon: 'fa-thumbtack', isPinned: true },
  { id: 'unsorted', title: 'Вхідні', icon: 'fa-inbox', isPinned: false },
  { id: 'tasks', title: 'Завдання', icon: 'fa-check-to-slot', isPinned: false },
  { id: 'notes', title: 'Нотатки', icon: 'fa-note-sticky', isPinned: false },
];

const SEED_PROJECTS: Project[] = [
  { id: 'p1', name: 'Майстерність Frontend', description: 'Стати top-tier інженером', color: '#f97316', status: 'active', progress: 35, type: 'goal', isStrategic: true, executionScore: 78 },
  { id: 'p1_sub1', name: 'Gemini AI Integration', description: 'Впровадження ШІ функцій', color: '#f97316', status: 'active', progress: 60, type: 'subproject', parentFolderId: 'p1', isStrategic: false },
  { id: 'p2', name: 'Фізична Енергія', description: 'Спорт та здоровʼя', color: '#10b981', status: 'active', progress: 45, type: 'goal', isStrategic: true, executionScore: 92 },
  { id: 'p3', name: 'Капітал 100k', description: 'Фінансова незалежність', color: '#6366f1', status: 'active', progress: 12, type: 'goal', isStrategic: true, executionScore: 45 },
  { id: 'p4', name: 'Книга "Двигун Життя"', description: 'Написати чернетку методології', color: '#ec4899', status: 'active', progress: 5, type: 'goal', isStrategic: true, executionScore: 20 },
];

const today00 = new Date().setHours(0,0,0,0);
const now = Date.now();

const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Налаштувати Streaming API для Gemini', status: TaskStatus.NEXT_ACTION, priority: Priority.UI, difficulty: 3, xp: 150, tags: ['coding', 'ai'], createdAt: now, category: 'tasks', projectId: 'p1_sub1', projectSection: 'actions', habitHistory: {}, checklist: [] },
  { id: 't4', title: 'Скласти список ETF для портфеля', status: TaskStatus.NEXT_ACTION, priority: Priority.UNI, difficulty: 2, xp: 80, tags: ['finance'], createdAt: now, category: 'tasks', projectId: 'p3', projectSection: 'actions', habitHistory: {}, checklist: [] },
  { id: 't_sched_1', title: 'Зустріч по архітектурі ШІ', status: TaskStatus.INBOX, priority: Priority.UI, difficulty: 2, xp: 100, tags: ['meeting'], createdAt: now, category: 'tasks', projectId: 'p1_sub1', projectSection: 'actions', scheduledDate: now + 300000, habitHistory: {}, checklist: [] },
  { id: 'e1', title: 'Вебінар: Майбутнє LLM', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 40, tags: ['education'], createdAt: now, isEvent: true, scheduledDate: today00 + (18 * 3600000), habitHistory: {}, checklist: [] },
  { id: 't_inbox_1', title: 'Замінити масло в авто', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 2, xp: 50, tags: ['life'], createdAt: now, category: 'unsorted', habitHistory: {}, checklist: [] },
  { id: 't_inbox_2', title: 'Ідея: Гейміфікація щоденника', status: TaskStatus.INBOX, priority: Priority.NUNI, difficulty: 1, xp: 20, tags: ['ideas'], createdAt: now, category: 'unsorted', habitHistory: {}, checklist: [] },
  { id: 'h1', title: 'Ранкова йога 15хв', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 100, tags: ['habit', 'health'], createdAt: now, category: 'tasks', projectId: 'p2', projectSection: 'habits', habitHistory: { 
    [new Date(now - 86400000).toISOString().split('T')[0]]: { status: 'completed' },
    [new Date(now - 172800000).toISOString().split('T')[0]]: { status: 'completed' }
  }, checklist: [] },
  { id: 'h2', title: 'Читати 20 сторінок', status: TaskStatus.INBOX, priority: Priority.UNI, difficulty: 1, xp: 120, tags: ['habit', 'study'], createdAt: now, category: 'tasks', projectId: 'p4', projectSection: 'habits', habitHistory: {
    [new Date(now - 86400000).toISOString().split('T')[0]]: { status: 'completed' }
  }, checklist: [] },
  { id: 't2', title: 'Прочитати SDK Docs', status: TaskStatus.DONE, priority: Priority.UNI, difficulty: 1, xp: 50, tags: ['docs'], createdAt: now - 86400000, category: 'tasks', projectId: 'p1_sub1', projectSection: 'actions', habitHistory: {}, checklist: [] },
];

const SEED_TIME_BLOCKS: TimeBlock[] = [
  { id: 'b1', title: 'Глибока робота', startHour: 9, endHour: 12, type: 'work', color: '#f97316', dayOfWeek: new Date().getDay() },
  { id: 'b2', title: 'Обід та відпочинок', startHour: 13, endHour: 14, type: 'rest', color: '#10b981', dayOfWeek: new Date().getDay() },
  { id: 'b3', title: 'Тренування', startHour: 17, endHour: 18, type: 'work', color: '#6366f1', dayOfWeek: new Date().getDay() },
  { id: 'b4', title: 'Вечірнє рев\'ю', startHour: 21, endHour: 22, type: 'routine', color: '#ec4899', dayOfWeek: new Date().getDay() },
];

const SEED_DIARY: DiaryEntry[] = [
  { id: 'd1', date: new Date(now - 86400000).toISOString().split('T')[0], content: '# Підсумки дня\n\nСьогодні вдалося налаштувати базову структуру проєкту. **Gemini** працює стабільно. Потрібно більше уваги приділити UX.', createdAt: now - 86400000, updatedAt: now - 86400000 }
];

const SEED_TAGS: Tag[] = [
  { id: 'tag1', name: 'coding', color: '#dcfce7' },
  { id: 'tag2', name: 'finance', color: '#fee2e2' },
  { id: 'tag3', name: 'ai', color: '#e0e7ff' },
  { id: 'tag4', name: 'health', color: '#fef3c7' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedState = loadState();

  const [activeTab, setActiveTab] = useState(savedState?.activeTab || 'dashboard');
  const [theme, setTheme] = useState<ThemeType>(savedState?.theme || 'classic');
  const [detailsWidth, setDetailsWidth] = useState(savedState?.detailsWidth || 450);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(savedState?.isSidebarCollapsed || false);
  const [sidebarSettings, setSidebarSettings] = useState<Record<string, boolean>>(savedState?.sidebarSettings || {});
  const [aiEnabled, setAiEnabled] = useState<boolean>(savedState?.aiEnabled ?? false);
  
  const [calendarDate, setCalendarDate] = useState<number>(Date.now());
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('month');

  const [cycle, setCycle] = useState<TwelveWeekYear>(savedState?.cycle || {
    id: 'c1', startDate: Date.now(), endDate: Date.now() + (1000 * 60 * 60 * 24 * 84), currentWeek: 1, globalExecutionScore: 65
  });

  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks?.length ? savedState.tasks : SEED_TASKS);
  const [diary, setDiary] = useState<DiaryEntry[]>(savedState?.diary?.length ? savedState.diary : SEED_DIARY);
  const [inboxCategories, setInboxCategories] = useState<InboxCategory[]>(savedState?.inboxCategories || DEFAULT_INBOX_CATEGORIES);
  const [projects, setProjects] = useState<Project[]>(savedState?.projects?.length ? savedState.projects : SEED_PROJECTS);
  const [tags, setTags] = useState<Tag[]>(savedState?.tags?.length ? savedState.tags : SEED_TAGS);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(savedState?.timeBlocks?.length ? savedState.timeBlocks : SEED_TIME_BLOCKS);
  const [blockHistory, setBlockHistory] = useState<Record<string, Record<string, 'pending' | 'completed' | 'missed'>>>(savedState?.blockHistory || {});
  const [routinePresets, setRoutinePresets] = useState<RoutinePreset[]>(savedState?.routinePresets || []);
  const [reportTemplate, setReportTemplate] = useState<ReportQuestion[]>(savedState?.reportTemplate || DEFAULT_REPORT_TEMPLATE);
  const [character, setCharacter] = useState<Character>(savedState?.character || {
    name: 'Talent', race: 'Elf', archetype: 'Strategist', level: 5, xp: 450, gold: 120, bio: 'Верховний стратег цифрових світів.', vision: 'Побудувати досконалий двигун життя через код та дисципліну.', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Talent', energy: 85, maxEnergy: 100, focus: 90, goals: ['Master Frontend', 'Run 10km', 'Write a book'], views: ['Growth Mindset', 'Radical Transparency'], skills: [{ name: 'React', level: 8, xp: 85, icon: 'fa-brands fa-react' }, { name: 'Strategy', level: 6, xp: 60, icon: 'fa-chess' }], achievements: [{ id: 'a1', title: 'Перша ціль', description: 'Завершено стратегічний проект', icon: 'fa-trophy', unlockedAt: Date.now() }], stats: { health: 70, career: 85, finance: 60, education: 90, relationships: 75, rest: 50 }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    saveState({ tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets, activeTab, theme, reportTemplate });
  }, [tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets, activeTab, theme, reportTemplate]);

  const updateReportTemplate = useCallback((newTemplate: ReportQuestion[]) => {
    setReportTemplate(newTemplate);
  }, []);

  const addTimeBlock = useCallback((blockData: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = { ...blockData, id: Math.random().toString(36).substr(2, 9) };
    setTimeBlocks(prev => [...prev, newBlock].sort((a, b) => a.startHour - b.startHour));
  }, []);

  const updateTimeBlock = useCallback((updated: TimeBlock) => {
    setTimeBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, []);

  const deleteTimeBlock = useCallback((blockId: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  const setBlockStatus = useCallback((dateStr: string, blockId: string, status: 'pending' | 'completed' | 'missed') => {
    setBlockHistory(prev => ({
      ...prev,
      [dateStr]: { ...(prev[dateStr] || {}), [blockId]: status }
    }));
  }, []);

  const saveRoutineAsPreset = useCallback((name: string, dayOfWeek: number) => {
    const blocks = timeBlocks.filter(b => b.dayOfWeek === dayOfWeek);
    if (blocks.length === 0) return;
    const newPreset: RoutinePreset = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      blocks: blocks.map(({ id, ...rest }) => rest)
    };
    setRoutinePresets(prev => [...prev, newPreset]);
  }, [timeBlocks]);

  const applyRoutinePreset = useCallback((presetId: string, dayOfWeek: number) => {
    const preset = routinePresets.find(p => p.id === presetId);
    if (!preset) return;
    const newBlocks: TimeBlock[] = preset.blocks.map(b => ({
      ...b,
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek
    }));
    setTimeBlocks(prev => [...prev.filter(b => b.dayOfWeek !== dayOfWeek), ...newBlocks]);
  }, [routinePresets]);

  const updateCharacter = useCallback((updates: Partial<Character>) => setCharacter(prev => ({ ...prev, ...updates })), []);
  const updateSidebarSetting = (key: string, visible: boolean) => setSidebarSettings(prev => ({ ...prev, [key]: visible }));
  
  const addTask = useCallback((title: string, categoryId: string = 'unsorted', projectId?: string, projectSection: ProjectSection = 'actions', isEvent: boolean = false, scheduledDate?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    const isHabit = projectSection === 'habits';
    const newTask: Task = { 
      id, 
      title, 
      status: TaskStatus.INBOX, 
      priority: Priority.NUI, 
      difficulty: 1, 
      xp: isHabit ? 150 : 50, 
      tags: isHabit ? ['habit'] : [], 
      createdAt: Date.now(), 
      category: categoryId, 
      projectId, 
      projectSection, 
      isEvent,
      scheduledDate,
      recurrence: isHabit ? 'daily' : 'none',
      recurrenceDays: isHabit ? [1, 2, 3, 4, 5, 6, 0] : undefined,
      habitHistory: {}, 
      checklist: [],
      isDeleted: false 
    };
    setTasks(prev => [newTask, ...prev]);
    return id;
  }, []);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'progress' | 'status'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newProject: Project = { ...projectData, id, progress: 0, status: 'active' };
    setProjects(prev => [newProject, ...prev]);
    return id;
  }, []);

  const updateTask = useCallback((t: Task) => setTasks(prev => prev.map(old => old.id === t.id ? t : old)), []);
  const updateProject = useCallback((p: Project) => setProjects(prev => prev.map(old => old.id === p.id ? p : old)), []);
  const deleteTask = useCallback((id: string, perm = false) => setTasks(prev => perm ? prev.filter(t => t.id !== id) : prev.map(t => t.id === id ? { ...t, isDeleted: true } : t)), []);
  const restoreTask = useCallback((id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isDeleted: false } : t)), []);
  const deleteProject = useCallback((id: string) => setProjects(prev => prev.filter(p => p.id !== id)), []);
  const scheduleTask = useCallback((id: string, date: number | undefined) => setTasks(prev => prev.map(t => t.id === id ? { ...t, scheduledDate: date } : t)), []);
  
  const toggleTaskStatus = useCallback((task: Task) => {
    const isNowDone = task.status !== TaskStatus.DONE;
    updateTask({ ...task, status: isNowDone ? TaskStatus.DONE : TaskStatus.INBOX });
  }, [updateTask]);

  const toggleHabitStatus = useCallback((id: string, d: string, s?: any, n?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const history = { ...(t.habitHistory || {}) };
        history[d] = { status: s || (history[d]?.status === 'completed' ? 'none' : 'completed'), note: n || history[d]?.note };
        return { ...t, habitHistory: history };
      }
      return t;
    }));
  }, []);

  const moveTaskToCategory = (id: string, cat: string, isPinned?: boolean) => setTasks(prev => prev.map(t => t.id === id ? { ...t, category: cat, isPinned: isPinned ?? t.isPinned } : t));
  const moveTaskToProjectSection = (id: string, sec: ProjectSection) => setTasks(prev => prev.map(t => t.id === id ? { ...t, projectSection: sec } : t));
  const setProjectParent = (id: string, pId: string | undefined) => setProjects(prev => prev.map(p => p.id === id ? { ...p, parentFolderId: pId } : p));
  const addTag = useCallback((n: string) => { const nt = { id: Math.random().toString(36).substr(2, 9), name: n.toLowerCase(), color: `hsl(${Math.random() * 360}, 70%, 90%)` }; setTags(p => [...p, nt]); return nt; }, []);
  const renameTag = (o: string, n: string) => setTags(p => p.map(t => t.name === o ? { ...t, name: n } : t));
  const deleteTag = (n: string) => setTags(p => p.filter(t => t.name !== n));
  const saveDiaryEntry = useCallback((d: string, c: string) => setDiary(p => { const ex = p.find(e => e.date === d); return ex ? p.map(e => e.date === d ? { ...e, content: c, updatedAt: Date.now() } : e) : [{ id: Math.random().toString(36).substr(2, 9), date: d, content: c, createdAt: Date.now(), updatedAt: Date.now() }, ...p] }), []);
  const deleteDiaryEntry = (id: string) => setDiary(p => p.filter(e => e.id !== id));
  const addInboxCategory = (t: string) => setInboxCategories(p => [...p, { id: Math.random().toString(36).substr(2, 9), title: t, icon: 'fa-folder', isPinned: false }]);
  const updateInboxCategory = (id: string, u: any) => setInboxCategories(p => p.map(c => c.id === id ? { ...c, ...u } : c));
  const deleteInboxCategory = (id: string) => setInboxCategories(p => p.filter(c => c.id !== id));
  const toggleTaskPin = (id: string) => setTasks(p => p.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));

  const addChecklistItem = useCallback((taskId: string, title: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist: [...(t.checklist || []), { id: Math.random().toString(36).substr(2, 9), title, completed: false }] } : t));
  }, []);

  const toggleChecklistItem = useCallback((taskId: string, itemId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist: (t.checklist || []).map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) } : t));
  }, []);

  const removeChecklistItem = useCallback((taskId: string, itemId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist: (t.checklist || []).filter(i => i.id !== itemId) } : t));
  }, []);

  const value = useMemo(() => ({
    tasks, projects, cycle, character, tags, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, setActiveTab, theme, setTheme,
    detailsWidth, setDetailsWidth, sidebarSettings, isSidebarCollapsed, setSidebarCollapsed, updateSidebarSetting,
    aiEnabled, setAiEnabled, updateCharacter,
    calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode,
    reportTemplate, updateReportTemplate,
    addTask, addProject, updateTask, updateProject, deleteProject, deleteTask, restoreTask, moveTaskToCategory, moveTaskToProjectSection, setProjectParent, scheduleTask, toggleTaskStatus, toggleHabitStatus, toggleTaskPin, undoLastAction: () => {},
    saveDiaryEntry, deleteDiaryEntry, addInboxCategory, updateInboxCategory, deleteInboxCategory,
    addTimeBlock, updateTimeBlock, deleteTimeBlock, setBlockStatus, saveRoutineAsPreset, applyRoutinePreset,
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    pendingUndo: false, addTag, renameTag, deleteTag
  }), [tasks, projects, cycle, character, tags, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, theme, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, calendarDate, calendarViewMode, reportTemplate, updateReportTemplate]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
