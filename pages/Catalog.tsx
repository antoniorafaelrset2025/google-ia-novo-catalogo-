
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
      console.error("Erro ao carregar dados no catálogo:", error);
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

  const isValidPrice = (price: string) => {
    if (!price) return false;
    const cleanPrice = price.trim().replace(',', '.');
    const numPrice = parseFloat(cleanPrice);
    return !isNaN(numPrice) && numPrice > 0;
  };

  const addToCart = (product: Product) => {
    if (!isValidPrice(product.price)) {
      return;
    }
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
    const price = parseFloat(item.price.replace(',', '.'));
    return acc + (isNaN(price) ? 0 : price * item.quantity);
  }, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return alert("Por favor, informe seu nome.");

    const itemsText = cart.map(item => `- ${item.quantity}x ${item.name} (R$ ${item.price})`).join('\n');
    const totalFormatted = cartTotal.toFixed(2).replace('.', ',');
    const message = `Olá! Gostaria de fazer um pedido:\n\n*Cliente:* ${customerName}\n\n*Itens:*\n${itemsText}\n\n*Total:* R$ ${totalFormatted}`;
    
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
    .sort((a, b) => a.order - b.order);

  if (dbMissing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/20">
          <span className="text-slate-900 font-black text-2xl italic">MR</span>
        </div>
        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">Sistema em Configuração</h2>
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest max-w-xs leading-relaxed">
          O banco de dados do catálogo está sendo inicializado. Se você é o administrador, acesse o painel para concluir a configuração.
        </p>
        <button onClick={onLoginClick} className="mt-8 bg-yellow-500 text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Acessar Admin</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col relative bg-[#020617]">
      <header className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-3 shadow-2xl shadow-yellow-500/20 transform hover:scale-105 transition-transform cursor-pointer">
          <span className="text-slate-900 font-black text-2xl italic">MR</span>
        </div>
        <h1 className="text-3xl font-black text-white text-center tracking-tighter uppercase italic">MR. BEBIDAS</h1>
        <div className="bg-yellow-500 text-slate-900 text-[9px] font-black px-3 py-1 rounded-md mt-1 tracking-widest uppercase italic">Catálogo Digital</div>
        
        <button onClick={onLoginClick} className="mt-5 text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 uppercase font-black">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
          Área do Admin
        </button>
      </header>

      <div className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-md pt-2 pb-4">
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Buscar bebida..." 
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500 transition-all text-sm text-white placeholder:text-slate-600" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <svg className="absolute left-4 top-4 h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar select-none">
          <button 
            onClick={() => setSelectedCategoryId(null)}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${selectedCategoryId === null ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'bg-slate-900/60 text-slate-400 border-slate-800/50 hover:border-slate-700'}`}
          >
            TODOS
          </button>
          {categories.sort((a,b) => a.order - b.order).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${selectedCategoryId === cat.id ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'bg-slate-900/60 text-slate-400 border-slate-800/50 hover:border-slate-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="space-y-10 flex-grow pb-32 mt-4 animate-fadeIn">
          {categoriesToShow.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Nenhum item encontrado.</p>
            </div>
          ) : (
            categoriesToShow.map(cat => (
              <section key={cat.id} className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-[2px] w-8 bg-yellow-500/30"></div>
                  <h2 className="text-sm font-black text-white uppercase italic tracking-widest">{cat.name}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.filter(p => p.category_id === cat.id).map(product => {
                    const canBuy = isValidPrice(product.price);
                    return (
                      <div key={product.id} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 flex justify-between items-center hover:border-slate-700 transition-colors">
                        <div className="flex-grow pr-4">
                          <h3 className="font-bold text-slate-200 uppercase text-xs tracking-tight">{product.name}</h3>
                          <p className="text-[11px] text-slate-500 font-bold mt-1">
                            {canBuy ? `R$ ${product.price}` : 'Consulte Valor'}
                          </p>
                        </div>
                        <button 
                          onClick={() => canBuy && addToCart(product)} 
                          disabled={!canBuy}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-lg ${canBuy ? 'bg-yellow-500 text-slate-950 hover:scale-105 active:scale-90 shadow-yellow-500/5' : 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none opacity-50'}`}
                        >
                          +
                        </button>
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
        <div className="fixed bottom-6 left-0 right-0 px-6 z-40 animate-fadeIn">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="max-w-xl mx-auto w-full bg-yellow-500 text-slate-950 p-4 rounded-2xl shadow-2xl flex justify-between items-center transform hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-950 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                {cart.length}
              </div>
              <span className="font-black uppercase text-[11px] tracking-widest italic">Ver Pedido</span>
            </div>
            <span className="font-black text-sm italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col animate-fadeIn">
          <div className="max-w-xl mx-auto w-full h-full flex flex-col shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-10 mt-4">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Meu Pedido</h2>
                <div className="h-1 w-10 bg-yellow-500 rounded-full mt-1"></div>
              </div>
              <button onClick={() => { setIsCartOpen(false); setShowCheckoutForm(false); }} className="bg-slate-900 text-slate-400 p-3 rounded-full hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {cart.map(item => (
                <div key={item.id} className="bg-slate-900/50 p-4 rounded-2xl flex justify-between items-center border border-slate-800/50">
                  <div className="flex-grow">
                    <h4 className="font-black text-[11px] text-white uppercase tracking-tight">{item.name}</h4>
                    <p className="text-[10px] text-yellow-500 font-black mt-1">R$ {item.price}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center font-black">-</button>
                    <span className="text-white font-black text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-yellow-500 text-slate-950 rounded-lg flex items-center justify-center font-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 mt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Total do Pedido</span>
                <span className="text-white text-3xl font-black italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              
              {!showCheckoutForm ? (
                <button onClick={() => setShowCheckoutForm(true)} className="w-full bg-yellow-500 text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-yellow-500/10">Prosseguir</button>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">Seu Nome para Identificação</label>
                    <input autoFocus required type="text" placeholder="Nome do Cliente" className="w-full bg-transparent text-white font-black outline-none text-sm placeholder:text-slate-800" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-green-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-green-500/10">
                    Finalizar no WhatsApp
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-10 py-10 border-t border-slate-900/50 text-center">
        <p className="text-slate-700 text-[10px] font-black tracking-widest uppercase italic">Qualidade no Copo, Preço no Bolso • 2025</p>
      </footer>
    </div>
  );
};

export default Catalog;
