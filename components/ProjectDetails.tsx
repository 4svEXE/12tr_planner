import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';
import Badge from './ui/Badge';
import DiaryEditor from './DiaryEditor'; // We can reuse this for description if it supports plain text or we just use textarea

interface ProjectDetailsProps {
    project: Project;
    onClose: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onClose }) => {
    const { updateProject, deleteProject } = useApp();
    const [localName, setLocalName] = useState(project.name);
    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        setLocalName(project.name);
    }, [project.id, project.name]);

    const handleNameBlur = () => {
        if (localName.trim() !== project.name) {
            updateProject({ ...project, name: localName });
        }
    };

    const handleDelete = () => {
        if (confirm('Видалити цей проєкт?')) {
            deleteProject(project.id);
            onClose();
        }
    };

    return (
        <div className="w-full flex flex-col h-full bg-[var(--bg-card)] relative text-[var(--text-main)] border-none overflow-hidden">
            <header className="flex items-center justify-between px-4 h-12 border-b border-[var(--border-color)] bg-transparent shrink-0 z-[100]">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-6 h-6 rounded border border-[var(--border-color)] flex items-center justify-center shadow-sm transition-all hover:scale-110"
                            style={{ backgroundColor: project.color || 'var(--primary)' }}
                        >
                        </button>
                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-2 p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1 animate-in zoom-in-95">
                                {['#f97316', '#3b82f6', '#10b981', '#ef4444', '#a855f7', '#64748b'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { updateProject({ ...project, color: c }); setShowColorPicker(false); }}
                                        className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="px-2 py-1 rounded bg-[var(--bg-input)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        {project.type === 'subproject' ? 'PROJECT' : 'GOAL'}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleDelete} className="w-8 h-8 rounded flex items-center justify-center hover:bg-rose-50 text-[var(--text-muted)] hover:text-rose-500 transition-all">
                        <i className="fa-solid fa-trash-can text-[12px]"></i>
                    </button>
                    <div className="h-6 w-px bg-[var(--border-color)] mx-1"></div>
                    <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center hover:bg-rose text-[var(--text-muted)] hover:text-rose-500 transition-all">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-4 overflow-y-auto">
                <textarea
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    onBlur={handleNameBlur}
                    rows={1}
                    className="w-full bg-transparent text-[20px] font-black border-none focus:ring-0 p-0 placeholder:text-[var(--text-muted)] resize-none leading-tight outline-none shadow-none text-[var(--text-main)] overflow-hidden h-auto mb-4"
                    placeholder="Назва проєкту..."
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                />

                <div className="mb-6">
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1 block">Прогрес</label>
                    <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden flex items-center">
                        <div className="h-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${project.progress}%`, backgroundColor: project.color }}></div>
                    </div>
                    <div className="text-right text-[10px] font-bold text-[var(--text-muted)] mt-1">{project.progress}% completed</div>
                </div>

                <div>
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2 block">Опис та Нотатки</label>
                    <textarea
                        value={project.description || ''}
                        onChange={(e) => updateProject({ ...project, description: e.target.value })}
                        className="w-full min-h-[150px] bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-3 text-[13px] outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all resize-y"
                        placeholder="Додайте опис проєкту..."
                    />
                </div>

                <div className="mt-6 flex gap-4">
                    <div className="flex-1">
                        <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1.5 block">Статус</label>
                        <div className="flex bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-color)]">
                            {['active', 'archived'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => updateProject({ ...project, status: s as any })}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all ${project.status === s ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                                >
                                    {s === 'active' ? 'Активний' : 'Архів'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
