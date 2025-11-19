import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom"; // Assuming React Router is used
import Reviews, { StarRatingDisplay } from "../../Reviews";
import Navbar from "../Navbar";

// --- Icons (Reused for consistency) ---
const IconCart = ({ count }) => (
  <div className="relative">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
    {count > 0 && <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-stone-50 shadow-sm">{count}</span>}
  </div>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
);
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
);

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

// --- Sample Data (Fallback for Demo) ---
const sampleProducts = [
  { id: "cookie-001", name: "Belgian Chocolate Chunk", category: "Cookies", unit: "gm", price_per_100g: 140, images: ["https://images.unsplash.com/photo-1499636138143-bd630f5cf38a?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1618923866180-f6f06328dcb3?q=80&w=800&auto=format&fit=crop"], description: "Rich, buttery dough filled with chunks of pure Belgian dark chocolate.", rating: 4.9 },
  { id: "bread-001", name: "Artisan Sourdough Loaf", category: "Breads", unit: "pc", price_per_pc: 250, images: ["https://images.unsplash.com/photo-1585476215504-5b33be5d90d9?q=80&w=800&auto=format&fit=crop"], description: "Fermented for 48 hours with a crisp crust and airy crumb.", rating: 4.7 },
  { id: "cake-001", name: "Royal Red Velvet", category: "Cakes", unit: "variant", unit_options: [{ label: "500g", grams: 500, price: 850 }, { label: "1kg", grams: 1000, price: 1600 }], images: ["https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=800&auto=format&fit=crop"], description: "Classic crimson cocoa sponge with cream cheese frosting.", rating: 4.8 },
  { id: "pastry-001", name: "Butter Croissant", category: "Pastries", unit: "pc", price_per_pc: 120, images: ["https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop"], description: "Flaky, golden layers made with premium French butter.", rating: 4.6 },
];

