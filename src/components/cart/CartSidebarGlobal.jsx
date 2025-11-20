import React from "react";
import { useCart } from "../../Context/CartContext";
import { useCartDrawer } from "../../Context/CartDrawerContext";
import { X, Loader2 } from "lucide-react"; //
import CartTotalsCard from "./CartTotalsCard";

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

export default function CartSidebarGlobal({ products = [] }) {
  const { isOpen, closeCart } = useCartDrawer();
  // 1. Get the loading state from context
  const { items, grandTotal, itemCount, updateItemQuantity, removeItem, loading } = useCart();

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
    <div className={`fixed inset-0 mt-20 z-[60] ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-[90%] sm:max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 2. Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-3 rounded-full shadow-xl border border-stone-100">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          </div>
        )}

        <div className="p-5 border-b flex justify-between items-center bg-stone-50">
          <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-2">
            Your Cart{" "}
            <span className="bg-orange-600 text-white text-xs py-0.5 px-2 rounded-full font-sans">
              {itemCount}
            </span>
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 opacity-60">
              <IconCart count={0} />
              <p>Your basket is empty.</p>
              <button
                onClick={closeCart}
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
  <CartTotalsCard />
</div>
        {/* <div className="p-6 border-t bg-stone-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
        </div> */}
      </div>
    </div>
  );
}