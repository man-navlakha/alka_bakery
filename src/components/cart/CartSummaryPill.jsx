// src/components/cart/CartSummaryPill.jsx
import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../Context/CartContext";

export default function CartSummaryPill({ onClick }) {
  const {
    itemCount,
    grandTotal,
    couponCode,
    couponDiscount,
    autoCouponCode,
    autoDiscount,
    freeGiftApplied,
  } = useCart();

  const hasDiscount = (couponDiscount || 0) > 0 || (autoDiscount || 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 text-white hover:bg-orange-700 transition-colors shadow-md text-xs font-medium"
      aria-label="Open cart"
    >
      <div className="relative">
        <ShoppingBag size={18} className="shrink-0" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-[10px] leading-none px-1.5 py-0.5 rounded-full font-bold">
            {itemCount}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start leading-tight">
        <span className="uppercase tracking-wide text-[10px] opacity-80">
          Cart
        </span>
        <span className="text-xs font-semibold">
          ₹{grandTotal.toFixed(0)}
          {hasDiscount && <span className="ml-1 text-[10px] text-emerald-200">saved</span>}
        </span>
      </div>

      {freeGiftApplied && (
        <span className="hidden sm:inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold">
          🎁 Gift
        </span>
      )}
    </button>
  );
}
