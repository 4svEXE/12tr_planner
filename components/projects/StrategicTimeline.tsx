
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project } from '../../types';
import Typography from '../ui/Typography';
import Card from '../ui/Card';

interface StrategicTimelineProps {
    projects: Project[];
    onUpdateProject: (p: Project) => void;
}

const StrategicTimeline: React.FC<StrategicTimelineProps> = ({ projects, onUpdateProject }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = month view, 0.5 = quarters, 0.2 = years
    const [isDragging, setIsDragging] = useState<string | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [originalStartDate, setOriginalStartDate] = useState(0);

    // Time constants
    const startOfTimeline = useMemo(() => {
        // Start from current year's January
        const d = new Date();
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }, []);

    const pixelsPerDay = 5 * zoomLevel;
    const pixelsPerWeek = pixelsPerDay * 7;
    const pixelsPerMonth = pixelsPerDay * 30.44;

    const timelineWidth = pixelsPerDay * 365 * 5; // 5 years

    const timelineGoals = useMemo(() =>
        projects.filter(p => p.type === 'goal' || p.isStrategic),
        [projects]
    );

    const getXForDate = (date: number) => {
        const diff = date - startOfTimeline;
        return (diff / (24 * 60 * 60 * 1000)) * pixelsPerDay;
    };

    const getDateForX = (x: number) => {
        const days = x / pixelsPerDay;
        return startOfTimeline + days * (24 * 60 * 60 * 1000);
    };

    // Helper for grid
    const months = useMemo(() => {
        const arr = [];
        const d = new Date(startOfTimeline);
        for (let i = 0; i < 60; i++) { // 5 years
            arr.push({
                label: d.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }),
                x: getXForDate(d.getTime()),
                isYear: d.getMonth() === 0
            });
            d.setMonth(d.getMonth() + 1);
        }
        return arr;
    }, [startOfTimeline, pixelsPerDay]);

    const handleDragStart = (e: React.MouseEvent, p: Project) => {
        e.preventDefault();
        setIsDragging(p.id);
        setDragStartX(e.clientX);
        setOriginalStartDate(p.startDate || Date.now());
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = (e.clientX - dragStartX) / zoomLevel;
            const deltaTime = (deltaX / pixelsPerDay) * 24 * 60 * 60 * 1000;
            // We don't update state here to avoid jitter, just visual feedback if we wanted
            // But for simplicity, we'll update on mouse up or use a preview
        };

        const handleMouseUp = (e: MouseEvent) => {
            const deltaX = (e.clientX - dragStartX);
            const deltaTime = (deltaX / pixelsPerDay) * 24 * 60 * 60 * 1000;

            const project = projects.find(p => p.id === isDragging);
            if (project) {
                const newStartDate = originalStartDate + deltaTime;
                // Snap to week if needed
                onUpdateProject({ ...project, startDate: newStartDate });
            }

            setIsDragging(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartX, originalStartDate, projects, onUpdateProject, pixelsPerDay, zoomLevel]);

    // Spheres for Y-axis sorting
    const sphereLabels: Record<string, string> = {
        health: 'Здоров’я',
        career: 'Кар’єра',
        finance: 'Фінанси',
        education: 'Навчання',
        relationships: 'Стосунки',
        rest: 'Відпочинок'
    };

    const spheres = Object.keys(sphereLabels);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-main)]">
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
                <Typography variant="h2" className="text-sm font-black uppercase tracking-widest">Стратегічний Таймлайн (5 років)</Typography>
                <div className="flex gap-2">
                    <button onClick={() => setZoomLevel(prev => Math.max(0.2, prev - 0.1))} className="w-8 h-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center hover:bg-black/5"><i className="fa-solid fa-minus text-[10px]"></i></button>
                    <button onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} className="w-8 h-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center hover:bg-black/5"><i className="fa-solid fa-plus text-[10px]"></i></button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative p-0" ref={containerRef}>
                <div style={{ width: timelineWidth, height: '1000px', position: 'relative' }} className="bg-dots">

                    {/* Timeline Header Grid */}
                    <div className="sticky top-0 z-20 h-10 bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border-color)] flex">
                        {months.map((m, i) => (
                            <div
                                key={i}
                                className={`absolute h-full border-l border-[var(--border-color)] flex items-center px-2 ${m.isYear ? 'bg-black/5 border-l-2' : ''}`}
                                style={{ left: m.x }}
                            >
                                <span className={`text-[8px] font-black uppercase tracking-tighter ${m.isYear ? 'text-primary' : 'text-muted'}`}>{m.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Lines */}
                    {months.filter(m => m.isYear).map((m, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-l-2 border-black/5 pointer-events-none" style={{ left: m.x }}></div>
                    ))}

                    {/* Spheres Lanes */}
                    {spheres.map((s, idx) => (
                        <div key={s} className="absolute w-full border-b border-black/[0.03] flex items-center" style={{ top: 40 + idx * 80, height: 80 }}>
                            <div className="sticky left-0 z-10 px-4 py-1 bg-white/80 backdrop-blur-sm rounded-r-xl border border-l-0 border-[var(--border-color)] shadow-sm">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{sphereLabels[s]}</span>
                            </div>
                        </div>
                    ))}

                    {/* Goals */}
                    {timelineGoals.map(p => {
                        const x = getXForDate(p.startDate || Date.now());
                        // Rough duration: 12 weeks = 84 days
                        const width = 84 * pixelsPerDay;
                        const sphereIndex = spheres.indexOf(p.sphere || 'career');
                        const y = 40 + (sphereIndex >= 0 ? sphereIndex : 6) * 80 + 20;

                        return (
                            <div
                                key={p.id}
                                onMouseDown={(e) => handleDragStart(e, p)}
                                className={`absolute group cursor-grab active:cursor-grabbing transition-shadow hover:z-30 ${isDragging === p.id ? 'z-40 opacity-80 scale-105' : 'z-10'}`}
                                style={{
                                    left: x,
                                    top: y,
                                    width: Math.max(120, width),
                                    height: 40
                                }}
                            >
                                <div
                                    className={`w-full h-full rounded-xl p-2 flex items-center gap-2 shadow-sm border border-black/10 transition-all ${p.status === 'archived' ? 'grayscale opacity-40' : 'hover:shadow-md hover:border-white/50'}`}
                                    style={{ backgroundColor: p.color || 'var(--primary)' }}
                                >
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white text-[10px]">
                                        <i className="fa-solid fa-flag-checkered"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black text-white uppercase truncate tracking-tight">{p.name}</div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-1 bg-white/20 flex-1 rounded-full overflow-hidden">
                                                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${p.progress}%` }}></div>
                                            </div>
                                            <span className="text-[7px] font-black text-white/70">{p.progress}%</span>
                                        </div>
                                    </div>

                                    {/* Tooltip Overlay */}
                                    <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-50">
                                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-2xl w-48 backdrop-blur-md">
                                            <div className="text-[8px] font-black uppercase text-muted mb-1">Цільовий період</div>
                                            <div className="text-[10px] font-bold mb-2">
                                                {new Date(p.startDate || 0).toLocaleDateString()} — {new Date((p.startDate || 0) + 84 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                            </div>
                                            <div className="text-[8px] font-black uppercase text-muted mb-1">Ключовий результат</div>
                                            <div className="text-[10px] font-bold text-primary truncate italic">"{p.lagMeasure || 'Не вказано'}"</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StrategicTimeline;
