
import { StoreState, Task, Project, DiaryEntry, Person } from '../types';

export const exportAsBackup = (state: StoreState) => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `12tr_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
};

export const exportAsFiles = async (state: StoreState) => {
    // Check if File System Access API is available
    if ('showDirectoryPicker' in window) {
        try {
            const handle = await (window as any).showDirectoryPicker();

            // Helper to write file
            const writeFile = async (parentHandle: any, name: string, content: string) => {
                const fileHandle = await parentHandle.getFileHandle(name, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
            };

            // Helper to create folder
            const getFolder = async (parentHandle: any, name: string) => {
                return await parentHandle.getDirectoryHandle(name, { create: true });
            };

            // 1. Projects
            if (state.projects.length > 0) {
                const projectsFolder = await getFolder(handle, 'Проєкти');
                for (const project of state.projects) {
                    if (project.type === 'project' || project.type === 'folder') {
                        const projectFolder = await getFolder(projectsFolder, project.name.replace(/[<>:"/\\|?*]/g, '_'));
                        const projectTasks = state.tasks.filter(t => t.projectId === project.id && !t.isDeleted);

                        if (projectTasks.length > 0) {
                            const tasksFolder = await getFolder(projectFolder, 'Квести');
                            for (const task of projectTasks) {
                                const content = `# ${task.title}\n\nСтатус: ${task.status}\nПріоритет: ${task.priority}\nСтворено: ${new Date(task.createdAt).toLocaleString()}\n\n${task.content || task.description || ''}`;
                                await writeFile(tasksFolder, `${task.title.replace(/[<>:"/\\|?*]/g, '_')}.md`, content);
                            }
                        }
                    }
                }
            }

            // 2. Diary
            if (state.diary.length > 0) {
                const diaryFolder = await getFolder(handle, 'Щоденник');
                for (const entry of state.diary) {
                    const content = `# Запис від ${entry.date}\n\n${entry.content}`;
                    await writeFile(diaryFolder, `${entry.date}.md`, content);
                }
            }

            // 3. People (Network)
            if (state.people.length > 0) {
                const peopleFolder = await getFolder(handle, 'Мережа Союзників');
                for (const person of state.people) {
                    if (person.isDeleted) continue;
                    const interactions = person.interactions?.map(i => `- [${new Date(i.date).toLocaleDateString()}] ${i.type}: ${i.summary}`).join('\n') || '';
                    const content = `# ${person.name}\n\nСтатус: ${person.status}\nУ стані: ${person.loop}\n\n## Взаємодії\n${interactions}\n\n## Опис\n${person.description || ''}`;
                    await writeFile(peopleFolder, `${person.name.replace(/[<>:"/\\|?*]/g, '_')}.md`, content);
                }
            }

            // 4. Inbox (Tasks without projects)
            const inboxTasks = state.tasks.filter(t => !t.projectId && !t.isDeleted && t.projectSection !== 'habits');
            if (inboxTasks.length > 0) {
                const inboxFolder = await getFolder(handle, 'Вхідні');
                for (const task of inboxTasks) {
                    const content = `# ${task.title}\n\nСтворено: ${new Date(task.createdAt).toLocaleString()}\n\n${task.content || task.description || ''}`;
                    await writeFile(inboxFolder, `${task.title.replace(/[<>:"/\\|?*]/g, '_')}.md`, content);
                }
            }

            alert('Дані успішно збережено у вибрану папку!');
        } catch (err) {
            console.error('File export failed', err);
            if ((err as Error).name !== 'AbortError') {
                alert('Помилка при збереженні файлів. Переконайтеся, що ви надали доступ до папки.');
            }
        }
    } else {
        // Fallback: Just the backup JSON if picker is not available
        alert('Ваш браузер або середовище не підтримує пряме збереження в папки. Використовуйте кнопку "Повний бекап (JSON)".');
    }
};
