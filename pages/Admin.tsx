
import React, { useState, useEffect } from 'react';
import { 
  getCategories, getProducts, 
  upsertCategory, deleteCategory,
  upsertProduct, deleteProduct,
  getSetting, updateSetting
} from '../supabase';
import { Category, Product } from '../types';

interface AdminProps {
  onLogout: () => void;
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'settings'>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbMissing, setDbMissing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editingProd, setEditingProd] = useState<any>(null);

  const [catForm, setCatForm] = useState({ name: '', order: 0 });
  const [prodForm, setProdForm] = useState({ name: '', price: '', category_id: '', description: '' });

  const refreshData = async () => {
    setLoading(true);
    try {
      const [cats, prods, wa] = await Promise.all([
        getCategories(), 
        getProducts(),
        getSetting('whatsapp_number')
      ]);

      if (cats === "__DB_MISSING__" || prods === "__DB_MISSING__" || wa === "__DB_MISSING__") {
        setDbMissing(true);
        setCategories([]);
        setProducts([]);
        return;
      }

      setCategories(cats as any);
      setProducts(prods as any);
      setWhatsapp(wa || '');
      setDbMissing(false);
    } catch (err: any) {
      console.error("Erro no Admin refresh:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSaveSetting = async () => {
    if (!whatsapp) return alert("Por favor, digite o número do WhatsApp.");
    const cleanNumber = whatsapp.replace(/\D/g, '');
    if (cleanNumber.length < 10) return alert("Número inválido. Digite o DDD + número.");

    setSaving(true);
    try {
      await updateSetting('whatsapp_number', cleanNumber);
      alert("✅ Número do WhatsApp salvo com sucesso!");
      await refreshData();
    } catch (err: any) {
      console.error("Erro ao salvar WhatsApp:", err);
      if (err.code === 'PGRST205') {
        alert("Erro: A tabela 'settings' ainda não foi criada no banco de dados.");
        setDbMissing(true);
      } else {
        alert(`Erro ao salvar: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const sqlScript = `
-- 1. CRIAR TABELA DE CONFIGURAÇÕES
create table if not exists public.settings (
  key text primary key,
  value text
);

-- 2. CRIAR TABELA DE CATEGORIAS
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  "order" integer default 0
);

-- 3. CRIAR TABELA DE PRODUTOS
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price text not null,
  category_id uuid references public.categories(id) on delete cascade,
  description text
);

-- 4. HABILITAR PERMISSÕES (IMPORTANTE)
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

create policy "Permitir leitura pública" on public.settings for select using (true);
create policy "Permitir tudo para autenticados" on public.settings for all using (true);

create policy "Permitir leitura pública cats" on public.categories for select using (true);
create policy "Permitir tudo para autenticados cats" on public.categories for all using (true);

create policy "Permitir leitura pública prods" on public.products for select using (true);
create policy "Permitir tudo para autenticados prods" on public.products for all using (true);
  `.trim();

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    alert("Copiado! Agora cole no SQL Editor do seu Supabase.");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertCategory(editingCat ? { ...editingCat, ...catForm } : catForm);
      setShowCatModal(false);
      await refreshData();
    } catch (err) { alert("Erro ao salvar."); } finally { setSaving(false); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.category_id && categories.length > 0) prodForm.category_id = categories[0].id;
    setSaving(true);
    try {
      await upsertProduct(editingProd ? { ...editingProd, ...prodForm } : prodForm);
      setShowProdModal(false);
      await refreshData();
    } catch (err) { alert("Erro ao salvar."); } finally { setSaving(false); }
  };

  const handleDeleteCat = async (id: string) => {
    if(confirm("Excluir categoria e todos os produtos dela?")) {
      try { await deleteCategory(id); await refreshData(); } catch (err) { alert("Erro ao excluir."); }
    }
  };

  const handleDeleteProd = async (id: string) => {
    if(confirm("Excluir este produto?")) {
      try { await deleteProduct(id); await refreshData(); } catch (err) { alert("Erro ao excluir."); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="bg-slate-900/50 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-30 backdrop-blur-xl">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBack}>
          <div className="bg-yellow-500 w-8 h-8 rounded-lg flex items-center justify-center font-black text-slate-950 italic">MR</div>
          <span className="font-black uppercase italic tracking-tighter text-sm">Painel Gestor</span>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={onBack} className="text-[10px] font-black uppercase text-slate-500">Ver Site</button>
          <button onClick={onLogout} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Sair</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gestão</h1>
          </div>
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
            <button onClick={() => setActiveTab('products')} className={`px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500'}`}>Produtos</button>
            <button onClick={() => setActiveTab('categories')} className={`px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500'}`}>Categorias</button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500'}`}>Configurações</button>
          </div>
        </header>

        {dbMissing && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl animate-fadeIn">
            <h3 className="text-red-500 font-black uppercase text-xs mb-2">Banco de Dados não configurado</h3>
            <p className="text-slate-400 text-[10px] uppercase font-bold leading-relaxed mb-4">
              As tabelas necessárias não foram encontradas no seu Supabase. Clique no botão abaixo para gerar o script de correção.
            </p>
            <button onClick={() => setShowSqlModal(true)} className="bg-red-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Corrigir Banco Agora</button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-500"></div>
            <span className="uppercase font-black text-[10px] text-slate-600 tracking-widest">Sincronizando...</span>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800">
              <h2 className="text-white font-black uppercase italic mb-6">WhatsApp do Pedido</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Número com DDD (Apenas números)</label>
                  <input 
                    type="text" 
                    disabled={dbMissing}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none mt-1 font-bold disabled:opacity-30" 
                    placeholder="Ex: 5511999999999" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
                <button 
                  disabled={saving || dbMissing} 
                  onClick={handleSaveSetting} 
                  className="w-full bg-yellow-500 text-slate-950 font-black py-4 rounded-2xl uppercase text-xs hover:bg-yellow-400 active:scale-95 transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Salvar WhatsApp'}
                </button>
                <p className="text-slate-500 text-[9px] uppercase font-bold text-center italic mt-4">
                  {whatsapp ? `Pedidos serão enviados para: ${whatsapp}` : 'Nenhum número configurado ainda.'}
                </p>
              </div>
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest">Categorias</h2>
              <button disabled={dbMissing} onClick={() => { setEditingCat(null); setCatForm({ name: '', order: categories.length + 1 }); setShowCatModal(true); }} className="bg-yellow-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-[10px] uppercase disabled:opacity-30">+ Nova</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 ? (
                <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-3xl">
                  <p className="text-[10px] text-slate-600 uppercase font-black">{dbMissing ? 'Banco de dados pendente.' : 'Nenhuma categoria cadastrada.'}</p>
                </div>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 flex justify-between items-center group hover:border-slate-700 transition-colors">
                    <span className="font-bold uppercase text-xs text-slate-200">{cat.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, order: cat.order }); setShowCatModal(true); }} className="p-2 text-slate-500 hover:text-yellow-500 text-[10px] font-black uppercase">Editar</button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="p-2 text-slate-500 hover:text-red-500 text-[10px] font-black uppercase">Excluir</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest">Produtos</h2>
              <button disabled={categories.length === 0 || dbMissing} onClick={() => { setEditingProd(null); setProdForm({ name: '', price: '', category_id: categories[0]?.id || '', description: '' }); setShowProdModal(true); }} className="bg-yellow-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-tighter shadow-lg shadow-yellow-500/10 disabled:opacity-30">+ Novo Produto</button>
            </div>
            {products.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl">
                 <p className="text-[10px] text-slate-600 uppercase font-black">{dbMissing ? 'Banco de dados pendente.' : 'Nenhum produto cadastrado ainda.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(prod => (
                  <div key={prod.id} className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <h3 className="font-bold text-slate-100 uppercase text-sm mb-1">{prod.name}</h3>
                    <p className="text-yellow-500 font-black text-xs mb-4">R$ {prod.price}</p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                      <button onClick={() => { setEditingProd(prod); setProdForm({ name: prod.name, price: prod.price, category_id: prod.category_id, description: prod.description || '' }); setShowProdModal(true); }} className="text-[9px] font-black uppercase text-slate-500 hover:text-white">Editar</button>
                      <button onClick={() => handleDeleteProd(prod.id)} className="text-[9px] font-black uppercase text-red-500/70 hover:text-red-500">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showSqlModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-2xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative">
            <button onClick={() => setShowSqlModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-xl font-black text-white uppercase italic mb-6">Script de Inicialização</h2>
            <p className="text-slate-400 text-xs font-bold uppercase mb-4 leading-relaxed">
              Copie o código abaixo e execute no <span className="text-yellow-500">SQL Editor</span> do seu painel Supabase para criar as tabelas necessárias:
            </p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 overflow-hidden">
              <pre className="text-[10px] text-yellow-500/80 font-mono overflow-y-auto max-h-60 custom-scrollbar whitespace-pre-wrap">
                {sqlScript}
              </pre>
            </div>
            <div className="flex gap-3">
              <button onClick={copySql} className="flex-grow bg-yellow-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-yellow-500/20">Copiar Script SQL</button>
              <button onClick={() => refreshData()} className="px-8 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Já executei</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS (Cat e Prod) */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-sm p-8 rounded-[2.5rem] border border-slate-800 relative shadow-2xl">
            <h3 className="text-xl font-black uppercase italic mb-8 text-white">Categoria</h3>
            <form onSubmit={handleSaveCategory} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome</label>
                <input required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Ex: Cervejas" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ordem de Exibição</label>
                <input type="number" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="1" value={catForm.order} onChange={e => setCatForm({...catForm, order: parseInt(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowCatModal(false)} className="text-[10px] font-black uppercase text-slate-500">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-yellow-500 text-slate-950 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">{saving ? '...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProdModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] border border-slate-800 relative shadow-2xl">
            <h3 className="text-xl font-black uppercase italic mb-8 text-white">Produto</h3>
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome do Produto</label>
                <input required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Ex: Heineken 330ml" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Preço (R$)</label>
                  <input required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="9,90" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Categoria</label>
                  <select required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none appearance-none" value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={() => setShowProdModal(false)} className="text-[10px] font-black uppercase text-slate-500">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-yellow-500 text-slate-950 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">{saving ? 'Salvando...' : 'Salvar Produto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
