
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Task, Project, Character, Tag, Hobby, TaskStatus, Priority, TwelveWeekYear, ProjectSection, HabitDayData, DiaryEntry, InboxCategory, TimeBlock, RoutinePreset, ThemeType, ChecklistItem, ReportQuestion, Person, Memory, PersonNote, ImportantDate, ShoppingStore, ShoppingItem, Interaction, StoreState, CalendarViewMode } from '../types';
import { generateSeedData } from '../services/seedService';
import { db, doc, setDoc, getDoc } from '../services/firebase';
import { useAuth } from './AuthContext';

const LOCAL_STORAGE_KEY = '12tr_engine_local_data';

interface AppContextType extends StoreState {
  setCalendarDate: (date: number) => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  setDetailsWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: ThemeType) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiEnabled: (enabled: boolean) => void;
  updateSidebarSetting: (key: string, visible: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addTask: (title: string, category?: string, projectId?: string, projectSection?: ProjectSection, isEvent?: boolean, scheduledDate?: number, personId?: string, status?: TaskStatus) => string;
  addProject: (project: Omit<Project, 'id' | 'progress' | 'status' | 'updatedAt'>) => string;
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
  addTag: (name: string) => Tag;
  renameTag: (oldName: string, newName: string) => void;
  deleteTag: (tagName: string) => void;
  addHobby: (name: string) => Hobby;
  renameHobby: (oldName: string, newName: string) => void;
  deleteHobby: (hobbyName: string) => void;
  saveDiaryEntry: (date: string, content: string, id?: string) => string;
  deleteDiaryEntry: (id: string) => void;
  addInboxCategory: (title: string, scope: 'inbox' | 'actions', color?: InboxCategory['color']) => void;
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
  addPerson: (name: string, status?: string) => string;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string, permanent?: boolean) => void;
  restorePerson: (id: string) => void;
  addPersonMemory: (personId: string, memory: Omit<Memory, 'id'>) => void;
  addPersonNote: (personId: string, text: string) => void;
  addInteraction: (personId: string, interaction: Omit<Interaction, 'id'>) => void;
  deleteInteraction: (personId: string, id: string) => void;
  addRelationshipType: (type: string) => void;
  deleteRelationshipType: (type: string) => void;
  updateCycle: (updates: Partial<TwelveWeekYear>) => void;
  addStore: (name: string, icon?: string, color?: string) => void;
  updateStore: (store: ShoppingStore) => void;
  deleteStore: (id: string) => void;
  addShoppingItem: (name: string, storeId: string) => void;
  updateShoppingItem: (item: ShoppingItem) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  syncData: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: number | null;
  calendarDate: number;
  calendarViewMode: CalendarViewMode;
  isSidebarCollapsed: boolean;
  detailsWidth: number;
  people: Person[];
  relationshipTypes: string[];
  hobbies: Hobby[];
  diary: DiaryEntry[];
  inboxCategories: InboxCategory[];
  timeBlocks: TimeBlock[];
  shoppingStores: ShoppingStore[];
  shoppingItems: ShoppingItem[];
  routinePresets: RoutinePreset[];
  reportTemplate: ReportQuestion[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: InboxCategory[] = [
  { id: 'unsorted', title: 'Вхідні', icon: 'fa-inbox', isPinned: false, scope: 'inbox', color: 'slate' },
  { id: 'tasks', title: 'Дії', icon: 'fa-bolt', isPinned: false, scope: 'actions', color: 'orange' },
  { id: 'notes', title: 'Нотатки', icon: 'fa-note-sticky', isPinned: false, scope: 'inbox', color: 'indigo' }
];

const DEFAULT_REL_TYPES = ['friend', 'colleague', 'family', 'mentor', 'acquaintance'];

// Helper to merge arrays of objects by ID and updatedAt
const mergeItems = <T extends { id: string, updatedAt?: number }>(local: T[] = [], cloud: T[] = []): T[] => {
  const map = new Map<string, T>();
  [...cloud, ...local].forEach(item => {
    const existing = map.get(item.id);
    if (!existing || (item.updatedAt || 0) > (existing.updatedAt || 0)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

export const AppProvider: React.FC<{ children: React.ReactNode, userId: string }> = ({ children, userId }) => {
  const { user } = useAuth();
  const [state, setState] = useState<StoreState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [calendarDate, setCalendarDate] = useState<number>(Date.now());
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('month');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsWidth, setDetailsWidth] = useState(450);
  const syncTimeoutRef = useRef<number | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try { 
        setState(JSON.parse(localData)); 
      } catch (e) { console.error("Local parse error"); }
    }
  }, []);

  // Effect to sync on user login
  useEffect(() => {
    if (user && state) {
      syncData();
    }
  }, [user]);

  // Smart Sync Function
  const syncData = useCallback(async () => {
    if (!user || !state) return;
    setIsSyncing(true);
    try {
      const cloudDoc = await getDoc(doc(db, "users", user.uid));
      let cloudData = cloudDoc.exists() ? cloudDoc.data() as StoreState : null;

      if (cloudData) {
        // Perform Smart Merge
        const mergedState: StoreState = {
          ...state,
          tasks: mergeItems(state.tasks, cloudData.tasks),
          projects: mergeItems(state.projects, cloudData.projects),
          people: mergeItems(state.people, cloudData.people),
          diary: mergeItems(state.diary, cloudData.diary),
          tags: mergeItems(state.tags, cloudData.tags),
          hobbies: mergeItems(state.hobbies, cloudData.hobbies),
          shoppingItems: mergeItems(state.shoppingItems, cloudData.shoppingItems),
          shoppingStores: mergeItems(state.shoppingStores, cloudData.shoppingStores),
          // Character is simple overwrite based on updatedAt
          character: (cloudData as any).updatedAt > (state as any).updatedAt ? cloudData.character : state.character,
          cycle: cloudData.cycle 
        };
        
        setState(mergedState);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedState));
        await setDoc(doc(db, "users", user.uid), { ...mergedState, updatedAt: Date.now() });
      } else {
        await setDoc(doc(db, "users", user.uid), { ...state, updatedAt: Date.now() });
      }
      setLastSyncTime(Date.now());
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [user, state]);

  // Handle Auto-Sync to LocalStorage & Debounced Cloud Push
  const pushUpdate = useCallback((newState: StoreState) => {
    const stateWithTimestamp = { ...newState, updatedAt: Date.now() };
    setState(stateWithTimestamp);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateWithTimestamp));

    if (user) {
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = window.setTimeout(async () => {
        setIsSyncing(true); // Показуємо обертання при фоновому збереженні
        try {
          await setDoc(doc(db, "users", user.uid), stateWithTimestamp);
          setLastSyncTime(Date.now());
        } catch (e) { console.error("Cloud sync failed", e); }
        finally {
          setIsSyncing(false);
        }
      }, 3000); // 3s debounce for auto-push
    }
  }, [user]);

  // Seed initialization if state is empty
  useEffect(() => {
    if (state === null) {
      const seed = generateSeedData();
      const initialState: StoreState = {
        tasks: seed.tasks.map(t => ({ ...t, updatedAt: Date.now() })),
        projects: seed.projects.map(p => ({ ...p, updatedAt: Date.now() })),
        people: seed.people.map(p => ({ ...p, updatedAt: Date.now() })),
        character: {
          name: user?.displayName || 'Мандрівник', 
          race: 'Human', archetype: 'Strategist', role: 'Новачок', level: 1, xp: 0, gold: 0, 
          bio: 'Я тільки починаю свій шлях у 12TR.', vision: 'Дослідити всі можливості двигуна 12TR.', 
          avatarUrl: user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`, 
          energy: 100, maxEnergy: 100, focus: 100, goals: [], views: [], beliefs: [],
          preferences: { focusBlockers: [] }, skills: [], achievements: [], 
          stats: { health: 50, career: 50, finance: 50, education: 50, relationships: 50, rest: 50 }
        },
        tags: seed.tags.map(t => ({ ...t, updatedAt: Date.now() })),
        hobbies: seed.hobbies.map(h => ({ ...h, updatedAt: Date.now() })),
        cycle: { id: 'c1', startDate: Date.now(), endDate: Date.now() + 86400000 * 84, currentWeek: 1, globalExecutionScore: 0 },
        diary: seed.diary.map(d => ({ ...d, updatedAt: Date.now() })),
        theme: 'classic', aiEnabled: false, sidebarSettings: {}, activeTab: 'today',
        timeBlocks: seed.timeBlocks, blockHistory: {}, routinePresets: [], reportTemplate: [],
        shoppingStores: [], shoppingItems: [],
        inboxCategories: DEFAULT_CATEGORIES, relationshipTypes: DEFAULT_REL_TYPES
      };
      pushUpdate(initialState);
    }
  }, [state, user, pushUpdate]);

  if (!state) return null;

  // Actions
  const updateTask = (t: Task) => pushUpdate({ ...state, tasks: state.tasks.some(old => old.id === t.id) ? state.tasks.map(old => old.id === t.id ? { ...t, updatedAt: Date.now() } : old) : [{ ...t, updatedAt: Date.now() }, ...state.tasks] });
  const updateProject = (p: Project) => pushUpdate({ ...state, projects: state.projects.map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old) });
  const deleteTask = (id: string, perm = false) => pushUpdate({ ...state, tasks: perm ? state.tasks.filter(t => t.id !== id) : state.tasks.map(t => t.id === id ? { ...t, isDeleted: true, updatedAt: Date.now() } : t) });
  
  const addTask = (title: string, categoryId = 'unsorted', projectId?: string, section: ProjectSection = 'actions', isEvent = false, date?: number, personId?: string, status: TaskStatus = TaskStatus.INBOX) => {
    const id = Math.random().toString(36).substr(2,9);
    const now = Date.now();
    const newTask: Task = { id, title, status, priority: Priority.NUI, difficulty: 1, xp: 50, tags: [], createdAt: now, updatedAt: now, category: categoryId, projectId, projectSection: section, isEvent, scheduledDate: date, personId };
    pushUpdate({ ...state, tasks: [newTask, ...state.tasks] });
    return id;
  };

  const value = {
    ...state,
    isSyncing, lastSyncTime, syncData,
    calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode,
    isSidebarCollapsed, setSidebarCollapsed, detailsWidth, setDetailsWidth,
    setActiveTab: (tab: string) => pushUpdate({ ...state, activeTab: tab }),
    setTheme: (t: ThemeType) => pushUpdate({ ...state, theme: t }),
    setAiEnabled: (e: boolean) => pushUpdate({ ...state, aiEnabled: e }),
    updateSidebarSetting: (k: string, v: boolean) => pushUpdate({ ...state, sidebarSettings: { ...(state.sidebarSettings || {}), [k]: v } }),
    updateCharacter: (u: any) => pushUpdate({ ...state, character: { ...state.character, ...u } }),
    addTask, updateTask, updateProject, deleteTask,
    addProject: (p: any) => { const id = Math.random().toString(36).substr(2,9); pushUpdate({ ...state, projects: [...(state.projects || []), { ...p, id, progress: 0, status: 'active', updatedAt: Date.now() }] }); return id; },
    deleteProject: (id: string) => pushUpdate({ ...state, projects: (state.projects || []).filter(p => p.id !== id) }),
    restoreTask: (id: string) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === id ? { ...t, isDeleted: false, updatedAt: Date.now() } : t) }),
    moveTaskToCategory: (id: string, c: string) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === id ? { ...t, category: c, updatedAt: Date.now() } : t) }),
    moveTaskToProjectSection: (id: string, s: ProjectSection) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === id ? { ...t, projectSection: s, updatedAt: Date.now() } : t) }),
    setProjectParent: (id: string, pId: string | undefined) => pushUpdate({ ...state, projects: (state.projects || []).map(p => p.id === id ? { ...p, parentFolderId: pId, updatedAt: Date.now() } : p) }),
    scheduleTask: (id: string, d: number | undefined) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === id ? { ...t, scheduledDate: d, updatedAt: Date.now() } : t) }),
    toggleTaskStatus: (task: Task) => { const isNowDone = task.status !== TaskStatus.DONE; pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === task.id ? { ...t, status: isNowDone ? TaskStatus.DONE : TaskStatus.INBOX, completedAt: isNowDone ? Date.now() : undefined, updatedAt: Date.now() } : t) }); },
    toggleHabitStatus: (id: string, d: string, s?: any, n?: string) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => { if (t.id === id) { const history = { ...(t.habitHistory || {}) }; history[d] = { status: s || (history[d]?.status === 'completed' ? 'none' : 'completed'), note: n || history[d]?.note }; return { ...t, habitHistory: history, updatedAt: Date.now() }; } return t; }) }),
    toggleTaskPin: (id: string) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === id ? { ...t, isPinned: !t.isPinned, updatedAt: Date.now() } : t) }),
    addTag: (n: string) => { const nt = { id: Math.random().toString(36).substr(2,9), name: n, color: '#f97316', updatedAt: Date.now() }; pushUpdate({ ...state, tags: [...(state.tags || []), nt] }); return nt; },
    renameTag: (o: string, n: string) => pushUpdate({ ...state, tags: (state.tags || []).map(t => t.name === o ? { ...t, name: n, updatedAt: Date.now() } : t) }),
    deleteTag: (n: string) => pushUpdate({ ...state, tags: (state.tags || []).filter(t => t.name !== n) }),
    addHobby: (n: string) => { const nh = { id: Math.random().toString(36).substr(2,9), name: n, color: '#f97316', updatedAt: Date.now() }; pushUpdate({ ...state, hobbies: [...(state.hobbies || []), nh] }); return nh; },
    renameHobby: (o: string, n: string) => pushUpdate({ ...state, hobbies: (state.hobbies || []).map(h => h.name === o ? { ...h, name: n, updatedAt: Date.now() } : h) }),
    deleteHobby: (n: string) => pushUpdate({ ...state, hobbies: (state.hobbies || []).filter(h => h.name !== n) }),
    saveDiaryEntry: (d: string, c: string, id?: string) => {
        let finalId = id || Math.random().toString(36).substr(2,9);
        const now = Date.now();
        const entries = id ? (state.diary || []).map(e => e.id === id ? { ...e, date: d, content: c, updatedAt: now } : e) : [{ id: finalId, date: d, content: c, createdAt: now, updatedAt: now }, ...(state.diary || [])];
        pushUpdate({ ...state, diary: entries });
        return finalId;
    },
    deleteDiaryEntry: (id: string) => pushUpdate({ ...state, diary: (state.diary || []).filter(e => e.id !== id) }),
    addInboxCategory: (t: string, s: any, c?: any) => pushUpdate({ ...state, inboxCategories: [...(state.inboxCategories || DEFAULT_CATEGORIES), { id: Math.random().toString(36).substr(2,9), title: t, icon: 'fa-folder', isPinned: false, scope: s, color: c }] }),
    updateInboxCategory: (id: string, u: any) => pushUpdate({ ...state, inboxCategories: (state.inboxCategories || DEFAULT_CATEGORIES).map(c => c.id === id ? { ...c, ...u } : c) }),
    deleteInboxCategory: (id: string) => pushUpdate({ ...state, inboxCategories: (state.inboxCategories || DEFAULT_CATEGORIES).filter(c => c.id !== id) }),
    addTimeBlock: (b: any) => pushUpdate({ ...state, timeBlocks: [...(state.timeBlocks || []), { ...b, id: Math.random().toString(36).substr(2,9) }] }),
    updateTimeBlock: (b: TimeBlock) => pushUpdate({ ...state, timeBlocks: (state.timeBlocks || []).map(old => old.id === b.id ? b : old) }),
    deleteTimeBlock: (id: string) => pushUpdate({ ...state, timeBlocks: (state.timeBlocks || []).filter(b => b.id !== id) }),
    setBlockStatus: (d: string, bid: string, s: any) => pushUpdate({ ...state, blockHistory: { ...(state.blockHistory || {}), [d]: { ...((state.blockHistory || {})?.[d] || {}), [bid]: s } } }),
    saveRoutineAsPreset: (n: string, d: number) => pushUpdate({ ...state, routinePresets: [...(state.routinePresets || []), { id: Math.random().toString(36).substr(2,9), name: n, blocks: (state.timeBlocks || []).filter(b => b.dayOfWeek === d) }] }),
    applyRoutinePreset: (id: string, d: number) => {
        const pr = (state.routinePresets || []).find(x => x.id === id);
        if (pr) pushUpdate({ ...state, timeBlocks: [...(state.timeBlocks || []).filter(b => b.dayOfWeek !== d), ...pr.blocks.map(b => ({ ...b, id: Math.random().toString(36).substr(2,9), dayOfWeek: d }))] });
    },
    addChecklistItem: (tid: string, title: string) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === tid ? { ...t, checklist: [...(t.checklist || []), { id: Math.random().toString(36).substr(2,9), title, completed: false }], updatedAt: Date.now() } : t) }),
    toggleChecklistItem: (tid: string, iid: string) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === tid ? { ...t, checklist: (t.checklist || []).map(i => i.id === iid ? { ...i, completed: !i.completed } : i), updatedAt: Date.now() } : t) }),
    removeChecklistItem: (tid: string, iid: string) => pushUpdate({ ...state, tasks: (state.tasks || []).map(t => t.id === tid ? { ...t, checklist: (t.checklist || []).filter(i => i.id !== iid), updatedAt: Date.now() } : t) }),
    updateReportTemplate: (t: any) => pushUpdate({ ...state, reportTemplate: t }),
    addPerson: (n: string, s = 'acquaintance') => {
        const id = `p-${Math.random().toString(36).substr(2,9)}`;
        const now = Date.now();
        pushUpdate({ ...state, people: [...(state.people || []), { id, name: n, status: s, rating: 5, tags: [], hobbies: [], socials: {}, notes: [], memories: [], interactions: [], importantDates: [], loop: 'month', createdAt: now, updatedAt: now }] });
        return id;
    },
    updatePerson: (p: Person) => pushUpdate({ ...state, people: (state.people || []).map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old) }),
    addPersonMemory: (pid: string, m: any) => pushUpdate({ ...state, people: (state.people || []).map(x => x.id === pid ? { ...x, memories: [{ ...m, id: Math.random().toString(36).substr(2,9) }, ...(x.memories || [])], updatedAt: Date.now() } : x) }),
    addPersonNote: (pid: string, t: string) => pushUpdate({ ...state, people: (state.people || []).map(x => x.id === pid ? { ...x, notes: [{ id: Math.random().toString(36).substr(2,9), text: t, date: new Date().toISOString() }, ...(x.notes || [])], updatedAt: Date.now() } : x) }),
    addInteraction: (pid: string, i: any) => pushUpdate({ ...state, people: (state.people || []).map(x => x.id === pid ? { ...x, lastInteractionAt: i.date, interactions: [{ ...i, id: Math.random().toString(36).substr(2,9) }, ...(x.interactions || [])], updatedAt: Date.now() } : x) }),
    deleteInteraction: (pid: string, iid: string) => pushUpdate({ ...state, people: (state.people || []).map(x => x.id === pid ? { ...x, interactions: (x.interactions || []).filter(i => i.id !== iid), updatedAt: Date.now() } : x) }),
    addRelationshipType: (t: string) => pushUpdate({ ...state, relationshipTypes: [...new Set([...(state.relationshipTypes || DEFAULT_REL_TYPES), t])] }),
    deleteRelationshipType: (t: string) => pushUpdate({ ...state, relationshipTypes: (state.relationshipTypes || DEFAULT_REL_TYPES).filter(x => x !== t) }),
    updateCycle: (u: any) => pushUpdate({ ...state, cycle: { ...state.cycle, ...u } }),
    addStore: (n: string, i = 'fa-shop', c = '#f97316') => pushUpdate({ ...state, shoppingStores: [...(state.shoppingStores || []), { id: Math.random().toString(36).substr(2,9), name: n, icon: i, color: c, updatedAt: Date.now() }] }),
    updateStore: (s: ShoppingStore) => pushUpdate({ ...state, shoppingStores: (state.shoppingStores || []).map(x => x.id === s.id ? { ...s, updatedAt: Date.now() } : x) }),
    deleteStore: (id: string) => pushUpdate({ ...state, shoppingStores: (state.shoppingStores || []).filter(x => x.id !== id), shoppingItems: (state.shoppingItems || []).filter(x => x.storeId !== id) }),
    addShoppingItem: (n: string, sid: string) => pushUpdate({ ...state, shoppingItems: [...(state.shoppingItems || []), { id: Math.random().toString(36).substr(2,9), name: n, storeId: sid, isBought: false, updatedAt: Date.now() }] }),
    updateShoppingItem: (i: ShoppingItem) => pushUpdate({ ...state, shoppingItems: (state.shoppingItems || []).map(x => x.id === i.id ? { ...i, updatedAt: Date.now() } : x) }),
    toggleShoppingItem: (id: string) => pushUpdate({ ...state, shoppingItems: (state.shoppingItems || []).map(x => x.id === id ? { ...x, isBought: !x.isBought, updatedAt: Date.now() } : x) }),
    deleteShoppingItem: (id: string) => pushUpdate({ ...state, shoppingItems: (state.shoppingItems || []).filter(x => x.id !== id) }),
    deletePerson: (id: string, perm = false) => {
        if (perm) pushUpdate({ ...state, people: (state.people || []).filter(p => p.id !== id) });
        else pushUpdate({ ...state, people: (state.people || []).map(p => p.id === id ? { ...p, isDeleted: true, updatedAt: Date.now() } : p) });
    },
    restorePerson: (id: string) => pushUpdate({ ...state, people: (state.people || []).map(p => p.id === id ? { ...p, isDeleted: false, updatedAt: Date.now() } : p) }),
  } as AppContextType;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
