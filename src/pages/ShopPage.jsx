import React, { useEffect, useMemo, useState } from "react";
import Reviews, { ReviewList, ReviewSummary, StarRatingDisplay } from "../components/Reviews";

/**
 * ------------------------------------------------------------------
 * BACKEY - Professional Bakery Shop (v3)
 * Features:
 * - Sidebar Filters
 * - Quick View with Transparent Pricing Calculation
 * - Simplified Grams Logic (No +50g arrays, just total weight)
 * - SQL Schema Compatible
 * ------------------------------------------------------------------
 */

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

// --- Icons ---
const IconCart = ({ count }) => (
  <div className="relative">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-stone-50 shadow-sm">
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
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

export default function ShopWithApi() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // UI State
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
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
          unit: p.unit, // 'gm' | 'pc' | 'variant'
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
      // Price Check (approximate for variants/grams)
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

  // ---------- Simplified Cart Logic ----------
  function addToCart(product, opts = {}) {
    // opts can be { qty, grams, option }
    const qty = opts.qty || 1;
    setIsCartOpen(true); 
    setQuickViewProduct(null); // Close modal

    let key = "";
    let newItem = {};

    if (product.unit === "gm") {
      // Use exact grams passed, or default to 100
      const grams = opts.grams || 100; 
      key = `${product.id}-gm-${grams}`;
      newItem = {
        key, id: product.id, name: product.name, unit: "gm", 
        qty, grams, 
        // Store base price for recalculations if needed, but we use product data mostly
        pricePer100g: product.price_per_100g 
      };
    } 
    else if (product.unit === "pc") {
      key = `${product.id}-pc`;
      newItem = { 
        key, id: product.id, name: product.name, unit: "pc", qty 
      };
    } 
    else if (product.unit === "variant") {
      const option = opts.option || product.unit_options?.[0];
      key = `${product.id}-var-${option?.label}`;
      newItem = { 
        key, id: product.id, name: product.name, unit: "variant", qty, option 
      };
    }

    setCart((c) => {
      const existing = c.find((it) => it.key === key);
      if (existing) return c.map((it) => it.key === key ? { ...it, qty: it.qty + qty } : it);
      return [...c, newItem];
    });
  }

  // Calculate Price for Cart Item
  function computeCartItemPrice(it) {
    const p = products.find((x) => x.id === it.id) || sampleProducts.find((x) => x.id === it.id);
    if (!p) return { perUnit: 0, total: 0 }; // Safety
    
    let perUnit = 0;
    if (it.unit === "gm") {
      // Formula: (TotalGrams / 100) * PricePer100g
      perUnit = Math.round((it.grams / 100) * (p.price_per_100g || 0));
    } else if (it.unit === "pc") {
      perUnit = p.price_per_pc || 0;
    } else if (it.unit === "variant") {
      perUnit = it.option?.price || 0;
    }
    
    return { perUnit, total: perUnit * it.qty };
  }

  const cartTotal = cart.reduce((s, it) => s + computeCartItemPrice(it).total, 0);

  // CSS
  const ratingCss = `
    .rating { display: inline-block; position: relative; font-size: 1rem; line-height: 1; color: #d6d3d1; }
    .rating::before { content: attr(data-stars); position: absolute; left: 0; top: 0; width: var(--rating-width, 0%); overflow: hidden; color: #b45309; white-space: nowrap; }
    .rating span { visibility: hidden; }
  `;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      <style>{ratingCss}</style>

      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center text-white font-serif font-bold text-xl">B</div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight hidden sm:block">Backey</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="md:hidden p-2 text-stone-500" onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
              <IconFilter />
            </button>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconSearch /></div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2 bg-stone-100 focus:bg-white border-transparent focus:border-orange-300 focus:ring-2 focus:ring-orange-100 rounded-full text-sm transition-all w-32 md:w-64" />
            </div>
            
            <button onClick={() => setIsCartOpen(true)} className="relative group p-2 hover:bg-stone-100 rounded-full transition-colors">
              <IconCart count={cart.length} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-[240px_1fr] gap-8 items-start">
        
        {/* Sidebar */}
        <aside className={`space-y-8 ${showFiltersMobile ? 'block' : 'hidden'} md:block`}>
          <div>
            <h3 className="font-serif font-bold text-lg mb-4 text-stone-900">Categories</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'border-orange-600' : 'border-stone-300 group-hover:border-orange-400'}`}>
                    {selectedCategory === cat && <div className="w-2 h-2 bg-orange-600 rounded-full" />}
                  </div>
                  <input type="radio" name="category" className="hidden" checked={selectedCategory === cat} onChange={() => { setSelectedCategory(cat); setPage(1); }} />
                  <span className={`text-sm ${selectedCategory === cat ? 'text-stone-900 font-medium' : 'text-stone-500 group-hover:text-stone-700'}`}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <h3 className="font-serif font-bold text-lg text-stone-900">Max Price</h3>
              <span className="text-sm font-medium text-orange-700">₹{priceRange}</span>
            </div>
            <input type="range" min="0" max="2000" step="50" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600" />
            <div className="flex justify-between text-xs text-stone-400 mt-1"><span>₹0</span><span>₹2000+</span></div>
          </div>

          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <h4 className="font-bold text-orange-800 text-sm mb-1">Fresh Daily</h4>
            <p className="text-xs text-orange-700 leading-relaxed">All items baked fresh this morning. Order before 2 PM for same-day delivery.</p>
          </div>
        </aside>

        {/* Product Grid */}
        <section>
          <div className="mb-6 flex items-end justify-between">
             <div>
               <h2 className="text-3xl font-serif font-bold text-stone-900">Menu</h2>
               <p className="text-stone-500 text-sm mt-1">Showing {filtered.length} artisan items</p>
             </div>
             {err && <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100">{err}</span>}
          </div>

          {loading ? (
            <div className="text-center py-20 text-stone-400">Loading menu...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-stone-100">
              <p className="text-stone-400">No products found.</p>
              <button onClick={() => {setSelectedCategory("All"); setPriceRange(2000); setQuery("");}} className="mt-4 text-orange-600 underline">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageItems.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onQuickView={() => setQuickViewProduct(p)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
                  {Array.from({length: totalPages}).map((_, i) => (
                    <button key={i} onClick={() => setPage(i+1)} className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-all ${page === i+1 ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 hover:bg-stone-100'}`}>{i+1}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Modals */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} total={cartTotal} setCart={setCart} computePrice={computeCartItemPrice} />
      
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAdd={addToCart} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS */
/* -------------------------------------------------------------------------- */

