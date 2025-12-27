
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

  // Link da logo oficial enviada
  const logoUrl = "https://vytaqltyavifnddqrrfo.supabase.co/storage/v1/object/public/assets/logo_mr.jpg"; 

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
    if (!isValidPrice(price)) return "Consulte";
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

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col relative bg-[#020617]">
      {/* Header Mobile Otimizado com Logo Oficial */}
      <header className="flex flex-col items-center pt-8 pb-4 px-6 md:pt-12 md:pb-16">
        <div className="relative group">
          <div className="absolute -inset-2 bg-yellow-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl bg-yellow-500">
             <img 
               src={logoUrl} 
               alt="MR Bebidas Logo" 
               className="w-full h-full object-cover"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 (e.target as any).parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-yellow-500 text-slate-900 font-black italic text-4xl">MR</div>';
               }}
             />
          </div>
        </div>
        <h1 className="mt-6 text-4xl md:text-7xl font-black text-white text-center tracking-tighter uppercase italic leading-none">MR. BEBIDAS</h1>
        <div className="bg-yellow-500 text-slate-900 text-[10px] md:text-[12px] font-black px-5 py-2 rounded-full mt-3 tracking-[0.25em] uppercase italic shadow-lg shadow-yellow-500/10">CATÁLOGO EXCLUSIVO</div>
        
        <button onClick={onLoginClick} className="mt-6 text-[10px] text-slate-700 hover:text-yellow-500 transition-colors flex items-center gap-1.5 uppercase font-black tracking-widest">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
          ADMINISTRAÇÃO
        </button>
      </header>

      {/* Busca e Categorias */}
      <div className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-xl px-4 py-4 md:px-6 md:pb-8 border-b border-slate-900/50">
        <div className="relative mb-4 md:mb-6 max-w-3xl mx-auto">
          <input 
            type="text" 
            placeholder="Qual bebida você procura?" 
            className="w-full bg-slate-900/80 border-2 border-slate-800 rounded-2xl md:rounded-[2rem] px-6 py-5 pl-14 md:pl-16 focus:outline-none focus:border-yellow-500 transition-all text-base text-white placeholder:text-slate-600 shadow-xl" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <svg className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Categorias - Scroll Horizontal */}
        <div className="flex overflow-x-auto gap-2 pb-2 px-1 no-scrollbar md:flex-wrap md:justify-center md:gap-3 select-none">
          <button 
            onClick={() => setSelectedCategoryId(null)}
            className={`whitespace-nowrap px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === null ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-xl shadow-yellow-500/20' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}
          >
            TUDO
          </button>
          {categories.sort((a,b) => (a.order || 0) - (b.order || 0)).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`whitespace-nowrap px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === cat.id ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-xl shadow-yellow-500/20' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500 mb-4"></div>
        </div>
      ) : (
        <div className="px-4 md:px-6 py-10 space-y-16 flex-grow pb-48 animate-fadeIn">
          {categoriesToShow.map(cat => (
            <section key={cat.id}>
              <div className="flex items-center gap-5 mb-8">
                <h2 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter whitespace-nowrap">{cat.name}</h2>
                <div className="flex-grow h-[2px] bg-gradient-to-r from-slate-900 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-8">
                {filteredProducts.filter(p => p.category_id === cat.id).map(product => {
                  const buyable = isValidPrice(product.price);
                  return (
                    <div key={product.id} className="bg-slate-900/20 p-6 md:p-8 rounded-[2.5rem] border border-slate-900 flex flex-col justify-between hover:border-yellow-500/40 hover:bg-slate-900/40 transition-all shadow-2xl group relative overflow-hidden">
                      <div className="mb-6">
                        <h3 className="font-black text-slate-100 uppercase text-sm md:text-lg tracking-tight leading-tight group-hover:text-yellow-500 transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-600 font-bold uppercase mb-1 tracking-widest">Preço</span>
                          <span className={`text-xl md:text-2xl font-black italic tracking-tighter ${buyable ? 'text-white' : 'text-slate-800 text-sm'}`}>
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <button 
                          onClick={() => buyable && addToCart(product)} 
                          disabled={!buyable}
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl transition-all shadow-2xl ${buyable ? 'bg-yellow-500 text-slate-950 shadow-yellow-500/20 hover:scale-110 active:scale-95' : 'bg-slate-950 text-slate-800 cursor-not-allowed opacity-20'}`}
                        >
                          {buyable ? '+' : '×'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Botão de Carrinho Flutuante */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-6 z-40 animate-fadeIn">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="max-w-2xl mx-auto w-full bg-yellow-500 text-slate-950 py-5 px-8 rounded-3xl shadow-[0_20px_50px_rgba(234,179,8,0.4)] flex justify-between items-center transform transition-all active:scale-95 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4">
              <span className="bg-slate-950 text-white text-[11px] font-black px-3 py-1.5 rounded-xl">
                {cart.length}
              </span>
              <span className="font-black uppercase text-xs md:text-sm tracking-widest italic">Ver Meu Pedido</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase text-slate-800/60">Total</span>
               <span className="font-black text-xl md:text-2xl italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
          </button>
        </div>
      )}

      {/* Modal do Carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-50 flex flex-col animate-fadeIn">
          <div className="max-w-2xl mx-auto w-full h-full flex flex-col p-8 md:p-12">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Seu Pedido</h2>
                <div className="h-1.5 w-16 bg-yellow-500 rounded-full mt-3"></div>
              </div>
              <button onClick={() => { setIsCartOpen(false); setShowCheckoutForm(false); }} className="bg-slate-900 text-slate-500 p-4 rounded-full hover:text-white transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-3">
              {cart.map(item => (
                <div key={item.id} className="bg-slate-900/40 p-6 md:p-8 rounded-[2rem] flex justify-between items-center border border-slate-800">
                  <div className="flex-grow">
                    <h4 className="font-black text-sm md:text-base text-white uppercase tracking-tight">{item.name}</h4>
                    <p className="text-xs md:text-sm text-yellow-500 font-bold mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center font-black">-</button>
                    <span className="text-white font-black text-lg min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 bg-yellow-500 text-slate-950 rounded-xl flex items-center justify-center font-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-10 mt-8 border-t border-slate-900">
              <div className="flex justify-between items-center mb-10">
                <span className="text-slate-600 font-black uppercase text-xs tracking-widest">Total Geral</span>
                <span className="text-white text-4xl md:text-5xl font-black italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              
              {!showCheckoutForm ? (
                <button onClick={() => setShowCheckoutForm(true)} className="w-full bg-yellow-500 text-slate-950 py-6 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-yellow-500/10">Prosseguir</button>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-6 animate-fadeIn">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                    <label className="text-[10px] font-black uppercase text-slate-600 block mb-2">Identificação</label>
                    <input autoFocus required type="text" placeholder="Digite seu nome" className="w-full bg-transparent text-white font-black outline-none text-2xl placeholder:text-slate-800" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-green-500 text-white py-6 rounded-3xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-green-400 transition-all">
                    Finalizar no WhatsApp
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-40 py-16 border-t border-slate-900/50 text-center">
        <p className="text-slate-800 text-[10px] font-black tracking-[0.5em] uppercase italic">QUALIDADE PREMIUM • MR BEBIDAS © 2025</p>
      </footer>
    </div>
  );
};

export default Catalog;
