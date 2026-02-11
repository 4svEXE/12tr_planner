import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingStore, ShoppingItem, PriceEntry } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useResizer } from '../hooks/useResizer';

const SharingModal: React.FC<{
  store: ShoppingStore,
  onClose: () => void,
  onShare: (email: string) => void
}> = ({ store, onClose, onShare }) => {
  const [email, setEmail] = useState('');

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      <Card className="w-full max-w-[340px] relative z-10 p-6 rounded-[2rem] bg-card border-theme shadow-2xl animate-in zoom-in-95 duration-200">
         <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-lg">
               <i className="fa-solid fa-share-nodes"></i>
            </div>
            <div>
               <Typography variant="h3" className="text-sm font-black uppercase text-main">Доступ</Typography>
               <Typography variant="tiny" className="text-muted tracking-tight">Спільний список</Typography>
            </div>
         </div>
         
         <div className="space-y-5">
           <div>
              <div className="flex gap-2">
                <input 
                  autoFocus 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Email партнера..." 
                  className="flex-1 h-10 bg-input border border-theme rounded-xl px-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all text-main shadow-inner" 
                />
                <button 
                  onClick={() => { if(email.includes('@')) { onShare(email); setEmail(''); } }}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
           </div>

           <div className="space-y-2">
              <Typography variant="tiny" className="text-muted font-black uppercase text-[7px] tracking-widest ml-1">Зараз мають доступ</Typography>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                 <div className="flex items-center gap-2.5 p-2.5 bg-indigo-50/10 rounded-xl border border-indigo-100/20">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[7px] font-black">YOU</div>
                    <span className="text-[10px] font-bold text-main truncate">{store.ownerEmail}</span>
                    <Badge variant="indigo" className="ml-auto text-[6px] py-0 px-1">OWNER</Badge>
                 </div>
                 {store.collaborators?.map(c => (
                    <div key={c} className="flex items-center gap-2.5 p-2.5 bg-black/5 rounded-xl border border-theme">
                       <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500"><i className="fa-solid fa-user"></i></div>
                       <span className="text-[10px] font-bold text-main truncate">{c}</span>
                       <i className="fa-solid fa-circle-check text-emerald-500 ml-auto text-[10px]"></i>
                    </div>
                 ))}
              </div>
           </div>

           <Button variant="white" className="w-full h-10 rounded-xl font-black tracking-widest text-[9px]" onClick={onClose}>ЗАКРИТИ</Button>
         </div>
      </Card>
    </div>
  );
};

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
    <div className="h-full flex flex-col bg-card animate-in slide-in-from-right duration-300 text-main">
      <header className="p-4 md:p-6 border-b border-theme flex justify-between items-center bg-card sticky top-0 z-10">
        <Typography variant="h2" className="text-lg md:text-xl">Контроль ціни</Typography>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-main flex items-center justify-center text-muted hover:text-primary transition-colors">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </header>

      <div className="flex-1 p-5 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
        <section className="space-y-4">
          <div className="space-y-1.5">
            <Typography variant="tiny" className="text-muted font-black uppercase ml-1 opacity-60">Продукт</Typography>
            <input 
              value={localItem.name} 
              onChange={e => handleUpdate({ name: e.target.value })}
              className="w-full h-8 bg-input border border-theme rounded px-3 text-xs font-black outline-none transition-all text-main"
            />
          </div>
          
          <div className="space-y-1.5">
            <Typography variant="tiny" className="text-muted font-black uppercase ml-1 opacity-60">Нотатки / Опис</Typography>
            <textarea 
              value={localItem.note || ''} 
              onChange={e => handleUpdate({ note: e.target.value })}
              className="w-full bg-input border border-theme rounded p-3 text-xs font-medium focus:ring-4 focus:ring-primary/10 outline-none min-h-[80px] resize-none leading-relaxed text-main"
              placeholder="Який сорт? Важливі деталі..."
            />
          </div>
        </section>

        {globalBestPrice !== null && (
          <section className="bg-primary/5 p-4 rounded border border-primary/20">
             <div className="flex items-center gap-2 mb-1">
                <i className="fa-solid fa-trophy text-primary text-xs"></i>
                <Typography variant="tiny" className="text-primary font-black uppercase tracking-widest text-[8px]">Найкраща ціна</Typography>
             </div>
             <p className="text-xs font-bold text-main leading-tight">В історії: <span className="text-lg font-black text-primary decoration-primary/20 underline-offset-4">{globalBestPrice} ₴</span></p>
          </section>
        )}

        <section className="space-y-3">
          <Typography variant="tiny" className="text-main font-black uppercase flex items-center gap-2 text-[9px]">
            <i className="fa-solid fa-pen-nib text-primary"></i> Записати покупку
          </Typography>
          <form onSubmit={handleAddPriceLog} className="grid grid-cols-2 gap-2 bg-input/50 p-2 rounded border border-theme">
             <div className="space-y-1">
                <span className="text-[7px] font-black uppercase text-muted ml-1">Ціна</span>
                <input 
                  type="number" 
                  step="0.01"
                  inputMode="decimal"
                  value={newPrice} 
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="0.00 ₴"
                  className="w-full h-8 bg-card border border-theme rounded px-2 text-[10px] font-bold outline-none text-main"
                />
             </div>
             <div className="space-y-1">
                <span className="text-[7px] font-black uppercase text-muted ml-1">Магазин</span>
                <input 
                  list="stores-list"
                  value={newStoreName} 
                  onChange={e => setNewStoreName(e.target.value)}
                  placeholder="Магазин..."
                  className="w-full h-8 bg-card border border-theme rounded px-2 text-[10px] font-bold outline-none text-main"
                />
             </div>
             <datalist id="stores-list">
               {shoppingStores.map(s => <option key={s.id} value={s.name} />)}
             </datalist>
             <button type="submit" className="col-span-2 h-8 bg-primary text-white rounded text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-md">ЗБЕРЕГТИ В ЛОГ</button>
          </form>
        </section>

        <section className="space-y-4">
           <Typography variant="tiny" className="text-muted font-black uppercase ml-1 opacity-60">Історія записів</Typography>
           <div className="space-y-2">
              {(localItem.priceHistory || []).map(log => (
                <div key={log.id} className="flex items-center justify-between p-2.5 bg-card rounded border border-theme group/log shadow-sm">
                   <div>
                      <div className="flex items-center gap-2">
                         <span className="text-[11px] font-black text-main">{log.price} ₴</span>
                         <Badge variant="slate" className="text-[7px] py-0 px-1 opacity-60">{log.storeName}</Badge>
                      </div>
                      <div className="text-[7px] font-black text-muted uppercase tracking-wider opacity-50">{new Date(log.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</div>
                   </div>
                   <button onClick={() => deletePriceLog(log.id)} className="w-7 h-7 rounded text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
                </div>
              ))}
              {(!localItem.priceHistory || localItem.priceHistory.length === 0) && (
                <div className="text-center py-6 bg-input/50 rounded border border-dashed border-theme">
                   <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Лог порожній</p>
                </div>
              )}
           </div>
        </section>
      </div>
      
      <footer className="p-4 md:p-6 border-t border-theme bg-main/30 flex gap-3 shrink-0 mb-safe">
        <button 
          onClick={() => { if(confirm('Видалити цей товар?')) { deleteShoppingItem(item.id); onClose(); } }} 
          className="w-10 h-10 rounded bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
        >
          <i className="fa-solid fa-trash-can text-sm"></i>
        </button>
        <Button onClick={onClose} variant="white" className="flex-1 h-10 rounded font-black tracking-widest text-[9px]">ЗАКРИТИ</Button>
      </footer>
    </div>
  );
};

