import React, { useEffect, useMemo, useState } from "react";
import Reviews, { ReviewList, ReviewSummary, StarRatingDisplay } from "../components/Reviews";
import { useNavigate } from "react-router-dom";
import { useCart } from "../Context/CartContext";
import { useCartDrawer } from "../Context/CartDrawerContext";


const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

// --- Icons ---
const IconCart = ({ count }) => (
  <div className="relative">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-stone-50 shadow-sm animate-bounce-short">
        {count}
      </span>
    )}
  </div>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconFilter = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

export default function ShopWithApi() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // UI State
  const [query, setQuery] = useState("");
const [isCartOpen, setIsCartOpen] = useState(false); // you can actually remove this now
const { itemCount, addProduct } = useCart();
const { openCart } = useCartDrawer();

  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(2000);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products/`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        if (!mounted) return;

        const normalized = (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category || "Uncategorized",
          unit: p.unit,
          price_per_100g: p.price_per_100g ?? null,
          price_per_pc: p.price_per_pc ?? null,
          unit_options: (p.product_unit_options || p.unitOptions || []).map((o) => ({
            label: o.label, grams: o.grams, price: o.price
          })),
          images: (p.product_images || p.productImages || []).map((i) => i.url),
          description: p.description,
          rating: p.rating ?? 4.5,
        }));
        setProducts(normalized);
      } catch (e) {
        console.warn("Failed:", e);
        setProducts(sampleProducts);
        setErr("Viewing sample menu (API offline).");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  // Sample Data Fallback
  const sampleProducts = [
    { id: "cookie-001", name: "Belgian Chocolate Chunk", category: "Cookies", unit: "gm", price_per_100g: 140, images: ["https://images.unsplash.com/photo-1499636138143-bd630f5cf38a?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1618923866180-f6f06328dcb3?q=80&w=800&auto=format&fit=crop"], description: "Rich, buttery dough filled with chunks of pure Belgian dark chocolate.", rating: 4.9 },
    { id: "bread-001", name: "Artisan Sourdough Loaf", category: "Breads", unit: "pc", price_per_pc: 250, images: ["https://images.unsplash.com/photo-1585476215504-5b33be5d90d9?q=80&w=800&auto=format&fit=crop"], description: "Fermented for 48 hours with a crisp crust and airy crumb.", rating: 4.7 },
    { id: "cake-001", name: "Royal Red Velvet", category: "Cakes", unit: "variant", unit_options: [{ label: "500g", grams: 500, price: 850 }, { label: "1kg", grams: 1000, price: 1600 }], images: ["https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=800&auto=format&fit=crop"], description: "Classic crimson cocoa sponge with cream cheese frosting.", rating: 4.8 },
    { id: "pastry-001", name: "Butter Croissant", category: "Pastries", unit: "pc", price_per_pc: 120, images: ["https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop"], description: "Flaky, golden layers made with premium French butter.", rating: 4.6 },
    { id: "muffin-001", name: "Blueberry Streusel", category: "Muffins", unit: "pc", price_per_pc: 90, images: ["https://images.unsplash.com/photo-1607958996333-41aef7caefaa?q=80&w=800&auto=format&fit=crop"], description: "Bursting with fresh berries and topped with cinnamon crumb.", rating: 4.4 },
    { id: "cookie-002", name: "Oatmeal Cranberry", category: "Cookies", unit: "gm", price_per_100g: 110, images: ["https://images.unsplash.com/photo-1618923866180-f6f06328dcb3?q=80&w=800&auto=format&fit=crop"], description: "Chewy oats with tart cranberries.", rating: 4.3 },
  ];

  // Filter Logic
  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category))], [products]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      let price = 0;
      if (p.unit === 'gm') price = p.price_per_100g;
      else if (p.unit === 'pc') price = p.price_per_pc;
      else if (p.unit === 'variant') price = p.unit_options?.[0]?.price;
      const matchesPrice = price <= priceRange;
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, query, selectedCategory, priceRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Cart Logic
function addToCart(product, opts = {}) {
  openCart();           // open global drawer
  setQuickViewProduct(null);
  addProduct(product, opts);
}

  const ratingCss = `
    .rating { display: inline-block; position: relative; font-size: 1rem; line-height: 1; color: #d6d3d1; }
    .rating::before { content: attr(data-stars); position: absolute; left: 0; top: 0; width: var(--rating-width, 0%); overflow: hidden; color: #b45309; white-space: nowrap; }
    .rating span { visibility: hidden; }
  `;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      <style>{ratingCss}</style>


      {/* --- Sticky Control Bar (Mobile Optimized) --- */}
      <nav className="sticky top-20 z-30 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          
          {/* Filter Trigger (Mobile) & Brand */}
          <div className="flex items-center gap-2">
            <button 
              className="p-2.5 bg-white border border-stone-200 rounded-full text-stone-600 hover:text-orange-600 hover:border-orange-300 active:scale-95 transition-all shadow-sm" 
              onClick={() => setShowFiltersMobile(true)}
              aria-label="Open Filters"
            >
              <IconFilter />
            </button>
            {/* Hide Brand on small mobile if search is active, or keep it small */}
         
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconSearch />
              </div>
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search cravings..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 focus:border-orange-300 focus:ring-4 focus:ring-orange-50 rounded-full text-sm transition-all shadow-sm" 
              />
            </div>
          </div>

          {/* Cart Trigger */}
         <button onClick={openCart} className="relative group p-2.5 bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-200 rounded-full transition-all shadow-sm active:scale-95">
  <IconCart count={itemCount} />
</button>

        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 grid md:grid-cols-[240px_1fr] gap-8 items-start">
        
        {/* --- Desktop Sidebar (Hidden on Mobile) --- */}
        <aside className="hidden md:block sticky top-24 space-y-8">
          {/* <FilterPanel 
            categories={categories} 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
            priceRange={priceRange} 
            setPriceRange={setPriceRange} 
            setPage={setPage}
          /> */}
        </aside>

        {/* --- Product Grid --- */}
        <section>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">Menu</h2>
              <p className="text-stone-500 text-sm mt-1">
                Showing {filtered.length} result{filtered.length !== 1 && 's'}
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
              </p>
            </div>
            {err && <span className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-100 font-medium">{err}</span>}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <div className="text-stone-400 text-sm animate-pulse">Baking fresh data...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-stone-100 shadow-sm px-4">
              <div className="text-4xl mb-3">🥯</div>
              <p className="text-stone-500 font-medium">No products match your search.</p>
              <button onClick={() => { setSelectedCategory("All"); setPriceRange(2000); setQuery(""); }} className="mt-4 px-6 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-bold transition-colors">Clear All Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {pageItems.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onQuickView={() => setQuickViewProduct(p)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2 flex-wrap">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => { setPage(i + 1); window.scrollTo({top:0, behavior:'smooth'}) }} className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all shadow-sm ${page === i + 1 ? 'bg-stone-800 text-white scale-110' : 'bg-white border border-stone-200 hover:bg-orange-50 text-stone-600'}`}>{i + 1}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* --- Modals & Drawers --- */}
      
      {/* Mobile Filter Drawer (Slide Over) */}
      <MobileFilterDrawer 
        isOpen={showFiltersMobile} 
        onClose={() => setShowFiltersMobile(false)}
      >
         <FilterPanel 
            categories={categories} 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
            priceRange={priceRange} 
            setPriceRange={setPriceRange} 
            setPage={setPage}
          />
      </MobileFilterDrawer>

      <CartSidebar
  isOpen={isCartOpen}
  onClose={() => setIsCartOpen(false)}
  products={products}
