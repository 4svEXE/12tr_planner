import React, { useState, useEffect, useRef } from 'react';
import { Task, TableColumn, TableRow, CellStyle } from '../types';
import { useApp } from '../contexts/AppContext';

const TABLE_THEMES = {
    default: {
        bg: 'bg-slate-50',
        headerBg: 'bg-white',
        headerText: 'text-slate-600',
        cellBg: 'bg-white',
        cellText: 'text-slate-800',
        borderColor: 'border-slate-200',
        selectedRing: 'ring-indigo-500',
        toolbarBg: 'bg-white/95',
        toolbarBtn: 'hover:bg-slate-100 text-slate-600',
        activeBtn: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    dark: {
        bg: 'bg-slate-900',
        headerBg: 'bg-slate-800',
        headerText: 'text-slate-300',
        cellBg: 'bg-slate-800',
        cellText: 'text-slate-100',
        borderColor: 'border-slate-700',
        selectedRing: 'ring-indigo-400',
        toolbarBg: 'bg-slate-800/95',
        toolbarBtn: 'hover:bg-slate-700 text-slate-300',
        activeBtn: 'bg-indigo-900/40 text-indigo-300 border-indigo-700'
    },
    professional: {
        bg: 'bg-white',
        headerBg: 'bg-gray-100',
        headerText: 'text-gray-700',
        cellBg: 'bg-white',
        cellText: 'text-gray-900',
        borderColor: 'border-gray-200',
        selectedRing: 'ring-blue-600',
        toolbarBg: 'bg-white',
        toolbarBtn: 'hover:bg-gray-100 text-gray-700',
        activeBtn: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    ocean: {
        bg: 'bg-cyan-50',
        headerBg: 'bg-white',
        headerText: 'text-cyan-800',
        cellBg: 'bg-white',
        cellText: 'text-cyan-900',
        borderColor: 'border-cyan-100',
        selectedRing: 'ring-cyan-500',
        toolbarBg: 'bg-white/95',
        toolbarBtn: 'hover:bg-cyan-50 text-cyan-700',
        activeBtn: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    },
    pastel: {
        bg: 'bg-pink-50',
        headerBg: 'bg-white',
        headerText: 'text-pink-800',
        cellBg: 'bg-white',
        cellText: 'text-pink-900',
        borderColor: 'border-pink-100',
        selectedRing: 'ring-pink-400',
        toolbarBg: 'bg-white/95',
        toolbarBtn: 'hover:bg-pink-50 text-pink-700',
        activeBtn: 'bg-pink-100 text-pink-800 border-pink-200'
    }
} as const;

interface TableEditorProps {
    task: Task;
}

const TableEditor: React.FC<TableEditorProps> = ({ task }) => {
    const { updateTask } = useApp();

    // Core Data State - Large grid by default
    const [columns, setColumns] = useState<TableColumn[]>(() => {
        if (task.tableData?.columns?.length) return task.tableData.columns;
        return Array.from({ length: 15 }, (_, i) => ({
            id: `col_${i}`,
            name: '',
            type: 'text',
            width: 120
        }));
    });

    const [rows, setRows] = useState<TableRow[]>(() => {
        if (task.tableData?.rows?.length) return task.tableData.rows;
        return Array.from({ length: 30 }, (_, i) => ({
            id: `row_${i}`,
            cells: {}
        }));
    });
    const [theme, setTheme] = useState<keyof typeof TABLE_THEMES>(task.tableData?.theme || 'default');
    const [selectedCell, setSelectedCell] = useState<{ rowId: string, colId: string } | null>(null);

    const currentTheme = TABLE_THEMES[theme];

    // Debounce Save
    useEffect(() => {
        const handler = setTimeout(() => {
            updateTask({
                ...task,
                tableData: { columns, rows, theme }
            });
        }, 1000);
        return () => clearTimeout(handler);
    }, [columns, rows, theme]);

    // Helpers
    const getColLetter = (index: number) => String.fromCharCode(65 + index);

    // Operations
    const addColumn = () => {
        const newColId = 'col_' + Math.random().toString(36).substring(2, 9);
        setColumns([...columns, { id: newColId, name: '', type: 'text', width: 150 }]);
        setRows(rows.map(r => ({ ...r, cells: { ...r.cells, [newColId]: '' } })));
    };

    const addRow = () => {
        const newRowId = 'row_' + Math.random().toString(36).substring(2, 9);
        const newCells: Record<string, any> = {};
        columns.forEach(c => newCells[c.id] = '');
        setRows([...rows, { id: newRowId, cells: newCells }]);
    };

    const deleteRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(rs => rs.filter(r => r.id !== id));
        if (selectedCell?.rowId === id) setSelectedCell(null);
    };

    const deleteCol = (id: string) => {
        if (columns.length <= 1) return;
        setColumns(cs => cs.filter(c => c.id !== id));
        if (selectedCell?.colId === id) setSelectedCell(null);
    };

    const updateCell = (rowId: string, colId: string, value: any) => {
        setRows(rows.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r));
    };

    const updateSelectedStyle = (updates: Partial<CellStyle>) => {
        if (!selectedCell) return;
        setRows(rows.map(r => {
            if (r.id !== selectedCell.rowId) return r;
            const styles = r.cellStyles || {};
            const currentStyle = styles[selectedCell.colId] || {};
            return {
                ...r,
                cellStyles: {
                    ...styles,
                    [selectedCell.colId]: { ...currentStyle, ...updates }
                }
            };
        }));
    };

    const getCellStyle = (rowId: string, colId: string) => {
        const row = rows.find(r => r.id === rowId);
        return row?.cellStyles?.[colId] || {};
    };

    const getSelectedStyle = () => {
        if (!selectedCell) return {};
        const row = rows.find(r => r.id === selectedCell.rowId);
        return row?.cellStyles?.[selectedCell.colId] || {};
    };

    return (
        <div className={`w-full h-full flex flex-col ${currentTheme.bg}`}>
            {/* Toolbar Area */}
            <div className={`sticky top-0 z-30 ${currentTheme.toolbarBg} border-b ${currentTheme.borderColor} p-2 flex items-center gap-2 shadow-sm`}>
                <div className="flex items-center gap-0.5 border-r pr-2 border-slate-200 dark:border-slate-700">
                    <button onClick={addRow} className={`p-2 rounded hover:bg-black/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${currentTheme.headerText}`} title="Додати рядок">
                        <i className="fa-solid fa-plus-circle text-indigo-500"></i> Рядок
                    </button>
                    <button onClick={addColumn} className={`p-2 rounded hover:bg-black/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${currentTheme.headerText}`} title="Додати стовпець">
                        <i className="fa-solid fa-plus-circle text-emerald-500"></i> Стовпець
                    </button>
                </div>

                <div className="flex items-center gap-1 border-r pr-2 border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => updateSelectedStyle({ bold: !getSelectedStyle().bold })}
                        disabled={!selectedCell}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${getSelectedStyle().bold ? currentTheme.activeBtn : currentTheme.toolbarBtn} disabled:opacity-30`}
                        title="Жирний"
                    >
                        <i className="fa-solid fa-bold"></i>
                    </button>
                    <button
                        onClick={() => updateSelectedStyle({ italic: !getSelectedStyle().italic })}
                        disabled={!selectedCell}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${getSelectedStyle().italic ? currentTheme.activeBtn : currentTheme.toolbarBtn} disabled:opacity-30`}
                        title="Курсив"
                    >
                        <i className="fa-solid fa-italic"></i>
                    </button>
                    <div className="relative group">
                        <button className={`w-8 h-8 rounded flex items-center justify-center ${currentTheme.toolbarBtn} disabled:opacity-30`} disabled={!selectedCell} title="Колір тексту">
                            <i className="fa-solid fa-font" style={{ color: getSelectedStyle().color }}></i>
                        </button>
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl hidden group-hover:flex flex-wrap gap-1 w-32 z-[100]">
                            {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#000000'].map(c => (
                                <button key={c} onClick={() => updateSelectedStyle({ color: c })} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                    <div className="relative group">
                        <button className={`w-8 h-8 rounded flex items-center justify-center ${currentTheme.toolbarBtn} disabled:opacity-30`} disabled={!selectedCell} title="Колір фону">
                            <i className="fa-solid fa-fill-drip" style={{ color: getSelectedStyle().bg }}></i>
                        </button>
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl hidden group-hover:flex flex-wrap gap-1 w-32 z-[100]">
                            {['#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7', '#e0f2fe', '#eef2ff', '#f5f3ff', '#ffffff'].map(c => (
                                <button key={c} onClick={() => updateSelectedStyle({ bg: c })} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 border-r pr-2 border-slate-200 dark:border-slate-700">
                    {(['left', 'center', 'right'] as const).map(align => (
                        <button
                            key={align}
                            disabled={!selectedCell}
                            onClick={() => updateSelectedStyle({ align })}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${getSelectedStyle().align === align ? currentTheme.activeBtn : currentTheme.toolbarBtn} disabled:opacity-30`}
                            title={`Вирівнювання по ${align === 'left' ? 'лівому' : align === 'center' ? 'центру' : 'правому'} краю`}
                        >
                            <i className={`fa-solid fa-align-${align}`}></i>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 mr-4">
                    <span className="text-[9px] font-black uppercase opacity-40 ml-2 whitespace-nowrap">Тема:</span>
                    {(Object.keys(TABLE_THEMES) as Array<keyof typeof TABLE_THEMES>).map(t => (
                        <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`w-4 h-4 rounded-full border-2 ${theme === t ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: t === 'dark' ? '#1e293b' : t === 'professional' ? '#cbd5e1' : t === 'ocean' ? '#06b6d4' : t === 'pastel' ? '#fbcfe8' : '#f1f5f9' }}
                        />
                    ))}
                </div>

                <div className="flex-1"></div>
            </div>

            {/* Expansive Grid Area */}
            <div className={`flex-1 overflow-auto custom-scrollbar relative ${currentTheme.bg}`}>
                <table className="border-collapse table-fixed min-w-full">
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th className={`w-8 border ${currentTheme.borderColor} ${currentTheme.headerBg} sticky left-0 z-30`}></th>
                            {columns.map((col, idx) => (
                                <th
                                    key={col.id}
                                    style={{ width: col.width || 120 }}
                                    className={`relative border ${currentTheme.borderColor} ${currentTheme.headerBg} h-6 group transition-colors`}
                                >
                                    <input
                                        type="text"
                                        value={col.name}
                                        placeholder={getColLetter(idx)}
                                        onChange={e => setColumns(columns.map(c => c.id === col.id ? { ...c, name: e.target.value } : c))}
                                        className="w-full h-full bg-transparent px-2 text-[9px] font-black text-center outline-none placeholder:opacity-20 uppercase tracking-tighter"
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteCol(col.id); }}
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[6px] z-10 shadow-sm"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </th>
                            ))}
                            <th className={`w-10 border-b ${currentTheme.borderColor}`}>
                                <button onClick={addColumn} className={`w-full h-full flex items-center justify-center hover:bg-black/5 ${currentTheme.headerText} opacity-30 hover:opacity-100 transition-opacity`}>
                                    <i className="fa-solid fa-plus text-[10px]"></i>
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rIdx) => (
                            <tr key={row.id} className="group">
                                <td className={`w-8 border ${currentTheme.borderColor} sticky left-0 z-10 ${currentTheme.headerBg} text-[8px] font-black text-center opacity-20 group-hover:opacity-100 transition-opacity`}>
                                    <div className="relative h-full flex items-center justify-center min-h-[30px]">
                                        <span className="group-hover:hidden">{rIdx + 1}</span>
                                        <button
                                            onClick={() => deleteRow(row.id)}
                                            className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-rose-500 text-white text-[8px]"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                                {columns.map(col => {
                                    const value = row.cells[col.id] || '';
                                    const style = getCellStyle(row.id, col.id);
                                    const isSelected = selectedCell?.rowId === row.id && selectedCell?.colId === col.id;

                                    return (
                                        <td
                                            key={`${row.id}-${col.id}`}
                                            onClick={() => setSelectedCell({ rowId: row.id, colId: col.id })}
                                            className={`border ${currentTheme.borderColor} p-0 relative transition-none ${currentTheme.cellBg} ${isSelected ? 'z-10' : ''}`}
                                        >
                                            {isSelected && (
                                                <div className="absolute inset-[-1px] border-2 border-indigo-500 pointer-events-none z-20"></div>
                                            )}
                                            <textarea
                                                value={value}
                                                onChange={e => updateCell(row.id, col.id, e.target.value)}
                                                className={`w-full h-full bg-transparent px-2 py-1 text-xs outline-none border-none resize-none 
                                                    ${style.bold ? 'font-black' : 'font-medium'} 
                                                    ${style.italic ? 'italic' : ''}
                                                    ${currentTheme.cellText}
                                                `}
                                                style={{
                                                    textAlign: style.align || 'left',
                                                    color: style.color || undefined,
                                                    backgroundColor: style.bg || undefined,
                                                    minHeight: '30px'
                                                }}
                                                rows={1}
                                            />
                                        </td>
                                    );
                                })}
                                <td className={`border-b ${currentTheme.borderColor} opacity-30`}></td>
                            </tr>
                        ))}
                        <tr>
                            <td className={`h-10 border-r ${currentTheme.borderColor}`}>
                                <button onClick={addRow} className={`w-full h-full flex items-center justify-center hover:bg-black/5 ${currentTheme.headerText} opacity-30 hover:opacity-100 transition-opacity`}>
                                    <i className="fa-solid fa-plus text-[10px]"></i>
                                </button>
                            </td>
                            <td colSpan={columns.length} className="p-0 border-none">
                                <button
                                    onClick={addRow}
                                    className={`w-full h-10 flex items-center justify-center text-[10px] font-black uppercase ${currentTheme.headerText} opacity-20 hover:opacity-100 hover:text-indigo-500 hover:bg-black/5 transition-all border-b border-dashed ${currentTheme.borderColor}`}
                                >
                                    + Додати рядок
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default TableEditor;