const QuickAddShoppingModal: React.FC<{
  onClose: () => void;
  onAdd: (name: string, storeId: string) => void;
  stores: ShoppingStore[];
  defaultStoreId?: string;
}> = ({ onClose, onAdd, stores, defaultStoreId }) => {
  const [name, setName] = useState('');
  const [storeId, setStoreId] = useState(defaultStoreId || stores[0]?.id || '');

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      <Card className="w-full max-w-sm relative z-10 p-6 rounded-[2rem] bg-card border-theme shadow-2xl">
         <Typography variant="h2" className="mb-4 text-lg uppercase font-black text-main">Новий товар</Typography>
         <div className="space-y-4">
           <div>
              <label className="text-[9px] font-black uppercase text-muted mb-1 block ml-1">Що купити?</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Назва..." className="w-full h-10 bg-input border border-theme rounded-xl px-4 text-sm font-bold outline-none text-main shadow-inner" />
           </div>
           <div>
              <label className="text-[9px] font-black uppercase text-muted mb-1 block ml-1">Де купити?</label>
              <select value={storeId} onChange={e => setStoreId(e.target.value)} className="w-full h-10 bg-input border border-theme rounded-xl px-4 text-sm font-bold outline-none text-main appearance-none cursor-pointer">
                 {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>
           <div className="flex gap-2 pt-2">
             <Button variant="white" className="flex-1 h-10 rounded text-[9px]" onClick={onClose}>ВІДМІНА</Button>
             <Button disabled={!name.trim() || !storeId} className="flex-1 h-10 rounded text-[9px]" onClick={() => onAdd(name, storeId)}>ДОДАТИ</Button>
           </div>
         </div>
      </Card>
    </div>
  );
};