export default function ProductPage({ addToCartGlobal }) {
  const { id } = useParams(); // Get ID from URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [activeImg, setActiveImg] = useState("");
  const [qty, setQty] = useState(1);
  const [grams, setGrams] = useState(100);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isAdded, setIsAdded] = useState(false); // Visual feedback

  // 1. Fetch Logic (Identical to ShopPage but for single item)
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        
        // Normalize (Same logic as ShopPage)
        const p = {
            id: data.id,
            name: data.name,
            category: data.category || "Uncategorized",
            unit: data.unit,
            price_per_100g: data.price_per_100g ?? null,
            price_per_pc: data.price_per_pc ?? null,
            unit_options: (data.product_unit_options || []).map(o => ({ label: o.label, grams: o.grams, price: o.price })),
            images: (data.product_images || []).map(i => i.url),
            description: data.description,
            rating: data.rating ?? 0
        };
        setProduct(p);
        setActiveImg(p.images[0]);
        if(p.unit === 'variant') setSelectedVariant(p.unit_options[0]);
      } catch (err) {
        console.warn("Using fallback data");
        const fallback = sampleProducts.find(p => p.id === id) || sampleProducts[0];
        setProduct(fallback);
        setActiveImg(fallback.images[0]);
        if(fallback.unit === 'variant') setSelectedVariant(fallback.unit_options[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // 2. Pricing Logic (Exact copy from ShopPage for consistency)
  const pricing = useMemo(() => {
    if (!product) return { unitPrice: 0, finalPrice: 0, text: "" };
    
    let unitPrice = 0;
    let text = "";

    if (product.unit === "gm") {
      unitPrice = Math.round((grams / 100) * product.price_per_100g);
      text = `${grams}g selected`;
    } else if (product.unit === "pc") {
      unitPrice = product.price_per_pc;
      text = "Standard portion";
    } else if (product.unit === "variant") {
      unitPrice = selectedVariant?.price || 0;
      text = selectedVariant?.label;
    }

    return { 
      unitPrice, 
      finalPrice: unitPrice * qty, 
      text 
    };
  }, [product, grams, selectedVariant, qty]);

  // 3. Handler
  const handleAddToCart = () => {
    // Build object structure expected by ShopPage/Cart
    const cartOpts = { qty };
    if(product.unit === 'gm') cartOpts.grams = grams;
    if(product.unit === 'variant') cartOpts.option = selectedVariant;

    // Execute the prop function if it exists, otherwise log
    if(addToCartGlobal) {
      addToCartGlobal(product, cartOpts);
    } else {
      console.log("Added to cart:", product.name, cartOpts);
    }

    // Visual feedback
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-stone-400">Loading delicious details...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-stone-400">Product not found.</div>;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-20">
      {/* Navbar Placeholder (Or import your Header) */}
     <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        
        {/* --- Top Section: Grid --- */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          
          {/* Left: Gallery */}
          <div className="space-y-4 sticky top-24 h-fit">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              <img src={activeImg} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImg(img)}
                    className={`w-20 h-20 rounded-lg border-2 flex-shrink-0 overflow-hidden transition-all ${activeImg === img ? 'border-orange-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Actions */}
          <div className="flex flex-col h-full">
            <div className="mb-2 text-orange-600 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              {product.category}
              <span className="w-1 h-1 bg-orange-300 rounded-full"></span>
              <span className="text-stone-400 text-xs">{product.unit === 'gm' ? 'Sold by Weight' : 'Freshly Baked'}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
               <StarRatingDisplay productId={product.id} size="lg" showValue />
               <span className="text-stone-300">|</span>
               <span className="text-stone-500 text-sm">Baked fresh daily</span>
            </div>

            <p className="text-stone-600 text-lg leading-relaxed mb-8 border-b border-stone-200 pb-8">
              {product.description}
            </p>

            {/* CUSTOMIZATION CONTROLS */}
            <div className="space-y-8 mb-8">
              
              {/* Case 1: Weight (Grams) */}
              {product.unit === 'gm' && (
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <label className="font-bold text-stone-700">Select Weight</label>
                    <span className="text-orange-600 font-bold">₹{product.price_per_100g}/100g</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center bg-stone-100 rounded-lg p-1">
                        <button onClick={() => setGrams(g => Math.max(50, g - 50))} className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 hover:text-orange-600 font-bold text-xl transition-colors">-</button>
                        <div className="w-24 text-center font-bold text-xl text-stone-900">{grams}g</div>
                        <button onClick={() => setGrams(g => g + 50)} className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 hover:text-orange-600 font-bold text-xl transition-colors">+</button>
                     </div>
                  </div>
                </div>
              )}

              {/* Case 2: Variants (Cake sizes) */}
              {product.unit === 'variant' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-3">Choose Option</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {product.unit_options.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedVariant(opt)}
                        className={`py-3 px-4 rounded-xl border-2 text-left transition-all ${selectedVariant?.label === opt.label 
                          ? 'border-orange-500 bg-orange-50 text-orange-900' 
                          : 'border-stone-200 hover:border-stone-300 text-stone-600'}`}
                      >
                        <div className="font-bold text-sm">{opt.label}</div>
                        <div className="text-xs mt-1 opacity-80">₹{opt.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Case 3: Per Piece (Just info) */}
              {product.unit === 'pc' && (
                <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 px-4 py-2 rounded-lg text-sm font-medium border border-orange-100">
                  <span>Fixed Price per piece:</span>
                  <span className="font-bold">₹{product.price_per_pc}</span>
                </div>
              )}
            </div>

            {/* ADD TO CART BAR */}
            <div className="mt-auto bg-stone-900 text-white p-5 rounded-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                {/* Price Display */}
                <div className="flex-1 w-full">
                  <div className="text-stone-400 text-xs uppercase font-bold tracking-wider mb-1">Total Price</div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-serif font-bold text-white">₹{pricing.finalPrice}</span>
                    <span className="text-stone-400 text-sm mb-1">
                      ({pricing.text} x {qty})
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <div className="flex items-center bg-stone-800 rounded-xl h-12 border border-stone-700">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 h-full text-stone-400 hover:text-white hover:bg-stone-700 rounded-l-xl text-xl">-</button>
                      <span className="w-8 text-center font-bold">{qty}</span>
                      <button onClick={() => setQty(q => q + 1)} className="px-4 h-full text-stone-400 hover:text-white hover:bg-stone-700 rounded-r-xl text-xl">+</button>
                   </div>
                   
                   <button 
                    onClick={handleAddToCart}
                    className={`flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isAdded ? 'bg-green-600 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/50'}`}
                   >
                     {isAdded ? <><IconCheck /> Added</> : "Add to Cart"}
                   </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- Bottom Section: Reviews & Related --- */}
        <div className="grid md:grid-cols-[2fr_1fr] gap-12 border-t border-stone-200 pt-16">
          
          {/* Reviews Section */}
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6 text-stone-900">Customer Reviews</h2>
            <Reviews productId={product.id} />
          </div>

          {/* Related Products Sidebar */}
          <div>
            <h3 className="text-lg font-serif font-bold mb-6 text-stone-900">You might also like</h3>
            <div className="space-y-4">
              {sampleProducts
                .filter(p => p.category === product.category && p.id !== product.id)
                .slice(0, 3)
                .map(related => (
                  <Link to={`/product/${related.id}`} key={related.id} className="group flex gap-4 bg-white p-3 rounded-xl border border-stone-100 hover:shadow-md transition-all">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100">
                      <img src={related.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-bold text-stone-800 group-hover:text-orange-700 transition-colors line-clamp-1">{related.name}</h4>
                      <div className="text-xs text-stone-500 mb-2">{related.category}</div>
                      <div className="font-bold text-orange-800 text-sm">
                         {related.unit === 'gm' ? `₹${related.price_per_100g}/100g` : 
                          related.unit === 'pc' ? `₹${related.price_per_pc}` : 
                          `From ₹${related.unit_options[0].price}`}
                      </div>
                    </div>
                  </Link>
              ))}
              {sampleProducts.filter(p => p.category === product.category && p.id !== product.id).length === 0 && (
                <div className="text-sm text-stone-400 italic">No similar items found.</div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}