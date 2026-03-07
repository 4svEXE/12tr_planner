import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import Typography from '../ui/Typography';
import Button from '../ui/Button';

const RewardsStore: React.FC = () => {
    const { customRewards, purchasedRewards, character, addReward, deleteReward, buyReward } = useAppStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCost, setNewCost] = useState(50);
    const [newIcon, setNewIcon] = useState('fa-gamepad');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim()) {
            addReward(newTitle.trim(), newCost, newIcon);
            setNewTitle('');
            setIsAdding(false);
        }
    };

    const activeRewards = customRewards || [];
    const history = purchasedRewards || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shadow-inner border border-amber-500/20">
                        <i className="fa-solid fa-store"></i>
                    </div>
                    <div>
                        <Typography variant="h2" className="text-xl font-bold uppercase">Магазин Нагород</Typography>
                        <Typography variant="tiny" className="text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Витрачай золото на реальні нагороди</Typography>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-amber-500 text-amber-950 px-5 py-2.5 rounded-2xl font-black shadow-lg shadow-amber-500/20 border-b-4 border-amber-600">
                    <i className="fa-solid fa-coins"></i>
                    <span>{character.gold} G</span>
                </div>
            </div>

            {isAdding ? (
                <form onSubmit={handleAdd} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-3xl space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                <i className={`fa-solid ${newIcon}`}></i>
                            </div>
                            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Назва (напр. Година гри, Піца)" className="w-full bg-black/5 dark:bg-white/5 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none text-[var(--text-main)] placeholder-[var(--text-muted)]/50" autoFocus />
                        </div>
                        <div className="flex gap-4">
                            <input type="number" value={newCost} onChange={(e) => setNewCost(parseInt(e.target.value) || 0)} className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-black outline-none text-amber-500 text-center" />
                            <Button type="submit" variant="primary" className="whitespace-nowrap rounded-xl px-6"><i className="fa-solid fa-check"></i></Button>
                        </div>
                    </div>
                    <div className="flex gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-xl overflow-x-auto no-scrollbar">
                        {['fa-gamepad', 'fa-film', 'fa-pizza-slice', 'fa-bed', 'fa-plane', 'fa-book', 'fa-gift', 'fa-mug-hot', 'fa-ticket'].map(icon => (
                            <button key={icon} type="button" onClick={() => setNewIcon(icon)} className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-lg transition-colors ${newIcon === icon ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                <i className={`fa-solid ${icon}`}></i>
                            </button>
                        ))}
                    </div>
                </form>
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full py-6 border-2 border-dashed border-[var(--border-color)] rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] flex flex-col items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-plus text-xl mb-2 text-[var(--text-muted)]"></i>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">Додати нову нагороду</span>
                </button>
            )}

            {activeRewards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeRewards.map(reward => (
                        <div key={reward.id} className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-[2rem] hover:border-amber-500/50 transition-colors shadow-sm flex flex-col items-center text-center">
                            <button onClick={() => deleteReward(reward.id)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity shrink-0">
                                <i className="fa-solid fa-trash"></i>
                            </button>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-amber-500 flex items-center justify-center text-3xl mb-6 shadow-inner border border-amber-500/10">
                                <i className={`fa-solid ${reward.icon}`}></i>
                            </div>
                            <div className="text-sm font-black text-[var(--text-main)] mb-1 leading-tight flex-1 flex items-center justify-center min-h-[2.5rem]">{reward.title}</div>
                            <div className="text-xs font-black text-amber-500 uppercase tracking-widest mb-6 px-4 py-1.5 rounded-lg bg-amber-500/10">{reward.cost} G</div>

                            <button
                                onClick={() => buyReward(reward.id) ? alert('Придбано! Насолоджуйтесь.') : alert('Недостатньо золота.')}
                                disabled={character.gold < reward.cost}
                                className="w-full py-4 bg-[var(--bg-main)] hover:bg-amber-500 hover:text-white disabled:opacity-50 disabled:hover:bg-[var(--bg-main)] disabled:hover:text-[var(--text-main)] border border-[var(--border-color)] disabled:border-[var(--border-color)] border-b-4 hover:border-b-amber-600 active:border-b active:translate-y-[3px] rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-cart-shopping"></i> Придбати
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {history.length > 0 && (
                <div className="mt-12 pt-8 border-t border-[var(--border-color)] w-full">
                    <Typography variant="tiny" className="font-bold uppercase tracking-widest text-[10px] opacity-40 mb-6">Історія покупок</Typography>
                    <div className="space-y-2">
                        {history.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm shrink-0">
                                        <i className={`fa-solid ${item.icon}`}></i>
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <div className="text-xs font-bold text-[var(--text-main)] truncate">{item.title}</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">{new Date(item.purchasedAt).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-black text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-lg shrink-0">- {item.cost} G</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardsStore;
