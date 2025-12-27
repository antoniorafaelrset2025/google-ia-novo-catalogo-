
import React, { useState } from 'react';
import { supabase } from '../supabase';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const email = username.includes('@') ? username : `${username.toLowerCase().trim()}@admin.com`;
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ 
        email: email, 
        password 
      });
      
      if (authError) {
        setError(`FALHA: ${authError.message.toUpperCase()}`);
        setLoading(false);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError('FALHA NA COMUNICAÇÃO COM O SERVIDOR.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="mb-8 flex items-center text-slate-500 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors">
          <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          Voltar ao Catálogo
        </button>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg shadow-yellow-500/20">
              <span className="text-slate-950 font-black text-2xl italic">MR</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acesso Admin</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Usuário</label>
              <input type="text" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm outline-none text-white focus:ring-2 focus:ring-yellow-500 transition-all font-bold" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Senha</label>
              <input type="password" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm outline-none text-white focus:ring-2 focus:ring-yellow-500 transition-all font-bold" placeholder="admin123" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center">
                <p className="text-red-500 text-[9px] font-black uppercase">{error}</p>
              </div>
            )}

            <button disabled={loading} className="w-full bg-yellow-500 text-slate-950 font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 mt-2">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
