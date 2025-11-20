import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../Context/CartContext";
import { useCartDrawer } from "../../Context/CartDrawerContext";

export default function CartButton({ className = "" }) {
  const { itemCount } = useCart();
  const { openCart } = useCartDrawer();

  return (
    <button
      type="button"
      onClick={openCart}
      className={`relative text-stone-600 hover:text-orange-700 transition-colors ${className}`}
    >
      <ShoppingBag size={22} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}
