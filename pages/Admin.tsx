
import React, { useState, useEffect } from 'react';
import { 
  getCategories, getProducts, 
  upsertCategory, deleteCategory,
  upsertProduct, deleteProduct,
  getSetting, updateSetting,
  supabase
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
  const [showCatModal, setShowCatModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editingProd, setEditingProd] = useState<any>(null);

  const [catForm, setCatForm] = useState({ name: '', order: 0 });
  const [prodForm, setProdForm] = useState({ name: '', price: '', category_id: '', description: '' });

  const logoUrl = "https://vytaqltyavifnddqrrfo.supabase.co/storage/v1/object/public/assets/logo_mr.jpg";

  const refreshData = async () => {
    setLoading(true);
    try {
      const [cats, prods, wa] = await Promise.all([
        getCategories(), 
        getProducts(),
        getSetting('whatsapp_number')
      ]);
      setCategories((cats as any) || []);
      setProducts((prods as any) || []);
      setWhatsapp(wa || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const handleSaveSetting = async () => {
    const cleanNumber = whatsapp.replace(/\D/g, '');
    setSaving(true);
    try {
      await updateSetting('whatsapp_number', cleanNumber);
      alert("✅ Salvo!");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-4 cursor-pointer" onClick={onBack}>
          <div className="w-10 h-10 rounded-lg border border-yellow-500 overflow-hidden bg-slate-950 flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black uppercase italic tracking-tighter text-lg hidden md:block">Administração</span>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={onBack} className="text-[10px] font-black uppercase text-slate-500 hover:text-white">Loja</button>
          <button onClick={onLogout} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Sair</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Painel Admin</h1>
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('products')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500'}`}>Produtos</button>
            <button onClick={() => setActiveTab('categories')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500'}`}>Categorias</button>
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500'}`}>Config</button>
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-500"></div></div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-900">
              <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">WhatsApp de Recebimento</label>
              <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-yellow-500 outline-none mb-4" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              <button disabled={saving} onClick={handleSaveSetting} className="w-full bg-yellow-500 text-slate-950 font-black py-4 rounded-xl uppercase text-xs">Salvar Alterações</button>
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-slate-600 tracking-widest">Gerenciar Categorias</h2>
              <button onClick={() => { setEditingCat(null); setCatForm({ name: '', order: 0 }); setShowCatModal(true); }} className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">+ Nova</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
                  <span className="font-black uppercase text-xs">{cat.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, order: cat.order }); setShowCatModal(true); }} className="p-2 text-slate-500 hover:text-yellow-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" strokeLinecap="round" /></svg></button>
                    <button onClick={async () => { if(confirm("Excluir?")) { await deleteCategory(cat.id); refreshData(); } }} className="p-2 text-slate-500 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth="2.5" strokeLinecap="round" /></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-slate-600 tracking-widest">Estoque de Produtos</h2>
              <button onClick={() => { setEditingProd(null); setProdForm({ name: '', price: '', category_id: categories[0]?.id || '', description: '' }); setShowProdModal(true); }} className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">+ Adicionar</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(prod => (
                <div key={prod.id} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800">
                  <h3 className="font-black text-white uppercase text-[11px] mb-1">{prod.name}</h3>
                  <p className="text-yellow-500 font-black text-xs mb-4 italic">R$ {prod.price}</p>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button onClick={() => { setEditingProd(prod); setProdForm({ name: prod.name, price: prod.price, category_id: prod.category_id, description: prod.description || '' }); setShowProdModal(true); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-white">Editar</button>
                    <button onClick={async () => { if(confirm("Apagar?")) { await deleteProduct(prod.id); refreshData(); } }} className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CATEGORIA (Breve representação) */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-sm p-8 rounded-[3rem] border border-slate-800">
            <h3 className="text-xl font-black uppercase italic mb-6 text-white">Categoria</h3>
            <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-6 outline-none focus:border-yellow-500" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="Nome" />
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowCatModal(false)} className="text-[10px] font-black uppercase text-slate-600">Voltar</button>
              <button onClick={async () => { await upsertCategory(editingCat ? { ...editingCat, ...catForm } : catForm); setShowCatModal(false); refreshData(); }} className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-black uppercase text-[10px]">Salvar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL PRODUTO (Mesma lógica) */}
      {showProdModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-md p-8 rounded-[3rem] border border-slate-800">
            <h3 className="text-xl font-black uppercase italic mb-6 text-white">Produto</h3>
            <div className="space-y-4">
              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-yellow-500" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} placeholder="Nome do Produto" />
              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-yellow-500" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} placeholder="Preço" />
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-yellow-500" value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setShowProdModal(false)} className="text-[10px] font-black uppercase text-slate-600">Cancelar</button>
              <button onClick={async () => { await upsertProduct(editingProd ? { ...editingProd, ...prodForm } : prodForm); setShowProdModal(false); refreshData(); }} className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-black uppercase text-[10px]">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
