import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TimeBlock } from '../../types';
import Button from '../ui/Button';
import Typography from '../ui/Typography';

const WEEK_DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
const HOUR_COLUMN_WIDTH = 56;
const HOUR_HEIGHT = 48;

export const CalendarRoutineView: React.FC = () => {
    const { timeBlocks, addTimeBlock, updateTimeBlock, deleteTimeBlock } = useApp();
    const [showBlockModal, setShowBlockModal] = useState<Partial<TimeBlock> | null>(null);
    const [modalDays, setModalDays] = useState<number[]>([]);

    // Resize: зберігаємо ВСЕ в refs, щоб уникнути stale closure
    const resizingRef = useRef<{ id: string; startY: number; startHour: number; origEndHour: number } | null>(null);
    const resizePreviewEndRef = useRef<number | null>(null);
    const [resizePreview, setResizePreview] = useState<{ id: string; endHour: number } | null>(null);

    // Drag — переміщення блоку
    const draggingBlockRef = useRef<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // refs для timeBlocks щоб не було stale closure у mousemove/mouseup
    const timeBlocksRef = useRef(timeBlocks);
    useEffect(() => { timeBlocksRef.current = timeBlocks; }, [timeBlocks]);
    const updateTimeBlockRef = useRef(updateTimeBlock);
    useEffect(() => { updateTimeBlockRef.current = updateTimeBlock; }, [updateTimeBlock]);

    // Default to 5 AM
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 5 * HOUR_HEIGHT;
        }
    }, []);

    // Знайти "дублі" блоку
    const findRelatedBlocks = useCallback((block: Partial<TimeBlock>, useCurrentTitle = false) => {
        const titleToMatch = useCurrentTitle ? block.title : (timeBlocks.find(b => b.id === block.id)?.title || block.title);
        return timeBlocks.filter(b =>
            b.title === titleToMatch &&
            b.startHour === block.startHour &&
            b.endHour === block.endHour
        );
    }, [timeBlocks]);

    const handleSaveBlock = (data: Omit<TimeBlock, 'id'>, applyToAll: boolean) => {
        if (!showBlockModal) return;

        if (showBlockModal.id) {
            if (applyToAll) {
                const related = findRelatedBlocks(showBlockModal);
                related.forEach(b => {
                    updateTimeBlock({ ...b, title: data.title, color: data.color, type: data.type, startHour: data.startHour, endHour: data.endHour });
                });
                const currentDays = related.map(b => b.dayOfWeek);
                const addDays = modalDays.filter(d => !currentDays.includes(d));
                const removeDays = currentDays.filter(d => !modalDays.includes(d));
                removeDays.forEach(day => {
                    const toRemove = related.find(b => b.dayOfWeek === day);
                    if (toRemove) deleteTimeBlock(toRemove.id);
                });
                addDays.forEach(day => {
                    addTimeBlock({ ...data, dayOfWeek: day });
                });
            } else {
                updateTimeBlock({ ...data, dayOfWeek: modalDays[0] ?? showBlockModal.dayOfWeek ?? 1, id: showBlockModal.id } as TimeBlock);
            }
        } else {
            modalDays.forEach(day => {
                addTimeBlock({ ...data, dayOfWeek: day } as TimeBlock);
            });
        }
        setShowBlockModal(null);
    };

    const handleDeleteBlock = (id: string, deleteAll: boolean) => {
        if (deleteAll && showBlockModal) {
            const related = findRelatedBlocks(showBlockModal);
            related.forEach(b => deleteTimeBlock(b.id));
        } else {
            deleteTimeBlock(id);
        }
        setShowBlockModal(null);
    };

    // ---- Resize — виправлений, без stale closure ----
    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current) return;
        const deltaY = e.clientY - resizingRef.current.startY;
        const deltaHours = Math.round(deltaY / HOUR_HEIGHT);
        const newEndHour = Math.min(24, Math.max(resizingRef.current.startHour + 1, resizingRef.current.origEndHour + deltaHours));
        resizePreviewEndRef.current = newEndHour;
        setResizePreview({ id: resizingRef.current.id, endHour: newEndHour });
    }, []);

    const handleResizeMouseUp = useCallback(() => {
        if (resizingRef.current && resizePreviewEndRef.current !== null) {
            const block = timeBlocksRef.current.find(b => b.id === resizingRef.current!.id);
            if (block) {
                updateTimeBlockRef.current({ ...block, endHour: resizePreviewEndRef.current });
            }
        }
        resizingRef.current = null;
        resizePreviewEndRef.current = null;
        setResizePreview(null);
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);
    }, [handleResizeMouseMove]);

    const startResize = (e: React.MouseEvent, block: TimeBlock) => {
        e.stopPropagation();
        e.preventDefault();
        resizingRef.current = {
            id: block.id,
            startY: e.clientY,
            startHour: block.startHour,
            origEndHour: block.endHour,
        };
        resizePreviewEndRef.current = block.endHour;
        setResizePreview({ id: block.id, endHour: block.endHour });
        window.addEventListener('mousemove', handleResizeMouseMove);
        window.addEventListener('mouseup', handleResizeMouseUp);
    };

    // ---- Drag-and-drop переміщення ----
    const [dragOverCell, setDragOverCell] = useState<{ day: number; hour: number } | null>(null);

    const handleDragOver = (e: React.DragEvent, day: number, hour: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCell({ day, hour });
    };

    const handleDrop = (e: React.DragEvent, targetDay: number, targetHour: number) => {
        e.preventDefault();
        setDragOverCell(null);
        const blockId = e.dataTransfer.getData('blockId');
        if (!blockId) return;
        const block = timeBlocksRef.current.find(b => b.id === blockId);
        if (block) {
            const duration = block.endHour - block.startHour;
            updateTimeBlockRef.current({ ...block, dayOfWeek: targetDay, startHour: targetHour, endHour: Math.min(24, targetHour + duration) });
        }
        draggingBlockRef.current = null;
    };

    const openModal = (block: Partial<TimeBlock>) => {
        setShowBlockModal(block);
        setModalDays(block.dayOfWeek !== undefined ? [block.dayOfWeek] : [1]);
    };

    // --- Клавіша Delete при відкритих деталях ---
    useEffect(() => {
        if (!showBlockModal?.id) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const active = document.activeElement;
                if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
                const related = timeBlocks.filter(b =>
                    b.title === showBlockModal.title &&
                    b.color === showBlockModal.color &&
                    b.startHour === showBlockModal.startHour &&
                    b.endHour === showBlockModal.endHour
                );
                if (related.length > 1) {
                    const choice = confirm(`Видалити лише цей блок (${WEEK_DAYS[(showBlockModal.dayOfWeek ?? 1) === 0 ? 6 : (showBlockModal.dayOfWeek ?? 1) - 1]}) чи всі ${related.length} однакові блоки?\n\nОК = всі, Скасувати = лише цей`);
                    if (choice) {
                        related.forEach(b => deleteTimeBlock(b.id));
                    } else {
                        deleteTimeBlock(showBlockModal.id as string);
                    }
                } else {
                    deleteTimeBlock(showBlockModal.id as string);
                }
                setShowBlockModal(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showBlockModal, timeBlocks, deleteTimeBlock]);

    const relatedBlocksForModal = showBlockModal ? findRelatedBlocks(showBlockModal) : [];
    const isMultiDayBlock = relatedBlocksForModal.length > 1;

    return (
        <div className="flex flex-col h-full bg-[var(--bg-card)] rounded-xl md:rounded-3xl overflow-hidden shadow-xl border border-[var(--border-color)] animate-in fade-in duration-300">
            <div className="flex-1 overflow-x-auto custom-scrollbar relative flex flex-col">
                <div className="min-w-max flex flex-col flex-1">
                    <div className="flex sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                        <div style={{ width: HOUR_COLUMN_WIDTH }} className="sticky left-0 z-50 bg-[var(--bg-card)] border-r border-[var(--border-color)] shrink-0 flex items-center justify-center">
                            <div className="text-[7px] md:text-[9px] font-black uppercase text-[var(--primary)] text-center opacity-70">
                                Рутина<br />Тижня
                            </div>
                        </div>
                        {WEEK_DAYS.map((dayName, idx) => (
                            <div key={idx} style={{ width: `calc((100vw - ${HOUR_COLUMN_WIDTH}px - 48px) / 7)` }} className="min-w-[100px] md:min-w-[140px] p-2 md:p-3 text-center border-r border-[var(--border-color)] last:border-r-0 shrink-0">
                                <div className="text-[7px] md:text-[9px] font-black uppercase text-[var(--text-main)] mb-1">{dayName}</div>
                                <Button onClick={() => openModal({ dayOfWeek: idx === 6 ? 0 : idx + 1, startHour: 9, endHour: 10 })} variant="secondary" className="px-2 py-1 h-auto text-[7px] text-[var(--text-muted)] hover:text-[var(--primary)] w-full rounded-md border-dashed shadow-none bg-transparent">
                                    <i className="fa-solid fa-plus mr-1"></i> Додати
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div ref={scrollRef} className="flex flex-1 relative overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        <div style={{ width: HOUR_COLUMN_WIDTH }} className="sticky left-0 z-30 bg-[var(--bg-card)] border-r border-[var(--border-color)] shrink-0">
                            {Array.from({ length: 24 }, (_, i) => (
                                <div key={i} style={{ height: HOUR_HEIGHT }} className="text-[7px] md:text-[9px] font-black text-[var(--text-muted)] text-right pr-2 md:pr-4 pt-1 border-b border-[var(--border-color)]/20 opacity-50 tabular-nums">{i}:00</div>
                            ))}
                        </div>

                        {WEEK_DAYS.map((_, idx) => {
                            const dayOfWeekNum = idx === 6 ? 0 : idx + 1;
                            const dayBlocks = timeBlocks.filter(b => b.dayOfWeek === dayOfWeekNum);

                            return (
                                <div key={idx} style={{ width: `calc((100vw - ${HOUR_COLUMN_WIDTH}px - 48px) / 7)` }} className="flex-1 min-w-[100px] md:min-w-[140px] border-r border-[var(--border-color)] last:border-r-0 relative group shrink-0">
                                    {Array.from({ length: 24 }, (_, i) => {
                                        const isOver = dragOverCell?.day === dayOfWeekNum && dragOverCell?.hour === i;
                                        return (
                                            <div
                                                key={i}
                                                onClick={() => openModal({ dayOfWeek: dayOfWeekNum, startHour: i, endHour: i + 1 })}
                                                onDragOver={(e) => handleDragOver(e, dayOfWeekNum, i)}
                                                onDragLeave={() => setDragOverCell(null)}
                                                onDrop={(e) => handleDrop(e, dayOfWeekNum, i)}
                                                style={{ height: HOUR_HEIGHT }}
                                                className={`border-b border-[var(--border-color)]/10 cursor-crosshair z-0 relative transition-colors ${isOver ? 'bg-[var(--primary)]/20' : 'hover:bg-[var(--primary)]/10'}`}
                                            ></div>
                                        );
                                    })}

                                    {dayBlocks.map(block => {
                                        const isPreview = resizePreview?.id === block.id;
                                        const endHour = isPreview ? resizePreview.endHour : block.endHour;
                                        const top = block.startHour * HOUR_HEIGHT;
                                        const h = (endHour - block.startHour) * HOUR_HEIGHT;
                                        const isResizingThis = resizingRef.current?.id === block.id;
                                        return (
                                            <div
                                                key={block.id}
                                                draggable={!isResizingThis}
                                                onDragStart={e => {
                                                    draggingBlockRef.current = block.id;
                                                    e.dataTransfer.setData('blockId', block.id);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }}
                                                onDragEnd={() => { draggingBlockRef.current = null; setDragOverCell(null); }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!resizingRef.current) openModal(block);
                                                }}
                                                className={`absolute left-1 right-1 rounded-xl shadow-sm border border-black/10 p-2 cursor-pointer transition-all hover:shadow-md z-10 flex flex-col justify-start min-h-[24px] overflow-hidden group/block select-none ${isResizingThis ? 'opacity-80 scale-[1.02] z-20 cursor-ns-resize' : 'hover:scale-[1.02]'}`}
                                                style={{ top: top + 1, height: h - 2, backgroundColor: block.color || 'var(--primary)', color: '#fff' }}
                                            >
                                                <div className="text-[12px] md:text-[15px] font-black tracking-tight leading-tight truncate mb-1 text-white drop-shadow-md pointer-events-none">{block.title}</div>
                                                {h >= HOUR_HEIGHT / 1.5 && (
                                                    <div className="text-[9px] md:text-[11px] font-bold opacity-95 mt-0.5 truncate flex items-center gap-1 text-white drop-shadow-md pointer-events-none">
                                                        <i className="fa-regular fa-clock"></i>
                                                        {block.startHour}:00 - {endHour}:00
                                                    </div>
                                                )}
                                                {/* Resize handle */}
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover/block:opacity-100 bg-black/10 transition-opacity flex items-center justify-center hover:bg-black/20"
                                                    onMouseDown={e => startResize(e, block)}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <div className="w-4 h-0.5 bg-white/50 rounded-full"></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Block Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBlockModal(null)}></div>
                    <div className="bg-[var(--bg-card)] w-full max-w-xs rounded-3xl p-5 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[var(--border-color)] flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <Typography variant="h2" className="text-sm font-black uppercase text-[var(--text-main)]">
                                {showBlockModal.id ? 'Редагувати Блок' : 'Новий Блок'}
                            </Typography>
                            {showBlockModal.id && (
                                <div className="flex items-center gap-1">
                                    {isMultiDayBlock && (
                                        <span className="text-[7px] font-black uppercase text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-lg">
                                            {relatedBlocksForModal.length} дні
                                        </span>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (isMultiDayBlock) {
                                                const choice = confirm(`Видалити лише цей блок чи всі ${relatedBlocksForModal.length} однакові?\n\nОК = всі, Скасувати = лише цей`);
                                                handleDeleteBlock(showBlockModal.id as string, choice);
                                            } else {
                                                if (confirm('Видалити блок?')) handleDeleteBlock(showBlockModal.id as string, false);
                                            }
                                        }}
                                        className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-trash text-[10px]"></i>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                            <div>
                                <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block tracking-widest pl-1">Дія або Рутина</label>
                                <input
                                    autoFocus
                                    value={showBlockModal.title || ''}
                                    onChange={e => setShowBlockModal({ ...showBlockModal, title: e.target.value })}
                                    placeholder="Репетитор..."
                                    autoComplete="off"
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2.5 px-3 text-xs font-bold focus:border-[var(--primary)] outline-none text-[var(--text-main)] transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1.5 block tracking-widest pl-1">Дні тижня</label>
                                <div className="flex justify-between items-center bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--border-color)]">
                                    {WEEK_DAYS.map((dayName, idx) => {
                                        const dayCode = idx === 6 ? 0 : idx + 1;
                                        const isSelected = modalDays.includes(dayCode);
                                        return (
                                            <button
                                                key={dayCode}
                                                onClick={() => setModalDays(prev => prev.includes(dayCode) ? prev.filter(d => d !== dayCode) : [...prev, dayCode].sort())}
                                                className={`w-7 h-7 rounded-lg text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]/50'}`}
                                            >
                                                {dayName.charAt(0)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block tracking-widest pl-1">Початок</label>
                                    <input
                                        type="number" min="0" max="23"
                                        value={showBlockModal.startHour ?? 5}
                                        onChange={e => setShowBlockModal({ ...showBlockModal, startHour: parseInt(e.target.value) })}
                                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-main)] transition-colors"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block tracking-widest pl-1">Кінець</label>
                                    <input
                                        type="number" min="1" max="24"
                                        value={showBlockModal.endHour ?? 6}
                                        onChange={e => setShowBlockModal({ ...showBlockModal, endHour: Math.max(parseInt(e.target.value), (showBlockModal.startHour || 0) + 1) })}
                                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-main)] transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block tracking-widest pl-1">Колір</label>
                                <div className="flex flex-wrap gap-1.5 p-1 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    {['var(--primary)', '#f97316', '#10b981', '#6366f1', '#ec4899', '#facc15', '#0ea5e9'].map(c => (
                                        <button key={c} onClick={() => setShowBlockModal({ ...showBlockModal, color: c })} className={`w-6 h-6 rounded-md border-2 transition-all ${showBlockModal.color === c ? 'border-[var(--text-main)] scale-110 shadow-sm' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`} style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 mt-2 border-t border-[var(--border-color)]/50 shrink-0">
                            <Button variant="white" className="flex-1 py-2.5 text-[9px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]" onClick={() => setShowBlockModal(null)}>ВІДМІНА</Button>
                            {showBlockModal.id && isMultiDayBlock ? (
                                <>
                                    <Button
                                        variant="secondary"
                                        disabled={!showBlockModal.title || modalDays.length === 0}
                                        className="flex-1 py-2.5 text-[8px] rounded-xl"
                                        onClick={() => handleSaveBlock({
                                            title: showBlockModal.title || 'Block',
                                            startHour: showBlockModal.startHour ?? 5,
                                            endHour: showBlockModal.endHour ?? 6,
                                            type: 'work',
                                            color: showBlockModal.color || 'var(--primary)',
                                            dayOfWeek: modalDays[0] || 1
                                        }, false)}
                                    >
                                        ЦЬОГО ДНЯ
                                    </Button>
                                    <Button
                                        variant="primary"
                                        disabled={!showBlockModal.title || modalDays.length === 0}
                                        className="flex-1 py-2.5 text-[8px] rounded-xl border-none bg-[var(--primary)] text-white hover:brightness-110 shadow-md shadow-[var(--primary)]/20"
                                        onClick={() => handleSaveBlock({
                                            title: showBlockModal.title || 'Block',
                                            startHour: showBlockModal.startHour ?? 5,
                                            endHour: showBlockModal.endHour ?? 6,
                                            type: 'work',
                                            color: showBlockModal.color || 'var(--primary)',
                                            dayOfWeek: modalDays[0] || 1
                                        }, true)}
                                    >
                                        УСІ ДНІ
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="primary"
                                    disabled={!showBlockModal.title || modalDays.length === 0}
                                    className="flex-[2] py-2.5 text-[9px] rounded-xl border-none bg-[var(--primary)] text-white hover:brightness-110 shadow-md shadow-[var(--primary)]/20"
                                    onClick={() => handleSaveBlock({
                                        title: showBlockModal.title || 'Block',
                                        startHour: showBlockModal.startHour ?? 5,
                                        endHour: showBlockModal.endHour ?? 6,
                                        type: 'work',
                                        color: showBlockModal.color || 'var(--primary)',
                                        dayOfWeek: modalDays[0] || 1
                                    }, false)}
                                >
                                    ЗБЕРЕГТИ
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
