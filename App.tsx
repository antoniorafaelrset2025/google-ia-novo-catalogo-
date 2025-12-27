
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.ts';
import Catalog from './pages/Catalog.tsx';
import Login from './pages/Login.tsx';
import Admin from './pages/Admin.tsx';
import { ViewState } from './types.ts';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewState>('catalog');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
      } catch (err) {
        console.error("Erro ao carregar sessão:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (newView: ViewState) => {
    if (newView === 'admin' && !session) {
      setView('login');
    } else {
      setView(newView);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Carregando MR Bebidas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {view === 'catalog' && <Catalog onLoginClick={() => handleNavigate('login')} />}
      {view === 'login' && <Login onBack={() => setView('catalog')} onSuccess={() => setView('admin')} />}
      {view === 'admin' && session && (
        <Admin 
          onLogout={async () => { 
            await supabase.auth.signOut(); 
            setView('catalog'); 
          }} 
          onBack={() => setView('catalog')} 
        />
      )}
    </div>
  );
};

export default App;
