
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ShoppingStore, ShoppingItem, PriceEntry } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useResizer } from '../hooks/useResizer';

const ShoppingItemDetails: React.FC<{ item: ShoppingItem, onClose: () => void }> = ({ item, onClose }) => {
  const { shoppingItems, shoppingStores, updateShoppingItem, deleteShoppingItem } = useApp();
  const [localItem, setLocalItem] = useState(item);
  const [newPrice, setNewPrice] = useState('');
  const [newStoreName, setNewStoreName] = useState('');

  const handleUpdate = (updates: Partial<ShoppingItem>) => {
    const newItem = { ...localItem, ...updates };
    setLocalItem(newItem);
    updateShoppingItem(newItem);
  };

  const handleAddPriceLog = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal) || !newStoreName.trim()) return;

    const newEntry: PriceEntry = {
      id: Math.random().toString(36).substr(2, 9),
      price: priceVal,
      storeName: newStoreName.trim(),
      date: Date.now()
    };

    const history = localItem.priceHistory || [];
    handleUpdate({ priceHistory: [newEntry, ...history] });
    setNewPrice('');
    setNewStoreName('');
  };

  const deletePriceLog = (logId: string) => {
    const history = (localItem.priceHistory || []).filter(l => l.id !== logId);
    handleUpdate({ priceHistory: history });
  };

  const globalBestPrice = useMemo(() => {
    const allMatchingItems = shoppingItems.filter(i => i.name.toLowerCase() === item.name.toLowerCase());
    const allPrices = allMatchingItems.flatMap(i => i.priceHistory || []).map(p => p.price);
    return allPrices.length > 0 ? Math.min(...allPrices) : null;
  }, [shoppingItems, item.name]);

  return (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
      <header className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
        <Typography variant="h2" className="text-lg md:text-xl">Контроль ціни</Typography>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </header>

      <div className="flex-1 p-5 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Головний блок: Назва + Нотатка */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <Typography variant="tiny" className="text-slate-400 font-black uppercase ml-1">Продукт</Typography>
            <input 
              value={localItem.name} 
              onChange={e => handleUpdate({ name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-5 text-lg font-black focus:ring-4 focus:ring-orange-100 outline-none transition-all"
            />
          </div>
          
          <div className="space-y-1.5">
            <Typography variant="tiny" className="text-slate-400 font-black uppercase ml-1">Нотатки / Опис</Typography>
            <textarea 
              value={localItem.note || ''} 
              onChange={e => handleUpdate({ note: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-orange-100 outline-none min-h-[80px] resize-none leading-relaxed"
              placeholder="Який сорт? Важливі деталі..."
            />
          </div>
        </section>

        {globalBestPrice !== null && (
          <section className="bg-emerald-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-emerald-100">
             <div className="flex items-center gap-2 mb-1">
                <i className="fa-solid fa-trophy text-emerald-500 text-xs"></i>
                <Typography variant="tiny" className="text-emerald-600 font-black uppercase tracking-widest text-[9px]">Найкраща ціна</Typography>
             </div>
             <p className="text-sm font-bold text-emerald-800 leading-tight">В історії за "{item.name}": <br/><span className="text-xl md:text-2xl font-black underline decoration-emerald-200 underline-offset-4">{globalBestPrice} ₴</span></p>
          </section>
        )}

        <section className="space-y-3">
          <Typography variant="tiny" className="text-slate-900 font-black uppercase flex items-center gap-2 text-[9px]">
            <i className="fa-solid fa-pen-nib text-orange-500"></i> Записати покупку
          </Typography>
          <form onSubmit={handleAddPriceLog} className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
             <div className="space-y-1">
                <span className="text-[7px] font-black uppercase text-slate-400 ml-1">Ціна</span>
                <input 
                  type="number" 
                  step="0.01"
                  inputMode="decimal"
                  value={newPrice} 
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="0.00 ₴"
                  className="w-full bg-white border border-slate-100 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-200"
                />
             </div>
             <div className="space-y-1">
                <span className="text-[7px] font-black uppercase text-slate-400 ml-1">Магазин</span>
                <input 
                  list="stores-list"
                  value={newStoreName} 
                  onChange={e => setNewStoreName(e.target.value)}
                  placeholder="Магазин..."
                  className="w-full bg-white border border-slate-100 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-200"
                />
             </div>
             <datalist id="stores-list">
               {shoppingStores.map(s => <option key={s.id} value={s.name} />)}
             </datalist>
             <button type="submit" className="col-span-2 mt-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-md">ЗБЕРЕГТИ В ЛОГ</button>
          </form>
        </section>

        <section className="space-y-4">
           <Typography variant="tiny" className="text-slate-400 font-black uppercase ml-1">Історія записів</Typography>
           <div className="space-y-2">
              {(localItem.priceHistory || []).map(log => (
                <div key={log.id} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-50 group/log shadow-sm">
                   <div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-black text-slate-800">{log.price} ₴</span>
                         <Badge variant="slate" className="text-[8px] py-0 px-1.5 opacity-60">{log.storeName}</Badge>
                      </div>
                      <div className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-wider">{new Date(log.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</div>
                   </div>
                   <button onClick={() => deletePriceLog(log.id)} className="w-8 h-8 rounded-lg text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              ))}
              {(!localItem.priceHistory || localItem.priceHistory.length === 0) && (
                <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Лог порожній</p>
                </div>
              )}
           </div>
        </section>
      </div>
      
      <footer className="p-4 md:p-6 border-t border-slate-50 bg-slate-50/30 flex gap-3 shrink-0 mb-safe">
        <button 
          onClick={() => { if(confirm('Видалити цей товар?')) { deleteShoppingItem(item.id); onClose(); } }} 
          className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
        >
          <i className="fa-solid fa-trash-can"></i>
        </button>
        <Button onClick={onClose} className="flex-1 rounded-2xl py-3 font-black tracking-widest text-[10px]">ЗАКРИТИ</Button>
      </footer>
    </div>
  );
};

const ShoppingView: React.FC = () => {
  const { shoppingStores, shoppingItems, addStore, updateStore, deleteStore, addShoppingItem, toggleShoppingItem, deleteShoppingItem, detailsWidth } = useApp();
  const { startResizing, isResizing } = useResizer(400, 700);

  const [activeStoreId, setActiveStoreId] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Стан для мобільної навігації (якщо true — показуємо список товарів, false — список магазинів)
  const [isContentViewVisible, setIsContentViewVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredItems = useMemo(() => {
    if (activeStoreId === 'all') return shoppingItems;
    return shoppingItems.filter(item => item.storeId === activeStoreId);
  }, [shoppingItems, activeStoreId]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (a.isBought === b.isBought) return 0;
      return a.isBought ? 1 : -1;
    });
  }, [filteredItems]);

  const getBestPriceFor = (name: string) => {
    const allMatching = shoppingItems.filter(i => i.name.toLowerCase() === name.toLowerCase());
    const allPrices = allMatching.flatMap(i => i.priceHistory || []).map(p => p.price);
    return allPrices.length > 0 ? Math.min(...allPrices) : null;
  };

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStoreName.trim()) {
      addStore(newStoreName.trim());
      setNewStoreName('');
      setIsAddingStore(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && activeStoreId !== 'all') {
      addShoppingItem(newItemName.trim(), activeStoreId);
      setNewItemName('');
    }
  };

  const handleSelectStore = (id: string) => {
    setActiveStoreId(id);
    if (isMobileView) setIsContentViewVisible(true);
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative">
      {/* Магазини - Sidebar */}
      <aside className={`w-full md:w-64 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col shrink-0 transition-transform duration-300 ${isMobileView && isContentViewVisible ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
         <header className="p-6 md:p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
               <Typography variant="h2" className="text-lg md:text-xl">Магазини</Typography>
               <Typography variant="tiny" className="text-[var(--text-muted)] tracking-tighter">Price Strategy</Typography>
            </div>
            <button onClick={() => setIsAddingStore(true)} className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm">
               <i className="fa-solid fa-plus text-xs"></i>
            </button>
         </header>

         <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
            <button 
              onClick={() => handleSelectStore('all')} 
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeStoreId === 'all' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100 shadow-sm font-black' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'}`}
            >
               <i className="fa-solid fa-layer-group text-xs w-4 text-center"></i>
               <span className="text-[11px] uppercase tracking-widest">Усі покупки</span>
               <span className="ml-auto text-[8px] opacity-40">{shoppingItems.length}</span>
            </button>

            <div className="my-4 border-t border-[var(--border-color)] opacity-50"></div>

            {isAddingStore && (
              <form onSubmit={handleAddStore} className="px-2 mb-2 animate-in slide-in-from-top-2">
                 <input autoFocus value={newStoreName} onChange={e => setNewStoreName(e.target.value)} onBlur={() => !newStoreName && setIsAddingStore(false)} placeholder="Назва магазину..." className="w-full bg-[var(--bg-main)] border border-orange-200 rounded-xl py-3 px-4 text-[10px] font-black uppercase outline-none" />
              </form>
            )}

            {shoppingStores.map(store => (
              <div key={store.id} className="group relative">
                <button 
                  onClick={() => handleSelectStore(store.id)} 
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeStoreId === store.id ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100 shadow-sm font-black' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'}`}
                >
                   <i className={`fa-solid ${store.icon} text-xs w-4 text-center`} style={{ color: store.color }}></i>
                   <span className="text-[11px] uppercase tracking-widest truncate pr-6">{store.name}</span>
                   <span className="ml-auto text-[8px] opacity-40">{shoppingItems.filter(i => i.storeId === store.id).length}</span>
                </button>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { if(confirm('Видалити магазин?')) deleteStore(store.id); }} className="text-[10px] hover:text-rose-500 transition-colors p-2"><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}
         </nav>
      </aside>

      {/* Список товарів */}
      <main className={`flex-1 flex flex-col bg-[var(--bg-main)] relative min-w-0 transition-transform duration-300 ${isMobileView && !isContentViewVisible ? 'translate-x-full' : 'translate-x-0'}`}>
         <header className="px-6 md:px-10 py-5 md:py-8 border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--bg-card)] sticky top-0 z-10 gap-4">
            <div className="flex items-center gap-3 w-full">
              {isMobileView && (
                <button onClick={() => setIsContentViewVisible(false)} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-1">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
              )}
              <Typography variant="h2" className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-3 truncate">
                <i className={`fa-solid ${activeStoreId === 'all' ? 'fa-layer-group' : 'fa-shop'} opacity-20 text-base md:text-lg`}></i>
                {activeStoreId === 'all' ? 'Усі покупки' : (shoppingStores.find(s => s.id === activeStoreId)?.name || 'Магазин')}
              </Typography>
            </div>
            
            {activeStoreId !== 'all' && (
              <form onSubmit={handleAddItem} className="flex gap-2 w-full md:w-auto">
                 <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Що купити?" className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 md:py-2 text-[12px] font-bold outline-none md:w-64 focus:ring-2 focus:ring-orange-500 transition-all" />
                 <Button type="submit" size="sm" className="rounded-xl font-black shadow-lg shrink-0 px-5">ДОДАТИ</Button>
              </form>
            )}
         </header>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10">
            <div className="flex flex-col gap-2 max-w-xl mx-auto md:mx-0">
               {sortedItems.length > 0 ? sortedItems.map(item => {
                 const store = shoppingStores.find(s => s.id === item.storeId);
                 const bestP = getBestPriceFor(item.name);
                 const lastPriceEntry = item.priceHistory && item.priceHistory.length > 0 ? item.priceHistory[0] : null;

                 return (
                   <Card 
                    key={item.id} 
                    padding="none" 
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-4 flex items-center justify-between group transition-all cursor-pointer ${item.isBought ? 'opacity-40 grayscale bg-slate-50' : 'bg-white border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-md'}`}
                   >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                         <button 
                           onClick={(e) => { e.stopPropagation(); toggleShoppingItem(item.id); }}
                           className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${item.isBought ? 'bg-emerald-500 border-emerald-500 text-white shadow-inner' : 'border-slate-200 bg-white hover:border-orange-400'}`}
                         >
                            {item.isBought && <i className="fa-solid fa-check text-xs"></i>}
                         </button>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                               <span className={`text-[13px] md:text-sm font-bold truncate max-w-[150px] md:max-w-none ${item.isBought ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.name}</span>
                               {lastPriceEntry && (
                                 <Badge variant="orange" className="text-[8px] font-black">{lastPriceEntry.price} ₴</Badge>
                               )}
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 mt-1.5 flex-wrap">
                               {activeStoreId === 'all' && store && (
                                 <Badge variant="slate" className="text-[7px] py-0 px-1 uppercase opacity-60 tracking-tighter">{store.name}</Badge>
                               )}
                               {bestP && !item.isBought && (
                                 <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                       Best: {bestP} ₴
                                    </span>
                                 </div>
                               )}
                               {lastPriceEntry && (
                                  <span className="text-[7px] font-bold text-slate-300 uppercase truncate">Останній в: {lastPriceEntry.storeName}</span>
                               )}
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {item.note && <i className="fa-solid fa-comment-dots text-orange-200 text-[10px] animate-bounce"></i>}
                        <i className="fa-solid fa-chevron-right text-[10px] text-slate-200 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all"></i>
                      </div>
                   </Card>
                 );
               }) : (
                 <div className="py-20 text-center opacity-10 flex flex-col items-center select-none pointer-events-none">
                    <i className="fa-solid fa-basket-shopping text-7xl mb-6"></i>
                    <Typography variant="h2" className="text-xl">Порожній список</Typography>
                    <Typography variant="body" className="mt-2 text-xs">Оберіть магазин та додайте товари</Typography>
                 </div>
               )}
            </div>
         </div>
      </main>

      {/* Панель деталей - На мобайлі повноекранна */}
      {selectedItemId && (
         <div className={`fixed md:relative inset-0 md:inset-auto flex h-full border-l border-[var(--border-color)] z-[100] md:z-40 bg-white md:bg-[var(--bg-card)] shrink-0 transition-all duration-300`}>
            {!isMobileView && (
              <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[110] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-[var(--border-color)]/50'}`}></div>
            )}
            <div style={{ width: isMobileView ? '100vw' : detailsWidth }} className="h-full bg-white relative overflow-hidden flex flex-col shadow-2xl">
               <ShoppingItemDetails 
                 item={shoppingItems.find(i => i.id === selectedItemId)!} 
                 onClose={() => setSelectedItemId(null)} 
               />
            </div>
         </div>
      )}
    </div>
  );
};

export default ShoppingView;