// 1. Simplified Product Card (Removed inline grams logic)
function ProductCard({ product, onAdd, onQuickView }) {
  // Logic to show "From price" or "Price"
  const displayPrice = useMemo(() => {
    if (product.unit === "gm") return `₹${product.price_per_100g}/100g`;
    if (product.unit === "pc") return `₹${product.price_per_pc}`;
    if (product.unit === "variant") return `From ₹${product.unit_options?.[0]?.price}`;
    return "";
  }, [product]);

  return (
    <article className="group bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative">
      <div className="relative h-48 overflow-hidden bg-stone-100">
        <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        
        {/* Hover Quick View */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer" onClick={onQuickView}>
          <button className="bg-white text-stone-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-orange-600 hover:text-white transition-colors flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 duration-300">
            <IconEye /> Quick View
          </button>
        </div>
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm">
          {product.unit === 'gm' ? 'By Weight' : product.unit}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-serif font-bold text-stone-800 leading-tight">{product.name}</h3>
          <div className="font-bold text-orange-800 text-sm">{displayPrice}</div>
        </div>
        <div className="mb-2 text-xs text-stone-400">{product.category}</div>
        <StarRatingDisplay productId={product.id} size="lg" showValue />

        <div className="mt-auto pt-3 border-t border-stone-100 flex gap-2">
          <button onClick={onQuickView} className="flex-1 py-2 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors text-stone-600">
            Customize
          </button>
          <button 
            onClick={() => {
              // Simple Quick Add (Defaults: 100g / 1pc / 1st Variant)
              if(product.unit === 'gm') onAdd(product, { grams: 100, qty: 1 });
              else if(product.unit === 'variant') onAdd(product, { option: product.unit_options[0], qty: 1 });
              else onAdd(product, { qty: 1 });
            }} 
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

// 2. Quick View Modal with Price Transparency
function QuickViewModal({ product, onClose, onAdd }) {
  const [activeImg, setActiveImg] = useState(product.images?.[0]);
  const [qty, setQty] = useState(1);
  
  // Unit states
  const [grams, setGrams] = useState(100); // Simple integer state
  const [selectedVariant, setSelectedVariant] = useState(product.unit_options?.[0]);

  // --- Logic for Pricing and Breakdown ---
  const pricing = useMemo(() => {
    let unitPrice = 0;
    let calculationText = "";
    let finalPrice = 0;

    if (product.unit === "gm") {
      // (Grams / 100) * PricePer100g
      unitPrice = Math.round((grams / 100) * product.price_per_100g);
      calculationText = `${grams}g × (₹${product.price_per_100g}/100g) = ₹${unitPrice}`;
    } else if (product.unit === "pc") {
      unitPrice = product.price_per_pc;
      calculationText = `1 pc × ₹${product.price_per_pc}`;
    } else if (product.unit === "variant") {
      unitPrice = selectedVariant?.price || 0;
      calculationText = `${selectedVariant?.label} × ₹${unitPrice}`;
    }

    finalPrice = unitPrice * qty;
    return { unitPrice, calculationText, finalPrice };
  }, [product, grams, selectedVariant, qty]);

  const handleAddClick = () => {
    // Pass the specific configuration to the parent's addToCart
    if (product.unit === "gm") {
      onAdd(product, { grams: grams, qty: qty });
    } else if (product.unit === "variant") {
      onAdd(product, { option: selectedVariant, qty: qty });
    } else {
      onAdd(product, { qty: qty });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-fade-in" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white shadow-sm transition-all"><IconClose /></button>

        {/* Left: Gallery */}
        <div className="w-full md:w-1/2 bg-stone-100 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="w-full h-64 md:h-80 bg-white rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
            <img src={activeImg} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images?.length > 1 && (
             <div className="flex gap-2 overflow-x-auto pb-2">
               {product.images.map((img, i) => (
                 <button key={i} onClick={() => setActiveImg(img)} className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 ${activeImg === img ? 'border-orange-500' : 'border-transparent'}`}>
                   <img src={img} className="w-full h-full object-cover" />
                 </button>
               ))}
             </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto">
          <div className="mb-1 text-orange-600 font-bold text-xs tracking-wider uppercase">{product.category}</div>
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">{product.name}</h2>
          <p className="text-stone-600 leading-relaxed mb-6">{product.description}</p>
          <StarRatingDisplay productId={product.id} size="lg" showValue />

          {/* <ReviewList productId={product.id} /> */}
          {/* --- Customization Area --- */}
          <div className="space-y-6">
            
            {/* 1. Grams Stepper (Replaced +50g logic with simpler stepper) */}
            {product.unit === "gm" && (
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mt-3 mb-2">Select Weight (Grams)</label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl w-fit">
                   <button onClick={() => setGrams(g => Math.max(50, g - 50))} className="px-4 py-2 text-stone-500 hover:bg-stone-200 rounded-l-xl font-bold text-lg">-</button>
                   <div className="w-20 text-center font-bold text-stone-900">{grams}g</div>
                   <button onClick={() => setGrams(g => g + 50)} className="px-4 py-2 text-stone-500 hover:bg-stone-200 rounded-r-xl font-bold text-lg">+</button>
                </div>
              </div>
            )}

            {/* 2. Variant Selector */}
            {product.unit === "variant" && (
              <div>
                 <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Choose Size</label>
                 <div className="flex flex-wrap gap-2">
                    {product.unit_options.map((opt) => (
                      <button key={opt.label} onClick={() => setSelectedVariant(opt)} className={`px-4 py-2 rounded-lg text-sm border transition-all ${selectedVariant?.label === opt.label ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                 </div>
              </div>
            )}

            {/* 3. Price Breakdown Box (Transparency) */}
            <div className="bg-stone-100 rounded-lg p-4 border border-stone-200 text-sm">
              <div className="text-xs font-bold text-stone-500 uppercase mb-2">Price Breakdown</div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-stone-600">{pricing.calculationText}</span>
                <span className="font-medium">₹{pricing.unitPrice}</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-200 pt-2 mt-2">
                <span className="text-stone-800 font-bold">Total (x{qty} Qty)</span>
                <span className="text-orange-700 font-bold text-lg">₹{pricing.finalPrice}</span>
              </div>
            </div>

            {/* 4. Qty & Action */}
            <div className="flex gap-4 pt-2">
               <div className="flex items-center bg-white border border-stone-300 rounded-xl h-12 w-32">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="flex-1 h-full text-stone-500 text-xl hover:bg-stone-50 rounded-l-xl">-</button>
                  <span className="font-bold text-lg w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="flex-1 h-full text-stone-500 text-xl hover:bg-stone-50 rounded-r-xl">+</button>
               </div>
               <button onClick={handleAddClick} className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-200 transition-all">
                 Add to Cart
               </button>
            </div>
          <Reviews productId={product.id} />

          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Cart Sidebar
function CartSidebar({ isOpen, onClose, cart, total, setCart, computePrice }) {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}>
       <div className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
       <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-5 border-b flex justify-between items-center bg-stone-50">
            <h2 className="font-serif text-xl font-bold text-stone-800">Your Cart</h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full"><IconClose /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
             {cart.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                 <IconCart count={0} />
                 <p>Your basket is empty.</p>
               </div>
             )}
             
             {cart.map(it => {
               const { total: itemTotal, perUnit } = computePrice(it);
               return (
                 <div key={it.key} className="flex gap-4 group border-b border-stone-100 pb-4">
                    <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center text-2xl">
                      {it.unit === 'gm' ? '🍪' : it.unit === 'variant' ? '🍰' : '🥐'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-stone-800">{it.name}</div>
                          <div className="text-xs text-stone-500 mt-1">
                            {/* Clean Display of selection */}
                            {it.unit === 'gm' && <span>Weight: {it.grams}g</span>}
                            {it.unit === 'variant' && <span>Size: {it.option?.label}</span>}
                            {it.unit === 'pc' && <span>Single Item</span>}
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="font-bold text-stone-900">₹{itemTotal}</div>
                           <div className="text-[10px] text-stone-400">₹{perUnit} ea</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                         <div className="flex items-center bg-stone-50 border rounded h-7">
                            <button onClick={() => setCart(c => c.map(i => i.key===it.key ? {...i, qty: Math.max(1, i.qty-1)} : i))} className="px-2 text-stone-500 hover:bg-stone-200">-</button>
                            <span className="px-2 text-xs font-bold">{it.qty}</span>
                            <button onClick={() => setCart(c => c.map(i => i.key===it.key ? {...i, qty: i.qty+1} : i))} className="px-2 text-stone-500 hover:bg-stone-200">+</button>
                         </div>
                         <button onClick={() => setCart(c => c.filter(x => x.key !== it.key))} className="text-xs text-red-400 hover:text-red-600 hover:underline">Remove</button>
                      </div>
                    </div>
                 </div>
               )
             })}
          </div>

          <div className="p-6 border-t bg-stone-50">
             <div className="flex justify-between text-lg font-bold mb-4 text-stone-900">
               <span>Subtotal</span><span>₹{total}</span>
             </div>
             <button className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={cart.length === 0}>
               Checkout
             </button>
          </div>
       </div>
    </div>
  );
}