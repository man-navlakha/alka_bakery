import React, { useState } from "react";
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
        items,
        giftItems,
        applyCoupon,
        removeCoupon,
        loading,
    } = useCart();

    const [couponInput, setCouponInput] = useState(couponCode || "");

    // Helper to get product details safely
    function getProductMeta(item) {
        // 1. Try name from backend (new logic)
        if (item.product_name) return { name: item.product_name };
        // 2. Try nested product object (if cart structure varies)
        if (item.products?.name) return { name: item.products.name };
        // 3. Fallback to ID
        return { name: "Free Gift" };
    }

    return (
        <div className="space-y-4">
            {/* Coupon input */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">Coupon</label>

                {couponCode ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <div className="text-xs">
                            <div className="font-bold text-green-800">{couponCode}</div>
                            <div className="text-green-700">
                                -₹{couponDiscount.toFixed(0)} applied
                            </div>
                        </div>
                        <button
                            onClick={removeCoupon}
                            className="text-[11px] text-red-500 font-semibold hover:underline"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Enter coupon code"
                            className="flex-1 text-sm border border-stone-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                        />
                        <button
                            onClick={() => couponInput && applyCoupon(couponInput)}
                            disabled={!couponInput || loading}
                            className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                        >
                            Apply
                        </button>
                    </div>
                )}

                {autoCouponCode && (
                    <div className="text-[11px] text-green-700">
                        Auto offer <span className="font-semibold">{autoCouponCode}</span>{" "}
                        applied: -₹{autoDiscount.toFixed(0)}
                    </div>
                )}
            </div>

            {/* Free gift section */}
            {giftItems.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs text-orange-800">
                    <div className="font-bold mb-1">🎁 Free Gift</div>
                    {giftItems.map((g) => {
                        const { name } = getProductMeta(g);
                        return (
                            <div key={g.id} className="flex justify-between">
                                <span>{name}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Totals */}
            <div className="space-y-1 text-sm text-stone-700">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(0)}</span>
                </div>

                {discountTotal > 0 && (
                    <div className="flex justify-between text-green-700">
                        <span>Discounts</span>
                        <span>-₹{discountTotal.toFixed(0)}</span>
                    </div>
                )}

                <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Payable</span>
                    <span>₹{grandTotal.toFixed(0)}</span>
                </div>
            </div>

            {showCheckoutButton && (
                <button
                    className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={items.length === 0 || loading}
                >
                    Proceed to Checkout
                </button>
            )}
        </div>
    );
}