import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Task, TaskStatus } from '../types';

export const useNotificationManager = () => {
    const { tasks, diaryNotificationEnabled, diaryNotificationTime, updateTask } = useAppStore();
    const [activeAlerts, setActiveAlerts] = useState<Task[]>([]);
    const [triggeredReminders, setTriggeredReminders] = useState<Set<string>>(new Set());
    const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
    const [lastDiaryNotifiedDate, setLastDiaryNotifiedDate] = useState<string>('');

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audioRef.current.volume = 0.4;
    }, []);

    const triggerNotification = useCallback((task: Task, label: string) => {
        audioRef.current?.play().catch(() => { });
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Квест: ${task.title}`, { body: label, icon: "https://api.dicebear.com/7.x/shapes/svg?seed=12TR&backgroundColor=f97316" });
        }
        setActiveAlerts(prev => prev.find(t => t.id === task.id) ? prev : [...prev, task]);
    }, []);

    const checkDeadlines = useCallback(() => {
        const now = Date.now();
        const nowDate = new Date();
        const nextTriggered = new Set(triggeredReminders);
        let hasNewTrigger = false;

        if (diaryNotificationEnabled && diaryNotificationTime) {
            const currentTimeStr = nowDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const todayStr = nowDate.toDateString();
            if (currentTimeStr === diaryNotificationTime && lastDiaryNotifiedDate !== todayStr) {
                setLastDiaryNotifiedDate(todayStr);
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Час підбити підсумки дня", {
                        body: "Заповніть свій щоденник та отримайте XP!",
                        icon: "https://api.dicebear.com/7.x/shapes/svg?seed=12TR&backgroundColor=f97316"
                    });
                }
                audioRef.current?.play().catch(() => { });
            }
        }

        const activeTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate || t.dueDate));
        activeTasks.forEach(task => {
            const targetTime = task.scheduledDate || task.dueDate || 0;
            if (targetTime < now - 3600000) return;
            if (task.reminders && task.reminders.length > 0) {
                task.reminders.forEach(minutes => {
                    const reminderKey = `${task.id}:${minutes}`;
                    if (nextTriggered.has(reminderKey)) return;
                    const triggerTime = targetTime - (minutes * 60000);
                    if (now >= triggerTime && now < targetTime) {
                        triggerNotification(task, minutes === 0 ? "Починається зараз!" : `Через ${minutes} хв`);
                        nextTriggered.add(reminderKey);
                        hasNewTrigger = true;
                    }
                });
            }
        });

        if (hasNewTrigger) setTriggeredReminders(nextTriggered);
        const imminent = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.scheduledDate && t.scheduledDate > now && t.scheduledDate <= now + 3600000 && !dismissedAlertIds.has(t.id));
        setActiveAlerts(imminent);
    }, [tasks, triggeredReminders, dismissedAlertIds, diaryNotificationEnabled, diaryNotificationTime, lastDiaryNotifiedDate, triggerNotification]);

    useEffect(() => {
        checkDeadlines();
        const interval = setInterval(checkDeadlines, 60000);
        return () => clearInterval(interval);
    }, [checkDeadlines]);

    const handleDismissAlert = useCallback((taskId: string) => {
        setDismissedAlertIds(prev => new Set(prev).add(taskId));
        setActiveAlerts(prev => prev.filter(t => t.id !== taskId));
    }, []);

    const handleSnooze = useCallback((taskId: string, minutes: number) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let newTime: number;
        const now = Date.now();

        if (minutes === -1) {
            const today = new Date();
            today.setHours(21, 0, 0, 0);
            newTime = today.getTime();
            if (newTime < now) newTime += 24 * 60 * 60 * 1000;
        } else if (minutes === -2) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            newTime = tomorrow.getTime();
        } else {
            newTime = now + (minutes * 60 * 1000);
        }

        updateTask({ ...task, scheduledDate: newTime });
        handleDismissAlert(taskId);
    }, [tasks, updateTask, handleDismissAlert]);

    return { activeAlerts, handleDismissAlert, handleSnooze };
};
