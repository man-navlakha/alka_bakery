// src/components/cart/CartTotalsCard.jsx
import React from "react";
import { useCart } from "../../Context/CartContext";

export default function CartTotalsCard({ showCheckoutButton = true }) {
  const {
    subtotal,
    grandTotal,
    discountTotal,
    couponCode,
    couponDiscount,
    autoCouponCode,
    autoDiscount,
    freeGiftApplied,
    items,
  } = useCart();

  const hasCoupon = couponCode && couponDiscount > 0;
  const hasAuto = autoCouponCode && autoDiscount > 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-stone-500">Items subtotal</span>
        <span className="font-semibold text-stone-900">₹{subtotal.toFixed(0)}</span>
      </div>

      {discountTotal > 0 && (
        <div className="space-y-1 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
          {hasCoupon && (
            <div className="flex justify-between text-xs">
              <span className="text-emerald-700">
                Coupon <span className="font-mono">{couponCode}</span>
              </span>
              <span className="font-semibold text-emerald-700">-₹{couponDiscount.toFixed(0)}</span>
            </div>
          )}
          {hasAuto && (
            <div className="flex justify-between text-xs">
              <span className="text-emerald-700">
                Offer <span className="font-mono">{autoCouponCode}</span>
              </span>
              <span className="font-semibold text-emerald-700">-₹{autoDiscount.toFixed(0)}</span>
            </div>
          )}
          {freeGiftApplied && (
            <div className="flex justify-between text-xs">
              <span className="text-emerald-700">Free gift</span>
              <span className="font-semibold text-emerald-700">₹0</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between text-base font-bold pt-2 border-t border-stone-200">
        <span className="text-stone-900">Total</span>
        <span className="text-stone-900">₹{grandTotal.toFixed(0)}</span>
      </div>

      {showCheckoutButton && (
        <button
          disabled={items.length === 0}
          className="w-full mt-2 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Checkout
        </button>
      )}
    </div>
  );
}
