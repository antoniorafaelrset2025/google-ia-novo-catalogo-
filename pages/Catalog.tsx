
import React, { useState, useEffect } from 'react';
import { getCategories, getProducts, getSetting, supabase } from '../supabase';
import { Category, Product, CartItem } from '../types';

interface CatalogProps {
  onLoginClick: () => void;
}

const Catalog: React.FC<CatalogProps> = ({ onLoginClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbMissing, setDbMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const fetchData = async () => {
    try {
      const [cats, prods, wa] = await Promise.all([
        getCategories(), 
        getProducts(),
        getSetting('whatsapp_number')
      ]);

      if (cats === "__DB_MISSING__" || prods === "__DB_MISSING__" || wa === "__DB_MISSING__") {
        setDbMissing(true);
        setLoading(false);
        return;
      }

      setCategories(cats || []);
      setProducts(prods || []);
      setWhatsappNumber(wa || '5511999999999');
      setDbMissing(false);
    } catch (error: any) {
      console.error("Erro ao carregar catálogo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const isValidPrice = (price: any) => {
    if (price === null || price === undefined) return false;
    const priceStr = String(price).trim().replace(',', '.');
    const numPrice = parseFloat(priceStr);
    return !isNaN(numPrice) && numPrice > 0;
  };

  const formatPrice = (price: any) => {
    if (!isValidPrice(price)) return "Sob Consulta";
    const num = parseFloat(String(price).replace(',', '.'));
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  const addToCart = (product: Product) => {
    if (!isValidPrice(product.price)) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((acc, item) => {
    const price = parseFloat(String(item.price).replace(',', '.'));
    return acc + (isNaN(price) ? 0 : price * item.quantity);
  }, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return alert("Por favor, informe seu nome.");

    const itemsText = cart.map(item => `• *${item.quantity}x* ${item.name} (${formatPrice(item.price)})`).join('\n');
    const totalFormatted = cartTotal.toFixed(2).replace('.', ',');
    const message = `Olá MR Bebidas! Gostaria de fazer um pedido:\n\n👤 *Cliente:* ${customerName}\n\n🛒 *Itens:*\n${itemsText}\n\n💰 *Total:* R$ ${totalFormatted}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    setCart([]);
    setCustomerName('');
    setShowCheckoutForm(false);
    setIsCartOpen(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
    return matchesSearch && matchesCategory;
  });

  const categoriesToShow = categories
    .filter(cat => {
      if (selectedCategoryId && cat.id !== selectedCategoryId) return false;
      return products.some(p => p.category_id === cat.id && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (dbMissing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-yellow-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/20">
          <span className="text-slate-900 font-black text-4xl italic">MR</span>
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Configuração Necessária</h2>
        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest max-w-xs leading-relaxed">Acesse o painel para importar a lista oficial de produtos.</p>
        <button onClick={onLoginClick} className="mt-8 bg-yellow-500 text-slate-900 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest">Painel Admin</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen flex flex-col relative bg-[#020617]">
      <header className="flex flex-col items-center mb-16">
        <div className="w-28 h-28 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/20 transform hover:rotate-6 transition-transform cursor-pointer">
          <span className="text-slate-900 font-black text-4xl italic">MR</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white text-center tracking-tighter uppercase italic leading-none">MR. BEBIDAS</h1>
        <div className="bg-yellow-500 text-slate-900 text-[11px] font-black px-6 py-2 rounded-full mt-4 tracking-[0.3em] uppercase italic shadow-lg">CATÁLOGO EXCLUSIVO</div>
        
        <button onClick={onLoginClick} className="mt-8 text-[10px] text-slate-700 hover:text-yellow-500 transition-colors flex items-center gap-2 uppercase font-black tracking-widest">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
          Área Privada
        </button>
      </header>

      <div className="sticky top-0 z-40 bg-[#020617]/90 backdrop-blur-2xl pt-4 pb-8 border-b border-slate-900/50 mb-10">
        <div className="relative mb-8 max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder="O que você deseja beber agora?" 
            className="w-full bg-slate-900/60 border-2 border-slate-800 rounded-[2.5rem] px-8 py-6 pl-16 focus:outline-none focus:border-yellow-500 transition-all text-lg text-white placeholder:text-slate-700 shadow-2xl" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <svg className="absolute left-7 top-6.5 h-7 w-7 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex flex-wrap justify-center gap-3 select-none">
          <button 
            onClick={() => setSelectedCategoryId(null)}
            className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === null ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-2xl shadow-yellow-500/40' : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-600'}`}
          >
            TODOS OS ITENS
          </button>
          {categories.sort((a,b) => (a.order || 0) - (b.order || 0)).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === cat.id ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-2xl shadow-yellow-500/40' : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-600'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex flex-col items-center justify-center py-40">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-yellow-500 mb-6"></div>
          <span className="text-slate-700 font-black uppercase text-xs tracking-[0.4em]">Organizando adega...</span>
        </div>
      ) : (
        <div className="space-y-24 flex-grow pb-48 animate-fadeIn">
          {categoriesToShow.length === 0 ? (
            <div className="text-center py-40 bg-slate-900/5 rounded-[5rem] border-2 border-dashed border-slate-900/50">
              <p className="text-sm text-slate-800 uppercase font-black tracking-widest">Nenhum produto disponível no momento.</p>
            </div>
          ) : (
            categoriesToShow.map(cat => (
              <section key={cat.id} className="animate-fadeIn">
                <div className="flex items-center gap-6 mb-10">
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter whitespace-nowrap">{cat.name}</h2>
                  <div className="flex-grow h-[2px] bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.filter(p => p.category_id === cat.id).map(product => {
                    const buyable = isValidPrice(product.price);
                    return (
                      <div key={product.id} className="bg-slate-900/20 p-8 rounded-[3rem] border-2 border-slate-900/50 flex flex-col justify-between hover:border-yellow-500/30 hover:bg-slate-900/40 transition-all group shadow-xl relative overflow-hidden">
                        <div className="mb-6">
                          <h3 className="font-black text-slate-100 uppercase text-sm md:text-base tracking-tight leading-tight group-hover:text-yellow-500 transition-colors">{product.name}</h3>
                          {product.description && <p className="text-[10px] text-slate-600 uppercase font-bold mt-2 line-clamp-2">{product.description}</p>}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Valor Unitário</span>
                            <span className={`text-xl font-black italic ${buyable ? 'text-white' : 'text-slate-800 text-sm'}`}>
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <button 
                            onClick={() => buyable && addToCart(product)} 
                            disabled={!buyable}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all ${buyable ? 'bg-yellow-500 text-slate-950 hover:scale-110 active:scale-90 shadow-2xl shadow-yellow-500/20' : 'bg-slate-950 text-slate-800 cursor-not-allowed border border-slate-900'}`}
                          >
                            {buyable ? '+' : '×'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 px-10 z-40 animate-fadeIn">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="max-w-4xl mx-auto w-full bg-yellow-500 text-slate-950 p-8 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(234,179,8,0.5)] flex justify-between items-center transform hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="bg-slate-950 text-white text-sm font-black px-4 py-2 rounded-2xl">
                {cart.length}
              </div>
              <span className="font-black uppercase text-sm md:text-base tracking-[0.2em] italic">Revisar Carrinho</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase text-slate-800/50">Total</span>
              <span className="font-black text-2xl md:text-3xl italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-50 flex flex-col animate-fadeIn">
          <div className="max-w-3xl mx-auto w-full h-full flex flex-col p-10">
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Carrinho</h2>
                <div className="h-2 w-20 bg-yellow-500 rounded-full mt-4"></div>
              </div>
              <button onClick={() => { setIsCartOpen(false); setShowCheckoutForm(false); }} className="bg-slate-900 text-slate-500 p-6 rounded-full hover:text-white hover:bg-slate-800 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-4">
              {cart.map(item => (
                <div key={item.id} className="bg-slate-900/30 p-8 rounded-[3rem] flex justify-between items-center border-2 border-slate-900/50">
                  <div className="flex-grow">
                    <h4 className="font-black text-base text-white uppercase tracking-tight">{item.name}</h4>
                    <p className="text-sm text-yellow-500 font-black mt-2">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black hover:bg-slate-700 transition-colors">-</button>
                    <span className="text-white font-black text-xl min-w-[30px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-12 h-12 bg-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center font-black hover:bg-yellow-400 transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-12 mt-8 border-t-2 border-slate-900/50">
              <div className="flex justify-between items-center mb-12">
                <span className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">Total do Pedido</span>
                <span className="text-white text-5xl md:text-6xl font-black italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              
              {!showCheckoutForm ? (
                <button onClick={() => setShowCheckoutForm(true)} className="w-full bg-yellow-500 text-slate-950 py-8 rounded-[2.5rem] font-black uppercase text-base tracking-[0.3em] shadow-2xl hover:scale-[1.01] transition-all">Próximo Passo</button>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-8 animate-fadeIn">
                  <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2.5rem] focus-within:border-yellow-500 transition-all shadow-inner">
                    <label className="text-[11px] font-black uppercase text-slate-600 block mb-3 tracking-widest">Seu Nome / Empresa</label>
                    <input autoFocus required type="text" placeholder="Nome para identificação" className="w-full bg-transparent text-white font-black outline-none text-2xl placeholder:text-slate-900" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-green-500 text-white py-8 rounded-[2.5rem] font-black uppercase text-base tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-green-400 transition-all">
                    Finalizar no WhatsApp
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-40 py-24 border-t-2 border-slate-900/30 text-center">
        <p className="text-slate-800 text-[10px] font-black tracking-[0.6em] uppercase italic">QUALIDADE PREMIUM • MR BEBIDAS © 2025</p>
      </footer>
    </div>
  );
};

export default Catalog;