/>


      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAdd={addToCart} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS (Refactored) */
/* -------------------------------------------------------------------------- */

// Reusable Filter Content
function FilterPanel({ categories, selectedCategory, setSelectedCategory, priceRange, setPriceRange, setPage, isMobile }) {
    return (
        <div className={`${isMobile ? 'pb-20' : ''}`}>
          <div className="mb-8">
            <h3 className="font-serif font-bold text-xl mb-4 text-stone-900 flex items-center gap-2">
                Categories
                {selectedCategory !== "All" && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-sans">1 Active</span>}
            </h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-stone-100 transition-colors">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCategory === cat ? 'border-orange-600' : 'border-stone-300 group-hover:border-orange-400'}`}>
                    {selectedCategory === cat && <div className="w-2.5 h-2.5 bg-orange-600 rounded-full" />}
                  </div>
                  <input type="radio" name="category" className="hidden" checked={selectedCategory === cat} onChange={() => { setSelectedCategory(cat); setPage(1); }} />
                  <span className={`text-sm font-medium ${selectedCategory === cat ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-700'}`}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between mb-3 items-end">
              <h3 className="font-serif font-bold text-lg text-stone-900">Max Price</h3>
              <span className="text-sm font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded">₹{priceRange}</span>
            </div>
            <input type="range" min="0" max="2000" step="50" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600" />
            <div className="flex justify-between text-xs text-stone-400 mt-2 font-medium"><span>₹0</span><span>₹2000+</span></div>
          </div>

          <div className="p-5 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 shadow-sm">
            <h4 className="font-bold text-orange-900 text-sm mb-2 flex items-center gap-2">
                <span>⚡</span> Fresh Promise
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">All items baked fresh this morning. Order before 2 PM for same-day delivery in your area.</p>
          </div>
        </div>
    )
}

function MobileFilterDrawer({ isOpen, onClose, children }) {
    return (
        <div className={`fixed inset-0 z-50  ${isOpen ? "" : "pointer-events-none"}`}>
            {/* Backdrop */}
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
            {/* Drawer */}
            <div className={`absolute left-0 top-20 bottom-0 w-[85%] max-w-xs bg-white shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
                <div className="p-5 border-b flex justify-between items-center bg-stone-50">
                    <h2 className="font-serif text-xl font-bold text-stone-800">Filters</h2>
                    <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm border border-stone-100 active:scale-90 transition-transform"><IconClose /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
                <div className="p-4 border-t bg-stone-50">
                    <button onClick={onClose} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Show Results</button>
                </div>
            </div>
        </div>
    )
}

function ProductCard({ product, onAdd, onQuickView }) {
  const nav = useNavigate();
  const displayPrice = useMemo(() => {
    if (product.unit === "gm") return `₹${product.price_per_100g}/100g`;
    if (product.unit === "pc") return `₹${product.price_per_pc}`;
    if (product.unit === "variant") return `From ₹${product.unit_options?.[0]?.price}`;
    return "";
  }, [product]);

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        
        {/* Quick View Trigger (Mobile safe) */}
        <button 
            onClick={(e) => { e.stopPropagation(); onQuickView(); }} 
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-stone-800 px-3 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-orange-600 hover:text-white transition-colors flex items-center gap-1.5 z-10"
        >
          <IconEye /> <span className="hidden sm:inline">Quick View</span>
        </button>

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm text-stone-600">
          {product.unit === 'gm' ? 'By Weight' : product.unit}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="font-serif font-bold text-stone-800 leading-tight text-lg">{product.name}</h3>
          <div className="font-bold text-orange-700 text-sm whitespace-nowrap bg-orange-50 px-2 py-1 rounded">{displayPrice}</div>
        </div>
        <div className="mb-3 text-xs text-stone-400 font-medium uppercase tracking-wide">{product.category}</div>
        <div className="mb-6"><StarRatingDisplay productId={product.id} size="md" showValue /></div>

        <div className="mt-auto pt-4 border-t border-stone-50 flex gap-3">
          <button onClick={() => nav(`/product/${product.id}`)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors text-stone-600 active:scale-95">
            Details
          </button>
          <button
            onClick={() => {
              if (product.unit === 'gm') onAdd(product, { grams: 100, qty: 1 });
              else if (product.unit === 'variant') onAdd(product, { option: product.unit_options[0], qty: 1 });
              else onAdd(product, { qty: 1 });
            }}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-md shadow-stone-200 active:scale-95"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

function QuickViewModal({ product, onClose, onAdd }) {
  const [activeImg, setActiveImg] = useState(product.images?.[0]);
  const [qty, setQty] = useState(1);
  const [grams, setGrams] = useState(100);
  const [selectedVariant, setSelectedVariant] = useState(product.unit_options?.[0]);

  const pricing = useMemo(() => {
    let unitPrice = 0;
    let calculationText = "";
    if (product.unit === "gm") {
      unitPrice = Math.round((grams / 100) * product.price_per_100g);
      calculationText = `${grams}g × ₹${product.price_per_100g}/100g`;
    } else if (product.unit === "pc") {
      unitPrice = product.price_per_pc;
      calculationText = `Price per item`;
    } else if (product.unit === "variant") {
      unitPrice = selectedVariant?.price || 0;
      calculationText = `Size: ${selectedVariant?.label}`;
    }
    return { unitPrice, calculationText, finalPrice: unitPrice * qty };
  }, [product, grams, selectedVariant, qty]);

  const handleAddClick = () => {
    if (product.unit === "gm") onAdd(product, { grams, qty });
    else if (product.unit === "variant") onAdd(product, { option: selectedVariant, qty });
    else onAdd(product, { qty });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-4xl sm:max-h-[90vh] max-h-[95vh] overflow-hidden flex flex-col md:flex-row relative animate-fade-in" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white shadow-md transition-all text-stone-600 hover:text-red-500"><IconClose /></button>

        {/* Left: Gallery (Scrollable on Mobile) */}
        <div className="w-full md:w-1/2 bg-stone-100 flex flex-col">
            <div className="relative h-64 md:h-full w-full bg-white">
                <img src={activeImg} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {/* Thumbnails - Horizontal scroll on mobile */}
            {product.images?.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto md:grid md:grid-cols-4 shrink-0 bg-stone-100">
                    {product.images.map((img, i) => (
                        <button key={i} onClick={() => setActiveImg(img)} className={`w-16 h-16 md:w-full md:h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${activeImg === img ? 'border-orange-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                            <img src={img} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Right: Details (Scrollable) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto max-h-[60vh] md:max-h-none flex flex-col">
          <div className="mb-1 text-orange-600 font-bold text-xs tracking-wider uppercase">{product.category}</div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-2 leading-tight">{product.name}</h2>
          <p className="text-stone-600 leading-relaxed mb-6 text-sm md:text-base">{product.description}</p>
          <div className="mb-6"><StarRatingDisplay productId={product.id} size="md" showValue /></div>

          {/* --- Controls --- */}
          <div className="space-y-6 mt-auto">
            {product.unit === "gm" && (
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Select Weight</label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl w-full sm:w-fit p-1">
                  <button onClick={() => setGrams(g => Math.max(50, g - 50))} className="w-12 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors font-bold text-lg text-stone-500">-</button>
                  <div className="flex-1 sm:w-24 text-center font-bold text-stone-900">{grams}g</div>
                  <button onClick={() => setGrams(g => g + 50)} className="w-12 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors font-bold text-lg text-stone-500">+</button>
                </div>
              </div>
            )}

            {product.unit === "variant" && (
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Size Options</label>
                <div className="flex flex-wrap gap-2">
                  {product.unit_options.map((opt) => (
                    <button key={opt.label} onClick={() => setSelectedVariant(opt)} className={`px-4 py-2 rounded-lg text-sm border-2 font-medium transition-all ${selectedVariant?.label === opt.label ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-100 hover:border-orange-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                <span className="text-stone-600 text-sm font-medium">{pricing.calculationText}</span>
                <div className="text-right">
                    <span className="text-xs text-stone-400 block">Total Price</span>
                    <span className="text-2xl font-serif font-bold text-orange-700">₹{pricing.finalPrice}</span>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
              <div className="flex items-center bg-white border border-stone-300 rounded-xl h-12 sm:h-14 w-32 p-1">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="h-full w-10 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-lg font-bold">-</button>
                <span className="flex-1 text-center font-bold text-lg">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="h-full w-10 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-lg font-bold">+</button>
              </div>
              <button onClick={handleAddClick} className="flex-1 h-12 sm:h-14 bg-stone-900 hover:bg-stone-800 text-white text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSidebar({ isOpen, onClose, products }) {
  const { items, grandTotal, itemCount, updateItemQuantity, removeItem } = useCart();

  function getProductMeta(it) {
    const p = products.find((x) => x.id === it.product_id);
    const name = p?.name || it.product_id;
    let label = "";
    if (it.unit === "gm") label = `${it.grams || ""}g pack`;
    else if (it.unit === "variant") label = it.variant_label || "Variant";
    else if (it.unit === "pc") label = "Single Item";

    let emoji = "🥐";
    if (p?.category === "Cookies") emoji = "🍪";
    else if (p?.category === "Cakes") emoji = "🍰";

    return { name, label, emoji };
  }

  return (
    <div className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-[90%] sm:max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 border-b flex justify-between items-center bg-stone-50">
          <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-2">
            Your Cart{" "}
            <span className="bg-orange-600 text-white text-xs py-0.5 px-2 rounded-full font-sans">
              {itemCount}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <IconClose />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 opacity-60">
              <IconCart count={0} />
              <p>Your basket is empty.</p>
              <button
                onClick={onClose}
                className="text-orange-600 font-bold text-sm hover:underline"
              >
                Start Shopping
              </button>
            </div>
          )}

          {items.map((it) => {
            const { name, label, emoji } = getProductMeta(it);
            const itemTotal = Number(it.line_total || 0);

            return (
              <div
                key={it.id}
                className="flex gap-4 group border border-stone-100 p-3 rounded-xl shadow-sm bg-white"
              >
                <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center text-2xl shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="truncate">
                      <div className="font-bold text-stone-800 truncate">{name}</div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {label}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-stone-900">
                        ₹{itemTotal}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center bg-stone-50 border rounded-lg h-8">
                      <button
                        onClick={() =>
                          updateItemQuantity(it.id, (it.quantity || 1) - 1)
                        }
                        className="w-8 h-full text-stone-500 hover:bg-stone-200 rounded-l-lg font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold">
                        {it.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateItemQuantity(it.id, (it.quantity || 1) + 1)
                        }
                        className="w-8 h-full text-stone-500 hover:bg-stone-200 rounded-r-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium p-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t bg-stone-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between text-lg font-bold mb-4 text-stone-900">
            <span>Subtotal</span>
            <span>₹{grandTotal}</span>
          </div>
          <button
            className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={items.length === 0}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
