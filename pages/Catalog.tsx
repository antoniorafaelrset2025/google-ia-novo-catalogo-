
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

  // Link da logo enviada (usando placeholder que simula a imagem enviada)
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
      {/* Header Mobile Otimizado */}
      <header className="flex flex-col items-center pt-8 pb-4 px-6 md:pt-12 md:pb-16">
        <div className="relative group">
          <div className="absolute -inset-1 bg-yellow-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl bg-yellow-500">
             {/* Logo Redonda que você enviou */}
             <div className="w-full h-full flex items-center justify-center text-slate-900 font-black italic text-3xl md:text-4xl bg-yellow-500">
                MR
             </div>
          </div>
        </div>
        <h1 className="mt-4 text-3xl md:text-6xl font-black text-white text-center tracking-tighter uppercase italic leading-none">MR. BEBIDAS</h1>
        <div className="bg-yellow-500 text-slate-900 text-[9px] md:text-[11px] font-black px-4 py-1.5 rounded-full mt-2 tracking-[0.2em] uppercase italic shadow-lg">CATÁLOGO EXCLUSIVO</div>
        
        <button onClick={onLoginClick} className="mt-4 text-[9px] text-slate-700 hover:text-yellow-500 transition-colors flex items-center gap-1.5 uppercase font-black tracking-widest">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
          ADMINISTRAÇÃO
        </button>
      </header>

      {/* Busca e Categorias em Scroll Lateral no Mobile */}
      <div className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-xl px-4 py-4 md:px-6 md:pb-8 border-b border-slate-900/50">
        <div className="relative mb-4 md:mb-6 max-w-3xl mx-auto">
          <input 
            type="text" 
            placeholder="Qual bebida você procura?" 
            className="w-full bg-slate-900/80 border-2 border-slate-800 rounded-2xl md:rounded-[2rem] px-5 py-4 md:px-8 md:py-5 pl-12 md:pl-16 focus:outline-none focus:border-yellow-500 transition-all text-sm md:text-base text-white placeholder:text-slate-600" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <svg className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Categorias - Scroll Horizontal no Mobile */}
        <div className="flex overflow-x-auto gap-2 pb-2 px-1 scrollbar-hide no-scrollbar md:flex-wrap md:justify-center md:gap-3 select-none">
          <button 
            onClick={() => setSelectedCategoryId(null)}
            className={`whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === null ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-lg shadow-yellow-500/20' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}
          >
            TUDO
          </button>
          {categories.sort((a,b) => (a.order || 0) - (b.order || 0)).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === cat.id ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-lg shadow-yellow-500/20' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-500 mb-4"></div>
        </div>
      ) : (
        <div className="px-4 md:px-6 py-8 space-y-12 flex-grow pb-40 animate-fadeIn">
          {categoriesToShow.map(cat => (
            <section key={cat.id}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-lg md:text-2xl font-black text-white uppercase italic tracking-tight">{cat.name}</h2>
                <div className="flex-grow h-px bg-slate-900"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.filter(p => p.category_id === cat.id).map(product => {
                  const buyable = isValidPrice(product.price);
                  return (
                    <div key={product.id} className="bg-slate-900/30 p-5 md:p-6 rounded-[2rem] border border-slate-900 flex flex-col justify-between hover:border-yellow-500/30 transition-all shadow-lg">
                      <div className="mb-4">
                        <h3 className="font-bold text-slate-200 uppercase text-xs md:text-sm tracking-tight leading-tight">{product.name}</h3>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white font-black italic">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <button 
                          onClick={() => buyable && addToCart(product)} 
                          disabled={!buyable}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-xl transition-all ${buyable ? 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/10 active:scale-90' : 'bg-slate-950 text-slate-800 cursor-not-allowed opacity-30'}`}
                        >
                          +
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

      {/* Botão Flutuante de Carrinho - Mais Elegante */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 animate-fadeIn">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="max-w-xl mx-auto w-full bg-yellow-500 text-slate-950 py-4 px-6 rounded-2xl shadow-2xl flex justify-between items-center transform transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="bg-slate-950 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                {cart.length}
              </span>
              <span className="font-black uppercase text-[10px] tracking-widest italic">Ver Pedido</span>
            </div>
            <span className="font-black text-lg italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {/* Modal do Carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex flex-col animate-fadeIn">
          <div className="max-w-2xl mx-auto w-full h-full flex flex-col p-6 md:p-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Pedido</h2>
              <button onClick={() => { setIsCartOpen(false); setShowCheckoutForm(false); }} className="text-slate-500 p-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {cart.map(item => (
                <div key={item.id} className="bg-slate-900/50 p-5 rounded-2xl flex justify-between items-center border border-slate-800">
                  <div className="flex-grow">
                    <h4 className="font-black text-[11px] text-white uppercase tracking-tight">{item.name}</h4>
                    <p className="text-[10px] text-yellow-500 font-bold mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center font-black">-</button>
                    <span className="text-white font-black text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-yellow-500 text-slate-950 rounded-lg flex items-center justify-center font-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 mt-6 border-t border-slate-900">
              <div className="flex justify-between items-center mb-8">
                <span className="text-slate-600 font-black uppercase text-[10px] tracking-widest">Total</span>
                <span className="text-white text-3xl font-black italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              
              {!showCheckoutForm ? (
                <button onClick={() => setShowCheckoutForm(true)} className="w-full bg-yellow-500 text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Informar Nome</button>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-4">
                  <input autoFocus required type="text" placeholder="Seu Nome Completo" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white font-black outline-none focus:border-yellow-500" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  <button type="submit" className="w-full bg-green-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                    Finalizar no WhatsApp
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 py-12 border-t border-slate-900/50 text-center">
        <p className="text-slate-800 text-[9px] font-black tracking-[0.4em] uppercase italic">MR BEBIDAS • 2025</p>
      </footer>
    </div>
  );
};

export default Catalog;
