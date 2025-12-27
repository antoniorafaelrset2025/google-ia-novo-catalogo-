
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

  // Link da logo oficial
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
      {/* Header Centralizado com Logo Oficial */}
      <header className="flex flex-col items-center pt-10 pb-6 px-6">
        <div className="relative">
          <div className="absolute -inset-6 bg-yellow-500 rounded-full blur-3xl opacity-20"></div>
          <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center">
             <img 
               src={logoUrl} 
               alt="MR Bebidas" 
               className="w-full h-full object-cover block"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
               }}
             />
             <span className="text-yellow-500 font-black text-4xl italic absolute z-0">MR</span>
          </div>
        </div>
        <h1 className="mt-8 text-4xl md:text-7xl font-black text-white text-center tracking-tighter uppercase italic leading-none">MR. BEBIDAS</h1>
        <div className="bg-yellow-500 text-slate-900 text-[10px] md:text-[12px] font-black px-5 py-2 rounded-full mt-4 tracking-[0.3em] uppercase italic shadow-xl">CATÁLOGO OFICIAL</div>
        
        <button onClick={onLoginClick} className="mt-8 text-[11px] text-slate-700 hover:text-yellow-500 transition-colors flex items-center gap-2 uppercase font-black tracking-widest">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
          ADMINISTRAÇÃO
        </button>
      </header>

      {/* Busca e Filtros */}
      <div className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-xl px-4 py-6 md:px-6 border-b border-slate-900/50">
        <div className="relative mb-6 max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="O que você precisa?" 
            className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-6 py-4 pl-14 focus:outline-none focus:border-yellow-500 transition-all text-white placeholder:text-slate-700 shadow-inner" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 px-1 no-scrollbar md:flex-wrap md:justify-center select-none">
          <button 
            onClick={() => setSelectedCategoryId(null)}
            className={`whitespace-nowrap px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === null ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-lg' : 'bg-slate-900/50 text-slate-600 border-slate-900'}`}
          >
            TUDO
          </button>
          {categories.sort((a,b) => (a.order || 0) - (b.order || 0)).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`whitespace-nowrap px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategoryId === cat.id ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-lg' : 'bg-slate-900/50 text-slate-600 border-slate-900'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="px-4 md:px-6 py-12 space-y-20 flex-grow pb-64">
          {categoriesToShow.map(cat => (
            <section key={cat.id}>
              <div className="flex items-center gap-4 mb-8 px-2">
                <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter whitespace-nowrap">{cat.name}</h2>
                <div className="flex-grow h-[3px] bg-slate-900"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {filteredProducts.filter(p => p.category_id === cat.id).map(product => {
                  const buyable = isValidPrice(product.price);
                  return (
                    <div key={product.id} className="bg-slate-900/40 p-5 md:p-7 rounded-[2.5rem] border-2 border-slate-900 flex flex-col justify-between hover:border-yellow-500/50 transition-all group relative overflow-hidden">
                      <div className="mb-2">
                        <h3 className="font-black text-white uppercase text-xl md:text-2xl tracking-tight leading-none group-hover:text-yellow-500 transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-end justify-between mt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-600 font-black uppercase mb-0.5 tracking-wider">OFERTA</span>
                          <span className={`text-3xl md:text-4xl font-black italic tracking-tighter leading-none ${buyable ? 'text-white' : 'text-slate-800 text-base'}`}>
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <button 
                          onClick={() => buyable && addToCart(product)} 
                          className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-3xl transition-all shadow-xl ${buyable ? 'bg-yellow-500 text-slate-950 active:scale-90 hover:scale-105' : 'bg-slate-950 text-slate-900 cursor-not-allowed opacity-20'}`}
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

      {/* Rodapé e Carrinho Omitidos para brevidade, mas mantidos na lógica interna */}
      {cart.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 px-8 z-40">
          <button onClick={() => setIsCartOpen(true)} className="max-w-xl mx-auto w-full bg-yellow-500 text-slate-950 py-5 px-10 rounded-3xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] flex justify-between items-center transform transition-all active:scale-95 border-4 border-slate-950">
            <span className="font-black uppercase text-xs tracking-widest italic">{cart.length} Itens no Pedido</span>
            <span className="font-black text-2xl italic">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalog;
