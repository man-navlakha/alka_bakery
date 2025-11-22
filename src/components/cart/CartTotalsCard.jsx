import React, { useEffect, useState } from "react";
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
        availableCoupons, // from Context
        applyCoupon,
        removeCoupon,
        loading,
    } = useCart();

    const [inputMode, setInputMode] = useState("select"); // 'select' | 'custom'
    const [couponInput, setCouponInput] = useState("");

    // Function to get product details for gifts
    function getProductMeta(item) {
        // This helper is used for the Gift Item display, assuming item details are populated
        // For cart_items joined with products from backend, the structure might differ.
        // Assuming standard item structure here.
        return { name: `Gift Product (${item.product_id.substring(0, 5)}...)` }; 
    }

    const handleSelectChange = (e) => {
        const val = e.target.value;
        if (val === "custom") {
            setInputMode("custom");
            setCouponInput("");
        } else {
            setInputMode("select");
            setCouponInput(val);
            // Auto-apply if not empty default
            if (val) applyCoupon(val);
        }
    };

    return (
        <div className="space-y-4">
            {/* Coupon Input Section */}
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
                            onClick={() => {
                                removeCoupon();
                                setInputMode("select");
                                setCouponInput("");
                            }}
                            className="text-[11px] text-red-500 font-semibold hover:underline"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {/* Dropdown for available coupons */}
                        {availableCoupons.length > 0 && inputMode === "select" && (
                            <div className="relative">
                                <select
                                    className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200 bg-white appearance-none cursor-pointer"
                                    onChange={handleSelectChange}
                                    value={couponInput}
                                >
                                    <option value="">-- Select an offer --</option>
                                    {availableCoupons.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} - {c.description || (c.type === 'percent' ? `${c.value}% Off` : `₹${c.value} Off`)}
                                        </option>
                                    ))}
                                    <option disabled>──────────</option>
                                    <option value="custom">Enter Custom Code...</option>
                                </select>
                                {/* Arrow Icon */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        )}

                        {/* Manual Input */}
                        {(availableCoupons.length === 0 || inputMode === "custom") && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                    placeholder="Enter coupon code"
                                    className="flex-1 text-sm border border-stone-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                                    autoFocus={inputMode === "custom"}
                                />
                                {inputMode === "custom" && availableCoupons.length > 0 && (
                                    <button 
                                        onClick={() => setInputMode("select")}
                                        className="px-3 py-2 border border-stone-200 text-stone-500 text-xs font-bold rounded-lg hover:bg-stone-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => couponInput && applyCoupon(couponInput)}
                                    disabled={!couponInput || loading}
                                    className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Auto-Applied Info */}
                {autoCouponCode && !couponCode && (
                    <div className="text-[11px] text-green-700 bg-green-50/50 p-2 rounded border border-green-100">
                        Automatic offer <span className="font-semibold">{autoCouponCode}</span>{" "}
                        applied: -₹{autoDiscount.toFixed(0)}
                    </div>
                )}
            </div>

            {/* Free gift section */}
            {giftItems.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs text-orange-800">
                    <div className="font-bold mb-1">🎁 Free Gift Added</div>
                    {giftItems.map((g) => (
                        <div key={g.id} className="flex justify-between">
                            <span>{g.product_id}</span>
                            <span className="font-semibold">Free</span>
                        </div>
                    ))}
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