const ShoppingView: React.FC = () => {
  const { shoppingStores, shoppingItems, addStore, updateStore, deleteStore, shareStore, addShoppingItem, toggleShoppingItem, deleteShoppingItem, detailsWidth } = useApp();
  const { user } = useAuth();
  const { startResizing, isResizing } = useResizer(400, 700);

  const [activeStoreId, setActiveStoreId] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState<ShoppingStore | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
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

  const handleQuickAdd = (name: string, storeId: string) => {
    addShoppingItem(name, storeId);
    setIsQuickAdding(false);
  };

  return (
    <div className="h-screen flex bg-main overflow-hidden relative text-main transition-none">
      <aside className={`w-full md:w-64 border-r border-theme bg-sidebar flex flex-col shrink-0 transition-all duration-300 ${isMobileView && isContentViewVisible ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
         <header className="p-6 border-b border-theme flex justify-between items-center bg-card sticky top-0 z-10 shrink-0">
            <div>
               <Typography variant="h2" className="text-lg md:text-xl">Магазини</Typography>
               <Typography variant="tiny" className="text-muted tracking-tighter opacity-60">Price Strategy</Typography>
            </div>
            <button onClick={() => setIsAddingStore(true)} className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm">
               <i className="fa-solid fa-plus text-xs"></i>
            </button>
         </header>

         <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => handleSelectStore('all')} 
              className={`w-full flex items-center gap-4 px-5 py-3 rounded transition-all ${activeStoreId === 'all' ? 'bg-primary text-white shadow-lg font-black' : 'text-muted hover:bg-black/5'}`}
            >
               <i className="fa-solid fa-layer-group text-xs w-4 text-center"></i>
               <span className="text-[11px] uppercase tracking-widest">Усі покупки</span>
               <span className={`ml-auto text-[8px] font-black ${activeStoreId === 'all' ? 'text-white/60' : 'opacity-40'}`}>{shoppingItems.length}</span>
            </button>

            <div className="my-4 border-t border-theme opacity-30"></div>

            {isAddingStore && (
              <form onSubmit={handleAddStore} className="px-2 mb-2 animate-in slide-in-from-top-2">
                 <input 
                  autoFocus 
                  value={newStoreName} 
                  onChange={e => setNewStoreName(e.target.value)} 
                  onBlur={() => !newStoreName && setIsAddingStore(false)} 
                  placeholder="Магазин..." 
                  className="w-full h-8 bg-card text-main border border-primary/30 rounded px-3 text-[10px] font-black uppercase outline-none shadow-sm" 
                 />
              </form>
            )}

            {shoppingStores.map(store => (
              <div key={store.id} className="group relative">
                <button 
                  onClick={() => handleSelectStore(store.id)} 
                  className={`w-full flex items-center gap-4 px-5 py-3 rounded transition-all ${activeStoreId === store.id ? 'bg-primary text-white shadow-lg font-black' : 'text-muted hover:bg-black/5'}`}
                >
                   <i className={`fa-solid ${store.icon} text-xs w-4 text-center`} style={activeStoreId === store.id ? {color: 'white'} : { color: store.color }}></i>
                   <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-[11px] uppercase tracking-widest truncate pr-6 font-black">{store.name}</span>
                      {store.isShared && <span className="text-[6px] font-black text-indigo-200 uppercase tracking-tighter flex items-center gap-1"><i className="fa-solid fa-users"></i> Shared</span>}
                   </div>
                   <span className={`ml-auto text-[8px] font-black ${activeStoreId === store.id ? 'text-white/60' : 'opacity-40'}`}>{shoppingItems.filter(i => i.storeId === store.id).length}</span>
                </button>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setShowSharingModal(store)} className={`text-[9px] p-2 hover:text-indigo-400 transition-colors ${activeStoreId === store.id ? 'text-white/40 hover:text-white' : 'text-muted'}`} title="Поділитися"><i className="fa-solid fa-user-plus"></i></button>
                   <button onClick={() => { if(confirm('Видалити магазин?')) deleteStore(store.id); }} className={`text-[9px] p-2 hover:text-rose-500 transition-colors ${activeStoreId === store.id ? 'text-white/40 hover:text-white' : 'text-muted'}`}><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}
         </nav>
      </aside>

      <main className={`flex-1 flex flex-col bg-main relative min-w-0 transition-all duration-300 ${isMobileView && !isContentViewVisible ? 'translate-x-full' : 'translate-x-0'}`}>
         <header className="px-6 md:px-10 py-4 border-b border-theme flex flex-col md:flex-row justify-between items-start md:items-center bg-card sticky top-0 z-10 gap-4 shrink-0">
            <div className="flex items-center gap-3 w-full min-w-0">
              {isMobileView && (
                <button onClick={() => setIsContentViewVisible(false)} className="w-8 h-8 rounded bg-black/5 flex items-center justify-center text-muted mr-1">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
              )}
              <div className="flex flex-col min-w-0">
                <Typography variant="h2" className="text-lg md:text-xl font-black uppercase tracking-tight text-main flex items-center gap-3 truncate">
                  <i className={`fa-solid ${activeStoreId === 'all' ? 'fa-layer-group' : 'fa-shop'} opacity-20 text-base md:text-lg`}></i>
                  {activeStoreId === 'all' ? 'Усі покупки' : (shoppingStores.find(s => s.id === activeStoreId)?.name || 'Магазин')}
                </Typography>
                {activeStoreId !== 'all' && shoppingStores.find(s => s.id === activeStoreId)?.isShared && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="indigo" className="text-[6px] py-0 px-1 font-black uppercase">Спільний список</Badge>
                  </div>
                )}
              </div>
            </div>
            
            {activeStoreId !== 'all' && (
              <form onSubmit={handleAddItem} className="flex gap-2 w-full md:w-auto items-center">
                 <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Що купити?" className="flex-1 h-8 bg-input border border-theme rounded px-3 text-[11px] font-bold outline-none md:w-48 focus:ring-2 focus:ring-primary/20 transition-all text-main shadow-inner" />
                 <Button type="submit" size="sm" className="h-8 rounded font-black shadow-lg shrink-0 px-4 text-[9px]">ДОДАТИ</Button>
              </form>
            )}
         </header>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10 relative">
            <div className="flex flex-col gap-1.5 max-w-xl mx-auto md:mx-0 pb-32">
               {sortedItems.length > 0 ? sortedItems.map(item => {
                 const store = shoppingStores.find(s => s.id === item.storeId);
                 const bestP = getBestPriceFor(item.name);
                 const lastPriceEntry = item.priceHistory && item.priceHistory.length > 0 ? item.priceHistory[0] : null;

                 return (
                   <Card 
                    key={item.id} 
                    padding="none" 
                    onClick={() => setSelectedItemId(item.id)}
                    className={`px-3 py-1.5 flex items-center justify-between group transition-all cursor-pointer border rounded ${item.isBought ? 'opacity-40 grayscale bg-black/5 border-theme' : 'bg-card border-theme hover:border-primary/30 shadow-sm'}`}
                   >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                         <button 
                           onClick={(e) => { e.stopPropagation(); toggleShoppingItem(item.id); }}
                           className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all ${item.isBought ? 'bg-emerald-500 border-emerald-500 text-white shadow-inner' : 'border-theme bg-input hover:border-primary/50'}`}
                         >
                            {item.isBought && <i className="fa-solid fa-check text-[10px]"></i>}
                         </button>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                               <span className={`text-[12px] font-bold truncate max-w-[150px] md:max-w-none ${item.isBought ? 'line-through text-muted' : 'text-main'}`}>{item.name}</span>
                               {lastPriceEntry && (
                                 <Badge variant="orange" className="text-[7px] py-0 px-1 font-black">{lastPriceEntry.price} ₴</Badge>
                               )}
                               {item.isBought && item.lastModifiedBy && (
                                 <span className="text-[6px] font-black text-emerald-600 uppercase opacity-60">Bought by {item.lastModifiedBy.split('@')[0]}</span>
                               )}
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.note && <i className="fa-solid fa-comment-dots text-primary/30 text-[8px]"></i>}
                        <i className="fa-solid fa-chevron-right text-[8px] text-muted group-hover:text-primary transition-all"></i>
                      </div>
                   </Card>
                 );
               }) : (
                 <div className="py-20 text-center opacity-10 flex flex-col items-center select-none pointer-events-none grayscale">
                    <i className="fa-solid fa-basket-shopping text-7xl mb-6 text-main"></i>
                    <Typography variant="h2" className="text-xl text-main font-black">Порожній список</Typography>
                 </div>
               )}
            </div>

            {shoppingStores.length > 0 && (
              <button 
                onClick={() => setIsQuickAdding(true)}
                className="fixed right-6 bottom-24 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-all hover:scale-110"
                title="Додати товар"
              >
                <i className="fa-solid fa-plus text-2xl"></i>
              </button>
            )}
         </div>
      </main>

      {selectedItemId && (
         <div className={`fixed md:relative inset-0 md:inset-auto flex h-full border-l border-theme z-[100] md:z-40 bg-card shrink-0 transition-all duration-300`}>
            {!isMobileView && (
              <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-primary z-[110] transition-colors ${isResizing ? 'bg-primary' : 'bg-theme'}`}></div>
            )}
            <div style={{ width: isMobileView ? '100vw' : detailsWidth }} className="h-full bg-card relative overflow-hidden flex flex-col shadow-2xl">
               <ShoppingItemDetails 
                 item={shoppingItems.find(i => i.id === selectedItemId)!} 
                 onClose={() => setSelectedItemId(null)} 
               />
            </div>
         </div>
      )}

      {isQuickAdding && (
        <QuickAddShoppingModal 
          stores={shoppingStores} 
          defaultStoreId={activeStoreId !== 'all' ? activeStoreId : undefined}
          onClose={() => setIsQuickAdding(false)} 
          onAdd={handleQuickAdd} 
        />
      )}

      {showSharingModal && (
        <SharingModal 
          store={showSharingModal} 
          onClose={() => setShowSharingModal(null)} 
          onShare={(email) => { shareStore(showSharingModal.id, email); setShowSharingModal(null); }}
        />
      )}
    </div>
  );
};

export default ShoppingView;