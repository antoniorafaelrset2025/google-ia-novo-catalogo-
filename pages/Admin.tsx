
import React, { useState, useEffect } from 'react';
import { 
  getCategories, getProducts, 
  upsertCategory, deleteCategory,
  upsertProduct, deleteProduct,
  getSetting, updateSetting,
  uploadLogo,
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
  const [logoUrl, setLogoUrl] = useState("https://vytaqltyavifnddqrrfo.supabase.co/storage/v1/object/public/assets/logo_mr.jpg");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editingProd, setEditingProd] = useState<any>(null);

  const [catForm, setCatForm] = useState({ name: '', order: 0 });
  const [prodForm, setProdForm] = useState({ name: '', price: '', category_id: '', description: '' });

  const refreshData = async () => {
    setLoading(true);
    try {
      const [cats, prods, wa, logo] = await Promise.all([
        getCategories(), 
        getProducts(),
        getSetting('whatsapp_number'),
        getSetting('logo_url')
      ]);
      setCategories((cats as any) || []);
      setProducts((prods as any) || []);
      setWhatsapp(wa || '');
      if (logo && logo !== "__DB_MISSING__") setLogoUrl(logo);
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
      alert("✅ WhatsApp Salvo!");
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande! Máximo 2MB.");
      return;
    }

    setSaving(true);
    try {
      const newUrl = await uploadLogo(file);
      await updateSetting('logo_url', newUrl);
      setLogoUrl(newUrl);
      alert("✅ Logo atualizada com sucesso!");
    } catch (err: any) {
      console.error(err);
      if (err.message === "Bucket not found") {
        alert("❌ Erro: O bucket 'assets' não existe no Supabase. Crie um bucket PÚBLICO chamado 'assets' no painel do Supabase.");
      } else {
        alert("❌ Erro no upload: " + (err.message || "Erro desconhecido"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-4 cursor-pointer" onClick={onBack}>
          <div className="w-10 h-10 rounded-lg border border-yellow-500 overflow-hidden bg-slate-950 flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black uppercase italic tracking-tighter text-sm hidden md:block">MR BEBIDAS DISTRIBUIDORA</span>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={onBack} className="text-[10px] font-black uppercase text-slate-500 hover:text-white">Ver Loja</button>
          <button onClick={onLogout} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Sair</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Administração</h1>
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('products')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}>Produtos</button>
            <button onClick={() => setActiveTab('categories')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}>Categorias</button>
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}>Configurações</button>
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-500"></div></div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
              <h2 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Identidade Visual</h2>
              <div className="flex flex-col items-center mb-6">
                <div className="w-40 h-40 rounded-full border-4 border-yellow-500 overflow-hidden mb-6 bg-slate-950 shadow-2xl">
                  <img src={logoUrl} alt="Preview Logo" className="w-full h-full object-cover" />
                </div>
                <label className={`bg-yellow-500 text-slate-950 px-8 py-4 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:scale-105 active:scale-95 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {saving ? 'Enviando...' : 'Fazer Upload da Logo'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={saving} />
                </label>
                <p className="mt-4 text-[9px] text-slate-600 uppercase tracking-widest text-center">Recomendado: Imagem quadrada 512x512px</p>
              </div>
            </div>

            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
              <h2 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">WhatsApp de Pedidos</h2>
              <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest ml-1">Número com DDD</label>
              <input type="text" placeholder="Ex: 5511999999999" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-yellow-500 outline-none mb-4" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              <button disabled={saving} onClick={handleSaveSetting} className="w-full bg-yellow-500 text-slate-950 font-black py-4 rounded-xl uppercase text-xs shadow-lg hover:scale-[1.01] active:scale-95 transition-all">Salvar Configuração</button>
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs font-black uppercase text-slate-600 tracking-widest">Gerenciar Categorias</h2>
              <button onClick={() => { setEditingCat(null); setCatForm({ name: '', order: categories.length }); setShowCatModal(true); }} className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-all">+ Nova Categoria</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-all">
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-sm text-white">{cat.name}</span>
                    <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Ordem: {cat.order}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, order: cat.order }); setShowCatModal(true); }} className="p-2.5 bg-slate-950 rounded-xl text-slate-500 hover:text-yellow-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" strokeLinecap="round" /></svg></button>
                    <button onClick={async () => { if(confirm("Deseja mesmo excluir esta categoria?")) { await deleteCategory(cat.id); refreshData(); } }} className="p-2.5 bg-slate-950 rounded-xl text-slate-500 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth="2.5" strokeLinecap="round" /></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs font-black uppercase text-slate-600 tracking-widest">Catálogo de Produtos</h2>
              <button onClick={() => { setEditingProd(null); setProdForm({ name: '', price: '', category_id: categories[0]?.id || '', description: '' }); setShowProdModal(true); }} className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-all">+ Adicionar Produto</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(prod => (
                <div key={prod.id} className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 hover:border-slate-700 transition-all">
                  <h3 className="font-black text-white uppercase text-base mb-1 tracking-tight leading-none">{prod.name}</h3>
                  <p className="text-yellow-500 font-black text-lg mb-6 italic tracking-tight">R$ {prod.price}</p>
                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                    <button onClick={() => { setEditingProd(prod); setProdForm({ name: prod.name, price: prod.price, category_id: prod.category_id, description: prod.description || '' }); setShowProdModal(true); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-white tracking-widest">Editar</button>
                    <button onClick={async () => { if(confirm("Deseja apagar este produto?")) { await deleteProduct(prod.id); refreshData(); } }} className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 tracking-widest">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CATEGORIA */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-sm p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic mb-8 text-white tracking-tighter">Categoria</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome da Categoria</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mt-1 outline-none focus:border-yellow-500" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="Ex: Cervejas" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Ordem de Exibição</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mt-1 outline-none focus:border-yellow-500" value={catForm.order} onChange={e => setCatForm({...catForm, order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex justify-end gap-6 mt-10">
              <button onClick={() => setShowCatModal(false)} className="text-[10px] font-black uppercase text-slate-600 hover:text-white">Cancelar</button>
              <button onClick={async () => { await upsertCategory(editingCat ? { ...editingCat, ...catForm } : catForm); setShowCatModal(false); refreshData(); }} className="bg-yellow-500 text-slate-950 px-8 py-4 rounded-xl font-black uppercase text-[10px] shadow-xl">Salvar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL PRODUTO */}
      {showProdModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-md p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic mb-8 text-white tracking-tighter">Produto</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome do Item</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mt-1 outline-none focus:border-yellow-500" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} placeholder="Ex: Heineken 330ml" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Preço de Venda</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mt-1 outline-none focus:border-yellow-500" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} placeholder="Ex: 8,50" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Categoria</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mt-1 outline-none focus:border-yellow-500 appearance-none" value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-6 mt-10">
              <button onClick={() => setShowProdModal(false)} className="text-[10px] font-black uppercase text-slate-600 hover:text-white">Voltar</button>
              <button onClick={async () => { await upsertProduct(editingProd ? { ...editingProd, ...prodForm } : prodForm); setShowProdModal(true); refreshData(); alert("Salvo!"); setShowProdModal(false); }} className="bg-yellow-500 text-slate-950 px-8 py-4 rounded-xl font-black uppercase text-[10px] shadow-xl">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
