// src/components/cart/CartSidebarGlobal.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../../Context/CartContext";
import { useCartDrawer } from "../../Context/CartDrawerContext";
import { X, Loader2, Gift } from "lucide-react";
import CartTotalsCard from "./CartTotalsCard";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

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

// FIX: Define default prop outside component to maintain stable reference and prevent infinite loops
const DEFAULT_PRODUCTS = [];

export default function CartSidebarGlobal({ products: propProducts = DEFAULT_PRODUCTS }) {
  const { isOpen, closeCart } = useCartDrawer();
  const {
    items,      // Paid items
    giftItems,  // Free items
    itemCount,
    updateItemQuantity,
    removeItem,
    loading: cartLoading,
  } = useCart();

 const [products, setProducts] = useState(propProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  // 1. Fetch product details if not provided via props
  useEffect(() => {
    // If props are explicitly provided (and not empty default), use them
    if (propProducts !== DEFAULT_PRODUCTS && propProducts.length > 0) {
      setProducts(propProducts);
      return;
    }

    // FIX: Only fetch when the cart is actually OPEN to save bandwidth
    if (!isOpen) return;

    setLoadingProducts(true);
    const controller = new AbortController();

    fetch(`${API_BASE}/api/products`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error("Failed to load product info for cart:", err);
        }
      })
      .finally(() => setLoadingProducts(false));

    return () => controller.abort();
  }, [propProducts, isOpen]);

  // 2. Merge items for display
  const allCartItems = [...items, ...giftItems];

  function getProductMeta(it) {
    const p = products.find((x) => x.id === it.product_id);
    const name = p?.name || it.product_id;
    let label = "";
    if (it.unit === "gm") label = `${it.grams || ""}g pack`;
    else if (it.unit === "variant") label = it.variant_label || "Variant";
    else if (it.unit === "pc") label = "Single Item";

    let image = null;
    if (p) {
        if (p.product_images?.length > 0) image = p.product_images[0].url;
        else if (p.images?.length > 0) {
            image = typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url;
        }
        else if (p.image) image = p.image;
    }

    let emoji = "🥐";
    if (p?.category === "Cookies") emoji = "🍪";
    else if (p?.category === "Cakes") emoji = "🍰";

    return { name, label, image, emoji };
  }

  const isLoading = cartLoading || (loadingProducts && products.length === 0);

  return (
    <div className={`fixed inset-0 mt-20 z-[60] ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={closeCart}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-[90%] sm:max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-3 rounded-full shadow-xl border border-stone-100">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-stone-50">
          <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-2">
            Your Cart <span className="bg-orange-600 text-white text-xs py-0.5 px-2 rounded-full font-sans">{itemCount}</span>
          </h2>
          <button onClick={closeCart} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isLoading && allCartItems.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 opacity-60">
              <IconCart count={0} />
              <p>Your basket is empty.</p>
              <button onClick={closeCart} className="text-orange-600 font-bold text-sm hover:underline">
                Start Shopping
              </button>
            </div>
          )}

          {allCartItems.map((it) => {
            const { name, label, image, emoji } = getProductMeta(it);
            const itemTotal = Number(it.line_total || 0);
            const isGift = it.is_gift;

            return (
              <div
                key={it.id}
                className={`flex gap-4 group border p-3 rounded-xl shadow-sm bg-white transition-colors ${
                  isGift ? "border-orange-200 bg-orange-50/40" : "border-stone-100"
                }`}
              >
                {/* IMAGE / ICON AREA */}
                <div className="relative w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-stone-100">
                  {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{emoji}</span>
                  )}
                  
                  {isGift && (
                    <div className="absolute top-0 left-0 w-full h-full bg-black/10 flex items-center justify-center">
                        <div className="bg-white p-1 rounded-full shadow-sm">
                            <Gift className="w-3 h-3 text-orange-600" />
                        </div>
                    </div>
                  )}
                </div>

                {/* DETAILS AREA */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="truncate">
                      <div className="font-bold text-stone-800 truncate flex items-center gap-2">
                        {name}
                        {isGift && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded uppercase tracking-wide">Gift</span>}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      {isGift ? (
                        <div className="font-bold text-green-600 uppercase text-sm tracking-wider">FREE</div>
                      ) : (
                        <div className="font-bold text-stone-900">₹{itemTotal}</div>
                      )}
                    </div>
                  </div>

                  {/* CONTROLS */}
                  <div className="mt-3 flex justify-between items-center">
                    {isGift ? (
                      <div className="text-xs text-stone-500 italic bg-white/50 px-2 py-1 rounded border border-stone-100">
                        Qty: {it.quantity} (Auto-added)
                      </div>
                    ) : (
                      <div className="flex items-center bg-stone-50 border rounded-lg h-8">
                        <button onClick={() => updateItemQuantity(it.id, (it.quantity || 1) - 1)} className="w-8 h-full text-stone-500 hover:bg-stone-200 rounded-l-lg font-bold">-</button>
                        <span className="w-8 text-center text-xs font-bold">{it.quantity}</span>
                        <button onClick={() => updateItemQuantity(it.id, (it.quantity || 1) + 1)} className="w-8 h-full text-stone-500 hover:bg-stone-200 rounded-r-lg font-bold">+</button>
                      </div>
                    )}

                    {!isGift && (
                      <button onClick={() => removeItem(it.id)} className="text-xs text-red-400 hover:text-red-600 font-medium p-1">Remove</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Totals */}
        {allCartItems.length >= 1 && (
          <div className="p-6 border-t bg-stone-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <CartTotalsCard products={products} />
          </div>
        )}

      </div>
    </div>
  );
}