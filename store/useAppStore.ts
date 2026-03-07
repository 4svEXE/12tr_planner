import { create } from 'zustand';
import { StoreState, ThemeType, CalendarViewMode, Task, Project, Person, Tag, Hobby, TaskStatus, Priority, TimeBlock, RoutinePreset, ReportQuestion, ReportPreset, TwelveWeekYear, ShoppingStore, ShoppingItem } from '../types';
import { generateSeedData } from '../services/seedService';

export interface AppStore extends StoreState {
    activeTab: string;
    theme: ThemeType;
    isSidebarCollapsed: boolean;
    detailsWidth: number;
    calendarDate: number;
    calendarViewMode: CalendarViewMode;
    isReportWizardOpen: boolean;
    plannerProjectId?: string;
    isSyncing: boolean;
    lastSyncTime: number | null;
    diaryNotificationEnabled?: boolean;
    diaryNotificationTime?: string;

    // Actions
    setActiveTab: (tab: string) => void;
    setTheme: (theme: ThemeType) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setDetailsWidth: (w: number) => void;
    setCalendarDate: (d: number) => void;
    setCalendarViewMode: (m: CalendarViewMode) => void;
    setIsReportWizardOpen: (open: boolean) => void;
    setPlannerProjectId: (id: string | undefined) => void;
    setSyncStatus: (isSyncing: boolean, lastSyncTime: number | null) => void;
    setDiaryNotificationEnabled: (enabled: boolean) => void;
    setDiaryNotificationTime: (time: string) => void;

    // Game Logic / Data mutations
    setState: (state: Partial<StoreState>) => void;
    updateCharacter: (updates: Partial<StoreState['character']>) => void;
    addTask: (title: string, category?: string, projectId?: string, section?: string, isEvent?: boolean, scheduledDate?: number, personId?: string, status?: TaskStatus) => string;
    updateTask: (task: Task) => void;
    deleteTask: (taskId: string, permanent?: boolean) => void;
    restoreTask: (taskId: string) => void;
    reorderTasks: (sourceId: string, targetId: string) => void;
    scheduleTask: (taskId: string, date: number) => void;
    toggleTaskStatus: (task: Task) => void;
    toggleHabitStatus: (id: string, date: string, status?: any, note?: string) => void;

    addProject: (p: any) => string;
    updateProject: (p: Project) => void;
    deleteProject: (id: string) => void;
    addProjectSection: (projectId: string, title: string) => void;
    renameProjectSection: (projectId: string, sectionId: string, title: string) => void;
    deleteProjectSection: (projectId: string, sectionId: string) => void;

    addStore: (name: string) => void;
    updateStore: (s: ShoppingStore) => void;
    deleteStore: (id: string) => void;
    shareStore: (sid: string, email: string) => Promise<void>;
    addShoppingItem: (name: string, storeId: string) => void;
    updateShoppingItem: (i: ShoppingItem) => void;
    toggleShoppingItem: (id: string) => void;
    deleteShoppingItem: (id: string) => void;

    addTag: (name: string) => Tag;
    renameTag: (oldName: string, newName: string) => void;
    deleteTag: (name: string) => void;
    addHobby: (name: string) => void;
    renameHobby: (oldName: string, newName: string) => void;
    deleteHobby: (name: string) => void;

    saveDiaryEntry: (date: string, content: string, id?: string) => string;
    deleteDiaryEntry: (id: string) => void;

    addPerson: (p: any) => string;
    updatePerson: (p: Person) => void;
    deletePerson: (id: string, permanent?: boolean) => void;
    restorePerson: (id: string) => void;
    addInteraction: (personId: string, interaction: any) => void;
    deleteInteraction: (personId: string, interactionId: string) => void;
    addRelationshipType: (type: string) => void;

    addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
    updateTimeBlock: (block: TimeBlock) => void;
    deleteTimeBlock: (id: string) => void;
    applyRoutinePreset: (presetId: string, dayOfWeek: number) => void;
    saveRoutineAsPreset: (name: string, dayOfWeek: number) => void;

