
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Admin from './pages/Admin';
import { ViewState } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewState>('catalog');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Ouvir mudanças na auth
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
