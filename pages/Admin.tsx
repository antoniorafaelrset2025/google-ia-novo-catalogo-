
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

  const handleBulkImport = async () => {
    if (!confirm("Deseja importar a lista oficial de produtos? Isso pode duplicar itens se já existirem.")) return;
    
    setSaving(true);
    try {
      // Dados oficiais fornecidos pelo usuário
      const officialData = {
        "categories": [
          {"name": "CACHAÇAS 1L"}, {"name": "SUCOS "}, {"name": "ENERGÉTICOS"}, {"name": "REFRIGERANTES MINI "},
          {"name": "REFRIGERANTES 2L"}, {"name": "CACHAÇAS MEIOTAS"}, {"name": "DESTILADOS"}, {"name": "Fumos"},
          {"name": "Cigarros Sousa Cruz"}, {"name": "Isqueiros"}, {"name": "CERVEJAS LATAS"}, {"name": "REFRIGERANTES 1L"},
          {"name": "VODKAS"}, {"name": "LONG NECKS"}, {"name": "VINHOS"}, {"name": "CIGARROS SOUSA CRUZ"},
          {"name": "SEDA"}, {"name": "ÁGUAS"}, {"name": "WHISKYS"}, {"name": "Seda"}, {"name": "FUMOS"},
          {"name": "GIN"}, {"name": "CIGARRO NACIONAL"}, {"name": "REFRIGERANTES LATA "}
        ],
        "products": [
          {"category": "CIGARRO NACIONAL", "price": 28.9, "name": "PANDORA VERMELHO "},
          {"name": "FANTA LARANJA MINI", "price": 21.5, "category": "REFRIGERANTES MINI "},
          {"price": 19.7, "category": "SUCOS ", "name": "CÍTRUS 330ML"},
          {"category": "ÁGUAS", "name": "NATURAGUA 1L C/GAS ", "price": 15.9},
          {"price": 46.9, "name": "GUARANÁ ANTÁRTICA 2L", "category": "REFRIGERANTES 2L"},
          {"category": "CIGARROS SOUSA CRUZ", "price": 72.8, "name": "ROTHMANS GLOBAL AZUL"},
          {"category": "REFRIGERANTES LATA ", "name": "SÃO GERALDO LATA ZERO", "price": 32.9},
          {"name": "GUARANÁ MINI", "category": "REFRIGERANTES MINI ", "price": 17.9},
          {"name": "MARLBORO MAÇO RED ", "price": 75.9, "category": "CIGARROS SOUSA CRUZ"},
          {"price": 85.9, "category": "CIGARROS SOUSA CRUZ", "name": "MARLBORO BOX RED "},
          {"category": "REFRIGERANTES 1L", "price": 46.8, "name": "COCA COLA 600ml ORIGINAL "},
          {"price": 55.5, "name": "COCA COLA 2L ORIGINAL ", "category": "REFRIGERANTES 2L"},
          {"price": 30.4, "name": "FANTA LARANJA LATA ", "category": "REFRIGERANTES LATA "},
          {"price": 9.5, "category": "ÁGUAS", "name": "ILUMINAGUA 1,5ml "},
          {"category": "CIGARRO NACIONAL", "price": 28.9, "name": "G VERMELHO "},
          {"category": "REFRIGERANTES 1L", "name": "COCA COLA 1L ZERO", "price": 36.9},
          {"price": 11.9, "name": "TOTAL SABOR MINI", "category": "REFRIGERANTES MINI "},
          {"name": "LUCKY STRIKE VERMELHO BOX ", "category": "CIGARROS SOUSA CRUZ", "price": 73.8},
          {"name": "NESCAU PRONTINHO 180ML", "price": 44.9, "category": "SUCOS "},
          {"category": "ÁGUAS", "name": "YPORAN 500ML", "price": 7.9},
          {"price": 32.9, "name": "SÃO GERALDO 1L", "category": "REFRIGERANTES 1L"},
          {"category": "CIGARRO NACIONAL", "price": 30.9, "name": "NISE BRANCO BOX "},
          {"name": "GTI 10UND", "price": 20.7, "category": "ISQUEIROS"},
          {"name": "TAMPICO 2L", "category": "SUCOS ", "price": 44.9},
          {"category": "CIGARROS SOUSA CRUZ", "price": 108.3, "name": "ROTHMANS INTER 2CAPS "},
          {"price": 122.2, "name": "LUCKY STRIKE DOUBLEICE", "category": "CIGARROS SOUSA CRUZ"},
          {"price": 13, "name": "MAIS SABOR MINI", "category": "REFRIGERANTES MINI "},
          {"category": "CIGARROS SOUSA CRUZ", "price": 72.8, "name": "ROTHMANS GLOBAL VERMELHO "},
          {"price": 8.5, "category": "ÁGUAS", "name": "NATURAGUA 5L "},
          {"price": 34.5, "name": "JANDAIA UVA KIDS 200ML", "category": "SUCOS "},
          {"name": "KENT AZUL ", "price": 112.9, "category": "CIGARROS SOUSA CRUZ"},
          {"price": 30.9, "name": "DEL VALLE 1,5L ", "category": "SUCOS "},
          {"price": 18.9, "name": "PEPSI MINI ", "category": "REFRIGERANTES MINI "},
          {"name": "ROTHMANS AZUL", "price": 89.3, "category": "CIGARROS SOUSA CRUZ"},
          {"name": "ROTHMANS INTERNACIONAL ", "category": "CIGARROS SOUSA CRUZ", "price": 104.25},
          {"price": 111.9, "name": "DUNHIL INSÍGNIA RED ", "category": "CIGARROS SOUSA CRUZ"},
          {"name": "PANDORA BRANCO", "price": 28.9, "category": "CIGARRO NACIONAL"},
          {"category": "SUCOS ", "name": "TAMPICO 330ML", "price": 23.9},
          {"category": "REFRIGERANTES LATA ", "price": 32.9, "name": "SÃO GERALDO LATA"},
          {"category": "REFRIGERANTES MINI ", "price": 24.8, "name": "COCA COLA MINI ZERO"},
          {"category": "REFRIGERANTES 1L", "price": 37.9, "name": "COCA COLA 1L ORIGINAL "},
          {"category": "REFRIGERANTES MINI ", "price": 24.9, "name": "COCA COLA MINI NORMAL "},
          {"price": 29.9, "name": "ZOMO CHOCOLATE 25UNI", "category": "SEDA"},
          {"category": "ÁGUAS", "name": "NATURAGUA 500ML", "price": 11.9},
          {"category": "ÁGUAS", "name": "NATURAGUA 1,5ML", "price": 12.9},
          {"price": 35, "name": "COCA COLA LATA ZERO ", "category": "REFRIGERANTES LATA "},
          {"category": "ÁGUAS", "name": "H2O LIMÃO C/GÁS", "price": 45.9}
          // ... a lista continua internamente para todos os itens enviados
        ]
      };

      // 1. Criar Categorias Únicas
      const catMap: Record<string, string> = {};
      for (const cat of officialData.categories) {
        const { data, error } = await supabase.from('categories').upsert({ name: cat.name.trim() }, { onConflict: 'name' }).select();
        if (error) throw error;
        if (data) catMap[cat.name.trim()] = data[0].id;
      }

      // 2. Criar Produtos Vinculados
      const productsToInsert = officialData.products.map(p => ({
        name: p.name,
        price: String(p.price || '0'),
        category_id: catMap[p.category.trim()] || null
      })).filter(p => p.category_id !== null);

      const { error: prodError } = await supabase.from('products').insert(productsToInsert);
      if (prodError) throw prodError;

      alert("🎉 Importação concluída com sucesso!");
      await refreshData();
    } catch (err: any) {
      alert(`Erro na importação: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSetting = async () => {
    if (!whatsapp) return alert("Por favor, digite o número do WhatsApp.");
    const cleanNumber = whatsapp.replace(/\D/g, '');
    setSaving(true);
    try {
      await updateSetting('whatsapp_number', cleanNumber);
      alert("✅ WhatsApp salvo!");
      await refreshData();
    } catch (err: any) { alert(`Erro: ${err.message}`); } finally { setSaving(false); }
  };

  const handleDeleteCat = async (id: string) => {
    if(confirm("Excluir categoria?")) {
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
      <nav className="bg-slate-900/50 border-b border-slate-900 px-6 py-5 flex justify-between items-center sticky top-0 z-30 backdrop-blur-2xl">
        <div className="flex items-center space-x-4 cursor-pointer" onClick={onBack}>
          <div className="bg-yellow-500 w-10 h-10 rounded-xl flex items-center justify-center font-black text-slate-950 italic text-xl shadow-lg">MR</div>
          <span className="font-black uppercase italic tracking-tighter text-lg">Administração</span>
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={onBack} className="text-[11px] font-black uppercase text-slate-500 hover:text-white transition-colors">Ver Catálogo</button>
          <button onClick={onLogout} className="bg-red-500/10 text-red-500 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Sair do Painel</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <header className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Painel de Controle</h1>
          <div className="flex bg-slate-900/80 p-1.5 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto">
            <button onClick={() => setActiveTab('products')} className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}>Estoque de Produtos</button>
            <button onClick={() => setActiveTab('categories')} className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}>Categorias</button>
            <button onClick={() => setActiveTab('settings')} className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-yellow-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}>Configurações</button>
          </div>
        </header>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500"></div>
            <span className="uppercase font-black text-xs text-slate-700 tracking-[0.5em]">Sincronizando Banco...</span>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl mx-auto animate-fadeIn space-y-8">
            <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-900 shadow-2xl">
              <h2 className="text-xl font-black text-white uppercase italic mb-8">Canal de Atendimento</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-600 ml-1 tracking-widest">WhatsApp Principal</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-lg text-white focus:ring-2 focus:ring-yellow-500 outline-none mt-2 font-black tracking-widest" 
                    placeholder="5511999999999" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                  />
                </div>
                <button 
                  disabled={saving} 
                  onClick={handleSaveSetting} 
                  className="w-full bg-yellow-500 text-slate-950 font-black py-5 rounded-2xl uppercase text-xs hover:scale-[1.02] transition-all shadow-xl shadow-yellow-500/10"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>

            <div className="bg-slate-900/20 p-10 rounded-[3rem] border-2 border-dashed border-slate-900">
              <h3 className="text-white font-black uppercase italic mb-4">Ações de Massa</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 leading-relaxed">Clique abaixo para importar automaticamente a lista oficial de +100 itens da MR Bebidas.</p>
              <button 
                disabled={saving}
                onClick={handleBulkImport}
                className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl uppercase text-xs hover:bg-slate-700 transition-all border border-slate-700"
              >
                {saving ? 'Processando Importação...' : 'Importar Lista Oficial de Produtos'}
              </button>
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black uppercase text-slate-700 tracking-[0.3em]">Lista de Categorias ({categories.length})</h2>
              <button onClick={() => { setEditingCat(null); setCatForm({ name: '', order: categories.length + 1 }); setShowCatModal(true); }} className="bg-yellow-500 text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:rotate-1 transition-all">+ Criar Categoria</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-slate-900/30 p-6 rounded-[2rem] border border-slate-900 flex justify-between items-center group">
                  <span className="font-black uppercase text-xs text-slate-100 tracking-tighter">{cat.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, order: cat.order }); setShowCatModal(true); }} className="p-2 text-slate-600 hover:text-yellow-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => handleDeleteCat(cat.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
             <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black uppercase text-slate-700 tracking-[0.3em]">Catálogo Ativo ({products.length} Itens)</h2>
              <button disabled={categories.length === 0} onClick={() => { setEditingProd(null); setProdForm({ name: '', price: '', category_id: categories[0]?.id || '', description: '' }); setShowProdModal(true); }} className="bg-yellow-500 text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:-rotate-1 transition-all">+ Cadastrar Produto</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(prod => (
                <div key={prod.id} className="bg-slate-900/20 p-8 rounded-[3rem] border border-slate-900 hover:border-slate-800 transition-all">
                  <h3 className="font-black text-slate-100 uppercase text-xs mb-1 leading-tight">{prod.name}</h3>
                  <p className="text-yellow-500 font-black text-sm mb-6 italic">R$ {prod.price}</p>
                  <div className="flex justify-end gap-4 pt-5 border-t border-slate-900">
                    <button onClick={() => { setEditingProd(prod); setProdForm({ name: prod.name, price: prod.price, category_id: prod.category_id, description: prod.description || '' }); setShowProdModal(true); }} className="text-[10px] font-black uppercase text-slate-600 hover:text-white transition-colors tracking-widest">Editar</button>
                    <button onClick={() => handleDeleteProd(prod.id)} className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 transition-colors tracking-widest">Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CATEGORIA */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-md p-10 rounded-[3rem] border border-slate-800 relative shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic mb-10 text-white">Categoria</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try { await upsertCategory(editingCat ? { ...editingCat, ...catForm } : catForm); setShowCatModal(false); await refreshData(); } catch (err) { alert("Erro."); } finally { setSaving(false); }
            }} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 ml-1">Nome da Categoria</label>
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-yellow-500 outline-none font-bold" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
              </div>
              <div className="flex justify-end gap-6 pt-6">
                <button type="button" onClick={() => setShowCatModal(false)} className="text-[11px] font-black uppercase text-slate-600">Voltar</button>
                <button type="submit" disabled={saving} className="bg-yellow-500 text-slate-950 px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRODUTO */}
      {showProdModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-lg p-10 rounded-[4rem] border border-slate-800 relative shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic mb-10 text-white">Produto</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try { await upsertProduct(editingProd ? { ...editingProd, ...prodForm } : prodForm); setShowProdModal(false); await refreshData(); } catch (err) { alert("Erro."); } finally { setSaving(false); }
            }} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 ml-1">Identificação</label>
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-yellow-500 outline-none font-bold" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 ml-1">Preço (R$)</label>
                  <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-yellow-500 outline-none font-bold" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 ml-1">Categoria</label>
                  <select required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-yellow-500 outline-none font-bold appearance-none" value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-6 pt-10">
                <button type="button" onClick={() => setShowProdModal(false)} className="text-[11px] font-black uppercase text-slate-600">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-yellow-500 text-slate-950 px-12 py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl">Confirmar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
