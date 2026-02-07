
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Typography from '../components/ui/Typography';

const AuthView: React.FC = () => {
  const { login, continueAsGuest, loading, setIsAuthModalOpen } = useAuth();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500 p-4">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/30 blur-[140px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/30 blur-[140px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10 max-w-sm w-full px-8 py-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.5)] text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button 
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group"
        >
          <i className="fa-solid fa-xmark text-sm group-hover:scale-125 transition-transform"></i>
        </button>

        <div className="w-28 h-28 bg-gradient-to-tr from-orange-500 to-rose-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl shadow-2xl shadow-orange-500/40 mb-10 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
           <i className="fa-solid fa-bolt-lightning"></i>
        </div>
        
        <Typography variant="h1" className="text-white text-4xl mb-3 font-black tracking-tighter">12TR ENGINE</Typography>
        <Typography variant="tiny" className="text-orange-400 font-bold tracking-[0.4em] mb-12 uppercase opacity-80">Cloud Sync & Intelligence</Typography>
        
        <div className="w-full space-y-4 px-2">
          <button 
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white text-slate-900 py-5 px-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)] group"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="Google" />
                <span>Вхід з Google</span>
              </>
            )}
          </button>

          <button 
            onClick={continueAsGuest}
            className="w-full py-5 px-6 rounded-3xl font-black text-[11px] uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition-all border border-white/5"
          >
            Залишитись в офлайн режимі
          </button>
        </div>

        <div className="mt-12 flex gap-6 justify-center opacity-40">
           <div className="flex flex-col items-center gap-1">
              <i className="fa-solid fa-shield-halved text-white text-xs"></i>
              <span className="text-[6px] font-black text-white uppercase tracking-tighter">Secure</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <i className="fa-solid fa-cloud-arrow-up text-white text-xs"></i>
              <span className="text-[6px] font-black text-white uppercase tracking-tighter">Sync</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <i className="fa-solid fa-wand-magic-sparkles text-white text-xs"></i>
              <span className="text-[6px] font-black text-white uppercase tracking-tighter">Smart</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