    updateCycle: (updates: Partial<TwelveWeekYear>) => void;
    updateReportTemplate: (template: ReportQuestion[]) => void;
    addReportPreset: (name: string, questions: ReportQuestion[]) => void;
    updateReportPreset: (id: string, updates: Partial<ReportPreset>) => void;
    deleteReportPreset: (id: string) => void;

    addReward: (title: string, cost: number, icon: string) => void;
    deleteReward: (id: string) => void;
    buyReward: (rewardId: string) => boolean;

    setAiEnabled: (enabled: boolean) => void;
    updateSidebarSetting: (key: string, value: boolean) => void;
    clearSelectedData: (categories: string[]) => void;
}

const UI_PREFS_KEY = '12tr_ui_preferences';
const savedUI = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(UI_PREFS_KEY) || '{}') : {};

const updateUIPreference = (key: string, value: any) => {
    if (typeof localStorage === 'undefined') return;
    const current = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || '{}');
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ ...current, [key]: value }));
};

const seed = generateSeedData();
const defaultState = {
    tasks: [], projects: [], people: [],
    relationshipTypes: ['friend', 'colleague', 'family', 'mentor', 'acquaintance'],
    hobbies: seed.hobbies, diary: [], inboxCategories: seed.inboxCategories,
    timeBlocks: seed.timeBlocks, routinePresets: [],
    reportTemplate: seed.reportTemplate, reportPresets: seed.reportPresets,
    shoppingStores: [], shoppingItems: [],
    character: seed.character, cycle: seed.cycle,
    tags: seed.tags
};

