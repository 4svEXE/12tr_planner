
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const AquariumView: React.FC = () => {
  const { 
    character, aquariumObjects = [], lastGoldCollectAt = Date.now(), 
    collectAquariumGold, buyAquariumObject, aquariumBeauty = 0,
    theme, lastFedAt = Date.now(), foodInventory = 0, feedFish, moveAquariumObject
  } = useApp();

  const [showShop, setShowShop] = useState(false);
  const [shopTab, setShopTab] = useState<'fish' | 'decor' | 'special'>('fish');
  const [timeToNext, setTimeToNext] = useState<number>(0);
  const [isFeeding, setIsFeeding] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const aquariumRef = useRef<HTMLDivElement>(null);

  const hourInMs = 3600000;

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - (lastGoldCollectAt || now);
      setTimeToNext(Math.max(0, hourInMs - elapsed));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastGoldCollectAt]);

  const isHungry = (Date.now() - lastFedAt) > 24 * 3600000;
  const canCollect = timeToNext === 0;
  const totalIncome = aquariumObjects.reduce((acc, o) => acc + (o.incomeBonus || 0), 0);

  const handleFeed = () => {
    if (foodInventory > 0) {
      feedFish();
      setIsFeeding(true);
      setTimeout(() => setIsFeeding(false), 3000);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    setDraggedId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedId || !aquariumRef.current) return;
    const rect = aquariumRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    moveAquariumObject(draggedId, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  const handleMouseUp = () => setDraggedId(null);

  const shopItems = {
    fish: [
      { species: 'Guppy', label: 'Гуппі', price: 15, beauty: 2, income: 2, icon: 'fa-fish' },
      { species: 'Neon', label: 'Неон', price: 40, beauty: 8, income: 6, icon: 'fa-fish' },
      { species: 'Goldie', label: 'Золота', price: 100, beauty: 25, income: 15, icon: 'fa-fish-fins' },
      { species: 'Jelly', label: 'Медуза', price: 200, beauty: 50, income: 30, icon: 'fa-ghost' },
      { species: 'Manta', label: 'Скат', price: 800, beauty: 200, income: 120, icon: 'fa-shuttle-space' },
      { species: 'Whale', label: 'Синій Кит', price: 5000, beauty: 1500, income: 1000, icon: 'fa-fish' },
    ],
    decor: [
      { species: 'Stone', label: 'Камінь', price: 20, beauty: 5, income: 1, icon: 'fa-gem' },
      { species: 'Plant', label: 'Водорості', price: 50, beauty: 12, income: 3, icon: 'fa-leaf' },
      { species: 'Coral', label: 'Риф', price: 150, beauty: 40, income: 10, icon: 'fa-fan' },
      { species: 'Skull', label: 'Череп', price: 500, beauty: 120, income: 45, icon: 'fa-skull' },
      { species: 'Castle', label: 'Замок', price: 1200, beauty: 350, income: 80, icon: 'fa-fort-awesome' },
      { species: 'Volcano', label: 'Вулкан', price: 3000, beauty: 900, income: 250, icon: 'fa-volcano' },
    ],
    special: [
      { species: 'Bubbles', label: 'Аератор', price: 80, beauty: 10, income: 25, icon: 'fa-soap' },
      { species: 'Light', label: 'RGB Світло', price: 300, beauty: 100, income: 50, icon: 'fa-bolt' },
      { species: 'Treasure', label: 'Скриня', price: 2000, beauty: 500, income: 200, icon: 'fa-box-open' },
    ]
  };

  const getThemeBackground = () => {
    switch(theme) {
      case 'midnight': return 'from-slate-950 via-blue-950 to-black';
      case 'cyberpunk': return 'from-purple-900 via-indigo-900 to-black';
      case 'forest': return 'from-emerald-900 via-teal-950 to-slate-950';
      case 'sakura': return 'from-rose-900 via-pink-950 to-slate-950';
      default: return 'from-sky-900 via-blue-900 to-indigo-950';
    }
  };

  return (
    <div className="p-3 md:p-8 h-full bg-slate-950 overflow-hidden relative flex flex-col no-scrollbar select-none">
      {/* Dynamic Background Water */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getThemeBackground()} transition-all duration-1000`}>
         <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
         </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 z-10 shrink-0 mb-4 backdrop-blur-2xl bg-white/5 p-3 md:p-5 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center text-xl md:text-3xl text-white shadow-inner border border-white/10 shrink-0">
             <i className={`fa-solid ${isFeeding ? 'fa-bowl-food animate-bounce text-emerald-400' : 'fa-water'}`}></i>
          </div>
          <div className="min-w-0">
            <Typography variant="h1" className="text-base md:text-2xl font-black text-white uppercase tracking-tight truncate leading-none md:leading-normal">Екосистема</Typography>
            <div className="flex gap-1.5 md:gap-2 mt-1">
               <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <i className="fa-solid fa-coins text-[6px] md:text-[8px] text-amber-500"></i>
                  <span className="text-[7px] md:text-[9px] font-black text-amber-500 uppercase">{character.gold}</span>
               </div>
               <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <i className="fa-solid fa-heart text-[6px] md:text-[8px] text-rose-500"></i>
                  <span className="text-[7px] md:text-[9px] font-black text-rose-500 uppercase">{aquariumBeauty}</span>
               </div>
               <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <i className="fa-solid fa-wheat-awn text-[6px] md:text-[8px] text-emerald-500"></i>
                  <span className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase">{foodInventory}</span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
           <div className="flex-1 md:text-right px-2">
              <div className="text-[6px] md:text-[7px] font-black text-sky-200 uppercase tracking-widest leading-none mb-1 opacity-60">Дохід</div>
              <div className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${isHungry ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isHungry ? 'ГОЛОДНІ!' : `+${totalIncome}/г`}
              </div>
           </div>
           
           <div className="flex gap-2 shrink-0">
             <button 
               onClick={handleFeed}
               disabled={foodInventory <= 0}
               className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl transition-all shadow-xl ${foodInventory > 0 ? 'bg-emerald-500 text-white hover:scale-110 active:scale-95 shadow-emerald-500/20' : 'bg-white/5 text-white/20'}`}
             >
               <i className="fa-solid fa-bowl-food"></i>
             </button>

             <button 
               onClick={collectAquariumGold}
               disabled={!canCollect}
               className={`h-10 md:h-12 px-3 md:px-5 rounded-xl md:rounded-2xl flex items-center gap-2 transition-all ${canCollect ? 'bg-amber-400 text-amber-900 shadow-xl animate-bounce' : 'bg-white/5 text-white/20 border border-white/5'}`}
             >
               <i className="fa-solid fa-gem text-base md:text-lg"></i>
               <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">{canCollect ? 'ЗБЕРЕГТИ' : Math.floor(timeToNext/60000) + 'м'}</span>
             </button>

             <button 
              onClick={() => setShowShop(true)}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white text-slate-900 flex items-center justify-center text-lg md:text-xl shadow-xl hover:scale-110 active:scale-90 transition-all"
             >
               <i className="fa-solid fa-cart-shopping"></i>
             </button>
           </div>
        </div>
      </header>

      {/* THE TANK AREA */}
      <div 
        ref={aquariumRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 relative bg-black/20 rounded-[2.5rem] md:rounded-[4rem] border-4 border-white/10 shadow-inner overflow-hidden group cursor-default"
      >
         {/* Particles / Bubbles */}
         <div className="absolute inset-0 pointer-events-none">
            {Array.from({length: 10}).map((_, i) => (
              <div key={i} className="absolute bg-white/10 rounded-full animate-bubble" style={{ width: Math.random()*8+2+'px', height: Math.random()*8+2+'px', left: Math.random()*100+'%', bottom: '-20px', animationDuration: Math.random()*5+5+'s', animationDelay: Math.random()*10+'s' }}></div>
            ))}
         </div>

         {/* Feeding particles */}
         {isFeeding && (
           <div className="absolute inset-0 pointer-events-none z-[100]">
              {Array.from({length: 20}).map((_, i) => (
                <div key={i} className="absolute w-1.5 h-1.5 bg-amber-200 rounded-full animate-fall" style={{ left: Math.random()*100+'%', top: '-10px', animationDelay: Math.random()*1.5+'s' }}></div>
              ))}
           </div>
         )}

         {/* Objects Layer */}
         {aquariumObjects.map((obj, i) => {
           const isJelly = obj.species === 'Jelly';
           return (
             <div 
               key={obj.id}
               onMouseDown={(e) => handleMouseDown(e, obj.id)}
               className={`absolute will-change-transform cursor-grab active:cursor-grabbing ${obj.type === 'fish' ? (isJelly ? 'animate-float' : 'animate-swim') : (obj.species === 'Volcano' ? 'animate-shake' : 'animate-sway')} ${draggedId === obj.id ? 'z-50 ring-2 ring-white/50 ring-offset-4 ring-offset-transparent rounded-full' : ''}`}
               style={{ 
                 left: `${obj.x}%`, 
                 top: `${obj.y}%`, 
                 color: obj.color,
                 zIndex: obj.type === 'decor' ? 5 : 10,
                 animationDuration: obj.type === 'fish' ? `${12 + (i % 5) * 4}s` : `${6 + (i % 3) * 2}s`,
                 animationDelay: `${-(i * 2)}s`,
                 transform: `translate3d(-50%, -50%, 0) scale(${obj.scale}) ${obj.flip ? 'scaleX(-1)' : ''}`,
                 transition: draggedId === obj.id ? 'none' : 'transform 0.5s ease-out'
               } as any}
             >
               <div className="relative group/obj">
                  <i className={`fa-solid ${
                    obj.type === 'fish' 
                      ? (obj.species === 'Jelly' ? 'fa-ghost animate-pulse' : ['Manta', 'Whale'].includes(obj.species) ? 'fa-shuttle-space' : 'fa-fish-fins') 
                      : (obj.species === 'Castle' ? 'fa-fort-awesome' : obj.species === 'Volcano' ? 'fa-volcano' : obj.species === 'Bubbles' ? 'fa-soap' : obj.species === 'Skull' ? 'fa-skull' : 'fa-leaf')
                  } text-4xl md:text-7xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]`}></i>
                  
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[8px] text-white opacity-0 group-hover/obj:opacity-100 transition-opacity font-black uppercase whitespace-nowrap">
                    {obj.name}
                  </div>
               </div>
             </div>
           );
         })}
      </div>

      <style>{`
        @keyframes swim {
          0% { transform: translate3d(0, 0, 0) scaleX(1); }
          30% { transform: translate3d(150px, -30px, 0) scaleX(1); }
          50% { transform: translate3d(300px, 20px, 0) scaleX(-1); }
          80% { transform: translate3d(50px, 10px, 0) scaleX(-1); }
          100% { transform: translate3d(0, 0, 0) scaleX(1); }
        }
        @keyframes float {
          0%, 100% { transform: translate3d(-50%, -50%, 0) translateY(0) scale(1); }
          50% { transform: translate3d(-50%, -60%, 0) translateY(-30px) scale(1.1); }
        }
        @keyframes sway {
          0%, 100% { transform: translate3d(-50%, -50%, 0) rotate(-3deg); }
          50% { transform: translate3d(-50%, -51%, 0) rotate(3deg); }
        }
        @keyframes bubble {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 0.3; }
          100% { transform: translateY(-1000px); opacity: 0; }
        }
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(800px) rotate(720deg); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translate3d(-50%, -50%, 0) rotate(0); }
          25% { transform: translate3d(-51%, -50%, 0) rotate(-1deg); }
          75% { transform: translate3d(-49%, -50%, 0) rotate(1deg); }
        }
        .animate-swim { animation: swim linear infinite; }
        .animate-float { animation: float ease-in-out infinite; }
        .animate-sway { animation: sway ease-in-out infinite; }
        .animate-bubble { animation: bubble linear infinite; }
        .animate-fall { animation: fall 3s linear forwards; }
        .animate-shake { animation: shake 0.1s linear infinite; }
      `}</style>

      {/* SHOP MODAL */}
      {showShop && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-4 tiktok-blur">
          <div className="absolute inset-0 bg-slate-950/95" onClick={() => setShowShop(false)}></div>
          <Card className="w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] relative z-10 p-0 rounded-none md:rounded-[3rem] bg-white border-none shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
             <header className="p-6 md:p-8 pb-4 flex justify-between items-center shrink-0">
                <div>
                   <Typography variant="h2" className="text-xl md:text-2xl font-black uppercase text-slate-900">Морський Магазин</Typography>
                   <div className="flex gap-2 md:gap-3 mt-2">
                      <div className="px-3 py-1 bg-amber-100 rounded-xl text-amber-700 font-black text-[9px] flex items-center gap-2">
                         {character.gold} <i className="fa-solid fa-coins"></i>
                      </div>
                      <div className="px-3 py-1 bg-emerald-100 rounded-xl text-emerald-700 font-black text-[9px] flex items-center gap-2">
                         {foodInventory} <i className="fa-solid fa-wheat-awn"></i>
                      </div>
                   </div>
                </div>
                <button onClick={() => setShowShop(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
             </header>

             <div className="flex px-6 md:px-8 gap-4 border-b border-slate-100 shrink-0">
                {[
                  { id: 'fish', label: 'Жителі', icon: 'fa-fish-fins' },
                  { id: 'decor', label: 'Оформлення', icon: 'fa-leaf' },
                  { id: 'special', label: 'Спеціальне', icon: 'fa-wand-magic-sparkles' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setShopTab(tab.id as any)}
                    className={`pb-4 px-1 text-[9px] font-black uppercase tracking-widest transition-all relative ${shopTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <i className={`fa-solid ${tab.icon} mr-1 md:mr-2`}></i>
                    {tab.label}
                    {shopTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full animate-in fade-in duration-300"></div>}
                  </button>
                ))}
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-2">
                {shopItems[shopTab].map(item => (
                  <button 
                    key={item.species}
                    onClick={() => { buyAquariumObject(shopTab as any, item.species, item.price, item.beauty, item.income); if(navigator.vibrate) navigator.vibrate(10); }}
                    disabled={character.gold < item.price}
                    className="w-full flex items-center gap-4 md:gap-5 p-3 md:p-5 rounded-[1.5rem] md:rounded-3xl border-2 border-slate-50 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group disabled:opacity-50 disabled:grayscale"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center text-3xl md:text-4xl group-hover:scale-110 transition-transform shadow-inner border border-white shrink-0">
                       <i className={`fa-solid ${item.icon} text-indigo-500`}></i>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                       <div className="text-[12px] md:text-[14px] font-black text-slate-800 uppercase tracking-tight truncate">{item.label}</div>
                       <div className="flex gap-2 mt-0.5">
                          <span className="text-[7px] font-bold text-rose-500 uppercase">+{item.beauty} Краса</span>
                          <span className="text-[7px] font-bold text-emerald-600 uppercase">+{item.income} Зол/г</span>
                       </div>
                    </div>
                    <div className="text-right shrink-0">
                       <div className="text-sm md:text-lg font-black text-amber-600">{item.price} <i className="fa-solid fa-coins text-[10px]"></i></div>
                    </div>
                  </button>
                ))}
             </div>
             
             <div className="p-6 md:p-8 pt-4 border-t border-slate-100 shrink-0 bg-slate-50/50 pb-safe">
                <Button variant="primary" className="w-full h-14 md:h-16 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl shadow-indigo-200" onClick={() => setShowShop(false)}>ЗАКРИТИ МАГАЗИН</Button>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AquariumView;