export const useAppStore = create<AppStore>()((set, get) => ({
    ...defaultState,
    updatedAt: Date.now(),

    activeTab: savedUI.activeTab || 'today',
    theme: savedUI.theme || 'midnight',
    isSidebarCollapsed: savedUI.isSidebarCollapsed || false,
    detailsWidth: savedUI.detailsWidth || 450,
    calendarDate: Date.now(),
    calendarViewMode: savedUI.calendarViewMode || 'month',
    isReportWizardOpen: false,
    plannerProjectId: undefined,
    isSyncing: false,
    lastSyncTime: null,

    setState: (newState) => set((state) => ({ ...state, ...newState, updatedAt: Date.now() })),

    setActiveTab: (tab) => {
        set({ activeTab: tab });
        updateUIPreference('activeTab', tab);
    },
    setTheme: (t) => {
        set({ theme: t });
        updateUIPreference('theme', t);
    },
    setSidebarCollapsed: (c) => {
        set({ isSidebarCollapsed: c });
        updateUIPreference('isSidebarCollapsed', c);
    },
    setDetailsWidth: (w) => {
        set({ detailsWidth: w });
        updateUIPreference('detailsWidth', w);
    },
    setCalendarDate: (d) => set({ calendarDate: d }),
    setCalendarViewMode: (m) => {
        set({ calendarViewMode: m });
        updateUIPreference('calendarViewMode', m);
    },
    setIsReportWizardOpen: (open) => set({ isReportWizardOpen: open }),
    setPlannerProjectId: (id) => set({ plannerProjectId: id }),
    setSyncStatus: (isSyncing, lastSyncTime) => set({ isSyncing, lastSyncTime }),
    setDiaryNotificationEnabled: (e) => set({ diaryNotificationEnabled: e }),
    setDiaryNotificationTime: (t) => set({ diaryNotificationTime: t }),

    updateCharacter: (u) => set((prev) => ({ character: { ...prev.character, ...u, updatedAt: Date.now() }, updatedAt: Date.now() })),

    addTask: (title, category = 'tasks', projectId, projectSection, isEvent, scheduledDate, personId, status) => {
        const id = Math.random().toString(36).substr(2, 9);
        const isHabit = projectSection === 'habits';
        const newTask: Task = {
            id, title,
            status: status || (isHabit ? TaskStatus.NEXT_ACTION : TaskStatus.INBOX),
            priority: Priority.NUI,
            difficulty: 1, xp: 50,
            tags: isHabit ? ['habit'] : [],
            createdAt: Date.now(), updatedAt: Date.now(),
            category, projectId, projectSection: projectSection as any,
            isEvent, scheduledDate, personId,
            recurrence: isHabit ? 'daily' as any : 'none',
            daysOfWeek: isHabit ? [0, 1, 2, 3, 4, 5, 6] : undefined,
            habitHistory: isHabit ? {} : undefined,
        };
        set((prev) => ({ tasks: [newTask, ...prev.tasks], updatedAt: Date.now() }));
        return id;
    },

    updateTask: (t) => set((prev) => ({
        tasks: prev.tasks.map(old => old.id === t.id ? { ...t, updatedAt: Date.now() } : old),
        updatedAt: Date.now()
    })),

    deleteTask: (id, perm) => set((prev) => ({
        tasks: perm ? prev.tasks.filter(t => t.id !== id) : prev.tasks.map(t => t.id === id ? { ...t, isDeleted: true, updatedAt: Date.now() } : t),
        updatedAt: Date.now()
    })),

    restoreTask: (id) => set((prev) => ({
        tasks: prev.tasks.map(t => t.id === id ? { ...t, isDeleted: false, updatedAt: Date.now() } : t),
        updatedAt: Date.now()
    })),

    reorderTasks: (sId, tId) => set((prev) => {
        const next = [...prev.tasks];
        const sIdx = next.findIndex(t => t.id === sId);
        const tIdx = next.findIndex(t => t.id === tId);
        if (sIdx >= 0 && tIdx >= 0) {
            const [moved] = next.splice(sIdx, 1);
            next.splice(tIdx, 0, moved);
        }
        return { tasks: next, updatedAt: Date.now() };
    }),

    scheduleTask: (id, date) => set((prev) => ({
        tasks: prev.tasks.map(t => t.id === id ? { ...t, scheduledDate: date, updatedAt: Date.now() } : t),
        updatedAt: Date.now()
    })),

    toggleTaskStatus: (task) => set((prev) => {
        const isNowDone = task.status !== TaskStatus.DONE;
        const bonusGold = isNowDone ? (task.priority === Priority.UI ? 50 : 20) : 0;
        const bonusFood = isNowDone ? (Math.random() > 0.5 ? 1 : 0) : 0;
        return {
            tasks: prev.tasks.map(t => t.id === task.id ? { ...t, status: isNowDone ? TaskStatus.DONE : TaskStatus.INBOX, completedAt: isNowDone ? Date.now() : undefined } : t),
            foodInventory: (prev.foodInventory || 0) + bonusFood,
            character: { ...prev.character, gold: prev.character.gold + bonusGold, xp: prev.character.xp + 50, updatedAt: Date.now() },
            updatedAt: Date.now()
        };
    }),

    toggleHabitStatus: (id, d, s, note) => set((prev) => {
        const newStatus = s || 'completed';
        const habit = prev.tasks.find(t => t.id === id);
        const oldStatus = habit?.habitHistory?.[d]?.status || 'none';

        const isNowDone = newStatus === 'completed';
        const wasDone = oldStatus === 'completed';

        let bonusGold = 0;
        let bonusXp = 0;

        if (isNowDone && !wasDone) {
            bonusGold = 10;
            bonusXp = 25;
        } else if (!isNowDone && wasDone) {
            bonusGold = -10;
            bonusXp = -25;
        }

        return {
            tasks: prev.tasks.map(t => t.id === id ? { ...t, habitHistory: { ...(t.habitHistory || {}), [d]: { status: newStatus, note: note !== undefined ? note : (habit?.habitHistory?.[d]?.note) } }, updatedAt: Date.now() } : t),
            character: {
                ...prev.character,
                gold: Math.max(0, prev.character.gold + bonusGold),
                xp: Math.max(0, prev.character.xp + bonusXp),
                updatedAt: Date.now()
            },
            updatedAt: Date.now()
        };
    }),

    addProject: (p) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newProj = { ...p, id, progress: 0, status: 'active', updatedAt: Date.now() };
        let additions: any[] = [newProj];

        if (p.type === 'project') {
            const folderId = Math.random().toString(36).substr(2, 9);
            additions.push({ id: folderId, name: p.name, type: 'folder', status: 'active', updatedAt: Date.now() });
            const lists = ['В дії', 'Проекти', 'Звички', 'Нотатки', 'Беклог'];
            lists.forEach(listName => {
                additions.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: listName, type: 'list', parentFolderId: folderId, status: 'active', updatedAt: Date.now()
                });
            });
        }

        set((prev) => ({ projects: [...prev.projects, ...additions], updatedAt: Date.now() }));
        return id;
    },

    updateProject: (p) => set((prev) => ({
        projects: prev.projects.map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old),
        updatedAt: Date.now()
    })),

    deleteProject: (id) => set((prev) => ({
        projects: prev.projects.filter(p => p.id !== id),
        updatedAt: Date.now()
    })),

    addProjectSection: (pId, title) => set((prev) => ({
        projects: prev.projects.map(p => p.id === pId ? { ...p, sections: [...(p.sections || []), { id: Math.random().toString(36).substr(2, 5), title }], updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    renameProjectSection: (pId, sId, title) => set((prev) => ({
        projects: prev.projects.map(p => p.id === pId ? { ...p, sections: p.sections?.map(s => s.id === sId ? { ...s, title } : s), updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    deleteProjectSection: (pId, sId) => set((prev) => ({
        projects: prev.projects.map(p => p.id === pId ? { ...p, sections: p.sections?.filter(s => s.id !== sId), updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    addStore: (name) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((prev) => ({
            shoppingStores: [...(prev.shoppingStores || []), { id, name, icon: 'fa-shop', color: '#6366f1', updatedAt: Date.now(), ownerEmail: 'guest' }],
            updatedAt: Date.now()
        }));
    },

    updateStore: (s) => set((prev) => ({
        shoppingStores: prev.shoppingStores?.map(old => old.id === s.id ? { ...s, updatedAt: Date.now() } : old),
        updatedAt: Date.now()
    })),

    deleteStore: (id) => set((prev) => ({
        shoppingStores: prev.shoppingStores?.filter(s => s.id !== id),
        shoppingItems: prev.shoppingItems?.filter(i => i.storeId !== id),
        updatedAt: Date.now()
    })),

    shareStore: async (sid, email) => set((prev) => ({
        shoppingStores: prev.shoppingStores?.map(s => s.id === sid ? { ...s, collaborators: [...(s.collaborators || []), email], isShared: true, updatedAt: Date.now() } : s),
        updatedAt: Date.now()
    })),

    addShoppingItem: (name, storeId) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((prev) => ({
            shoppingItems: [...(prev.shoppingItems || []), { id, name, storeId, isBought: false, updatedAt: Date.now(), lastModifiedBy: 'guest' }],
            updatedAt: Date.now()
        }));
    },

    updateShoppingItem: (i) => set((prev) => ({
        shoppingItems: prev.shoppingItems?.map(old => old.id === i.id ? { ...i, updatedAt: Date.now() } : old),
        updatedAt: Date.now()
    })),

    toggleShoppingItem: (id) => set((prev) => ({
        shoppingItems: prev.shoppingItems?.map(i => i.id === id ? { ...i, isBought: !i.isBought, updatedAt: Date.now(), lastModifiedBy: 'guest' } : i),
        updatedAt: Date.now()
    })),

    deleteShoppingItem: (id) => set((prev) => ({
        shoppingItems: prev.shoppingItems?.filter(i => i.id !== id),
        updatedAt: Date.now()
    })),

    addTag: (name) => {
        const tag = { id: Math.random().toString(36).substr(2, 9), name, color: '#f97316', updatedAt: Date.now() };
        set((prev) => ({ tags: [...(prev.tags || []), tag], updatedAt: Date.now() }));
        return tag;
    },

    renameTag: (oldN, newN) => set((prev) => ({
        tags: prev.tags?.map(t => t.name === oldN ? { ...t, name: newN, updatedAt: Date.now() } : t),
        tasks: prev.tasks.map(t => ({ ...t, tags: t.tags.map(tag => tag === oldN ? newN : tag) })),
        updatedAt: Date.now()
    })),

    deleteTag: (name) => set((prev) => ({
        tags: prev.tags?.filter(t => t.name !== name),
        tasks: prev.tasks.map(t => ({ ...t, tags: t.tags.filter(tag => tag !== name) })),
        updatedAt: Date.now()
    })),

    addHobby: (name) => set((prev) => ({
        hobbies: [...(prev.hobbies || []), { id: Math.random().toString(36).substr(2, 9), name, color: '#f97316', updatedAt: Date.now() }],
        updatedAt: Date.now()
    })),

    renameHobby: (oldN, newN) => set((prev) => ({
        hobbies: prev.hobbies?.map(h => h.name === oldN ? { ...h, name: newN, updatedAt: Date.now() } : h),
        people: prev.people?.map(p => ({ ...p, hobbies: p.hobbies?.map(h => h === oldN ? newN : h) })),
        updatedAt: Date.now()
    })),

    deleteHobby: (name) => set((prev) => ({
        hobbies: prev.hobbies?.filter(h => h.name !== name),
        people: prev.people?.map(p => ({ ...p, hobbies: p.hobbies?.filter(h => h !== name) })),
        updatedAt: Date.now()
    })),

    saveDiaryEntry: (date, content, id) => {
        const finalId = id || Math.random().toString(36).substr(2, 9);
        set((prev) => {
            const nextD = [...(prev.diary || [])];
            const idx = id ? nextD.findIndex(e => e.id === id) : -1;
            if (idx >= 0) nextD[idx] = { ...nextD[idx], content, updatedAt: Date.now() };
            else nextD.push({ id: finalId, date, content, createdAt: Date.now(), updatedAt: Date.now() });
            return { diary: nextD, updatedAt: Date.now() };
        });
        return finalId;
    },

    deleteDiaryEntry: (id) => set((prev) => ({
        diary: prev.diary?.filter(e => e.id !== id),
        updatedAt: Date.now()
    })),

    addPerson: (p) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((prev) => ({
            people: [...(prev.people || []), { ...p, id, rating: 0, notes: [], memories: [], interactions: [], importantDates: [], hobbies: [], tags: [], socials: {}, loop: 'none', createdAt: Date.now(), updatedAt: Date.now() }],
            updatedAt: Date.now()
        }));
        return id;
    },

    updatePerson: (p) => set((prev) => ({
        people: prev.people?.map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old),
        updatedAt: Date.now()
    })),

    deletePerson: (id, perm) => set((prev) => ({
        people: perm ? prev.people?.filter(p => p.id !== id) : prev.people?.map(p => p.id === id ? { ...p, isDeleted: true, updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    restorePerson: (id) => set((prev) => ({
        people: prev.people?.map(p => p.id === id ? { ...p, isDeleted: false, updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    addInteraction: (pId, i) => set((prev) => ({
        people: prev.people?.map(p => p.id === pId ? { ...p, interactions: [{ ...i, id: Math.random().toString(36).substr(2, 9) }, ...(p.interactions || [])], lastInteractionAt: Date.now(), updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    deleteInteraction: (pId, iId) => set((prev) => ({
        people: prev.people?.map(p => p.id === pId ? { ...p, interactions: p.interactions?.filter(i => i.id !== iId), updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    addRelationshipType: (t) => set((prev) => ({
        relationshipTypes: [...(prev.relationshipTypes || []), t],
        updatedAt: Date.now()
    })),

    addTimeBlock: (b) => set((prev) => ({
        timeBlocks: [...(prev.timeBlocks || []), { ...b, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }],
        updatedAt: Date.now()
    })),

    updateTimeBlock: (b) => set((prev) => ({
        timeBlocks: prev.timeBlocks?.map(old => old.id === b.id ? { ...b, updatedAt: Date.now() } : old),
        updatedAt: Date.now()
    })),

    deleteTimeBlock: (id) => set((prev) => ({
        timeBlocks: prev.timeBlocks?.filter(b => b.id !== id),
        updatedAt: Date.now()
    })),

    applyRoutinePreset: (pId, dow) => set((prev) => {
        const preset = prev.routinePresets?.find(p => p.id === pId);
        if (!preset) return prev;
        const filtered = prev.timeBlocks?.filter(b => b.dayOfWeek !== dow) || [];
        const newBlocks = preset.blocks.map(b => ({ ...b, id: Math.random().toString(36).substr(2, 9), dayOfWeek: dow, updatedAt: Date.now() }));
        return { timeBlocks: [...filtered, ...newBlocks], updatedAt: Date.now() };
    }),

    saveRoutineAsPreset: (n, dow) => set((prev) => ({
        routinePresets: [...(prev.routinePresets || []), { id: Math.random().toString(36).substr(2, 9), name: n, blocks: prev.timeBlocks?.filter(b => b.dayOfWeek === dow) || [], updatedAt: Date.now() }],
        updatedAt: Date.now()
    })),

    updateCycle: (u) => set((prev) => ({
        cycle: { ...prev.cycle, ...u, updatedAt: Date.now() },
        updatedAt: Date.now()
    })),

    updateReportTemplate: (t) => set({ reportTemplate: t, updatedAt: Date.now() }),

    addReportPreset: (n, qs) => set((prev) => ({
        reportPresets: [...(prev.reportPresets || []), { id: Math.random().toString(36).substr(2, 9), name: n, questions: qs, updatedAt: Date.now() }],
        updatedAt: Date.now()
    })),

    updateReportPreset: (id, u) => set((prev) => ({
        reportPresets: prev.reportPresets?.map(p => p.id === id ? { ...p, ...u, updatedAt: Date.now() } : p),
        updatedAt: Date.now()
    })),

    deleteReportPreset: (id) => set((prev) => ({
        reportPresets: prev.reportPresets?.filter(p => p.id !== id),
        updatedAt: Date.now()
    })),

    addReward: (title, cost, icon) => set((prev) => ({
        customRewards: [...(prev.customRewards || []), { id: Math.random().toString(36).substr(2, 9), title, cost, icon }],
        updatedAt: Date.now()
    })),

    deleteReward: (id) => set((prev) => ({
        customRewards: prev.customRewards?.filter(r => r.id !== id) || [],
        updatedAt: Date.now()
    })),

    buyReward: (id) => {
        let success = false;
        set((prev) => {
            const reward = prev.customRewards?.find(r => r.id === id);
            if (reward && prev.character.gold >= reward.cost) {
                success = true;
                return {
                    character: { ...prev.character, gold: Math.max(0, prev.character.gold - reward.cost), updatedAt: Date.now() },
                    purchasedRewards: [{ ...reward, purchasedAt: Date.now() }, ...(prev.purchasedRewards || [])],
                    updatedAt: Date.now()
                };
            }
            return prev;
        });
        return success;
    },

    setAiEnabled: (e) => set({ aiEnabled: e, updatedAt: Date.now() }),

    updateSidebarSetting: (k, v) => set((prev) => ({
        sidebarSettings: { ...(prev.sidebarSettings || {}), [k]: v },
        updatedAt: Date.now()
    })),

    clearSelectedData: (categories) => {
        const freshSeed = generateSeedData();
        set((prev) => {
            let next = { ...prev };
            if (categories.includes('tasks')) next.tasks = [];
            if (categories.includes('projects')) next.projects = freshSeed.projects;
            if (categories.includes('people')) next.people = [];
            if (categories.includes('diary')) next.diary = [];
            if (categories.includes('shopping')) { next.shoppingStores = []; next.shoppingItems = []; }
            if (categories.includes('routine')) { next.timeBlocks = freshSeed.timeBlocks; next.routinePresets = []; }
            if (categories.includes('character')) { next.character = freshSeed.character; }
            return { ...next, updatedAt: Date.now() };
        });
    }

}));
