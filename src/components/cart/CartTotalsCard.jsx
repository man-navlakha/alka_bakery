// src/components/cart/CartTotalsCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import toast, { Toaster } from "react-hot-toast";
import { useCart } from "../../Context/CartContext";
import { Separator } from "../ui/separator";
import { useNavigate } from "react-router-dom";

export default function CartTotalsCard({ showCheckoutButton = true, products = [] }) {
  const {
    subtotal: ctxSubtotal,
    discountTotal: ctxDiscountTotal = 0,
    couponCode = "",
    couponDiscount = 0,
    autoCouponCode,
    autoDiscount = 0,
    items = [],
    giftItems = [],
    availableCoupons = [],
    applyCoupon,
    removeCoupon,
    loading = false,
  } = useCart();
  
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState("select"); 
  const [couponInput, setCouponInput] = useState("");

  const DELIVERY_CHARGE = 50;

  function parseNumber(value) {
    if (value == null) return 0;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const str = String(value).replace(/[^\d.-]/g, "");
    const n = parseFloat(str);
    return Number.isFinite(n) ? n : 0;
  }

  const realItems = Array.isArray(items) ? items : [];
  const realGifts = Array.isArray(giftItems) ? giftItems : [];

  const itemTotal = useMemo(() => {
    return realItems.reduce((acc, item) => {
      const qty = Number(item?.quantity ?? 1);
      let lineTotal = parseNumber(item?.line_total);
      if (!lineTotal) {
        const unit = parseNumber(item?.price ?? item?.unit_price ?? item?.amount ?? 0);
        lineTotal = unit * (Number.isFinite(qty) ? qty : 1);
      }
      if (!lineTotal && item?.price && qty) {
        lineTotal = parseNumber(item.price) * qty;
      }
      return acc + (Number.isFinite(lineTotal) ? lineTotal : 0);
    }, 0);
  }, [realItems]);

  const discountTotal = Number(ctxDiscountTotal || 0);
  const grandTotal = Math.max(0, itemTotal - discountTotal);
  const finalPayable = Number.isFinite(grandTotal + DELIVERY_CHARGE) ? grandTotal + DELIVERY_CHARGE : 0;

  const fmt = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;

  useEffect(() => {
    if (couponCode) {
      setCouponInput(couponCode);
      setInputMode("select");
    }
  }, [couponCode]);

  const tryApplyCoupon = async (code) => {
    if (!code) return;
    try {
      await applyCoupon(code);
      toast.success(`Coupon ${code.toUpperCase()} applied`);
      setCouponInput(code.toUpperCase());
      setInputMode("select");
    } catch (err) {
      const serverMsg = err?.message || err?.response?.data?.message || "Failed to apply coupon";
      console.error("applyCoupon failed:", err);
      toast.error(serverMsg);
    }
  };

  const handleSelectChange = async (e) => {
    const val = e.target.value;
    if (val === "custom") {
      setInputMode("custom");
      setCouponInput("");
      return;
    }
    setInputMode("select");
    setCouponInput(val || "");
    if (val) await tryApplyCoupon(val);
  };

  const handleApplyClick = async () => {
    if (!couponInput) return;
    await tryApplyCoupon(couponInput.trim().toUpperCase());
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success("Coupon removed");
      setCouponInput("");
      setInputMode(availableCoupons.length > 0 ? "select" : "custom");
    } catch (err) {
      toast.error(err?.message ?? "Failed to remove coupon");
    }
  };

  const getProductName = (item) => {
    if (!products || products.length === 0) return item?.name || "Item";
    const candidate = item?.product_id ?? item?.id ?? item?.sku ?? item?.name;
    const found = products.find((p) => String(p.id) === String(candidate));
    if (found) return found.name || String(candidate);
    return item?.name || candidate || "Item";
  };

  const combinedItems = useMemo(() => [...realItems, ...realGifts], [realItems, realGifts]);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="space-y-6 font-sans">
        {/* Coupons */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Offers & Coupons</label>
          {couponCode ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 transition-all">
              <div className="text-xs">
                <div className="font-bold text-green-800 flex items-center gap-2">
                  <span>{couponCode}</span>
                  <span className="text-green-600 text-[10px] font-normal">(Applied)</span>
                </div>
                <div className="text-green-700 font-medium mt-0.5">You saved {fmt(couponDiscount)}</div>
              </div>
              <button onClick={handleRemoveCoupon} className="text-xs text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableCoupons && availableCoupons.length > 0 && inputMode === "select" && (
                <div className="relative">
                  <select className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-orange-200 bg-white appearance-none cursor-pointer transition-shadow" onChange={handleSelectChange} value={couponInput || ""}>
                    <option value="">Select a coupon to save</option>
                    {availableCoupons.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.description || (c.type === "percent" ? `${c.value}% Off` : `₹${c.value} Off`)}</option>
                    ))}
                    <option disabled>──────────</option>
                    <option value="custom">Enter Custom Code...</option>
                  </select>
                </div>
              )}
              {(availableCoupons.length === 0 || inputMode === "custom") && (
                <div className="flex gap-2">
                  <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="flex-1 text-sm border border-stone-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-orange-200 transition-shadow" autoFocus={inputMode === "custom"} />
                  {inputMode === "custom" && availableCoupons.length > 0 && (
                    <button onClick={() => { setInputMode("select"); setCouponInput(""); }} className="px-3 border border-stone-200 text-stone-500 text-xs font-bold rounded-lg hover:bg-stone-50 transition-colors">Cancel</button>
                  )}
                  <button onClick={handleApplyClick} disabled={!couponInput || loading} className="px-5 bg-stone-900 text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-stone-800 transition-colors">
                    {loading ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>
          )}
          {autoCouponCode && !couponCode && (
            <div className="flex items-center justify-between text-xs text-stone-700 bg-yellow-50 p-2.5 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-2">
                <span className="font-bold">{autoCouponCode}</span>
                <span className="text-[11px] opacity-80">Available</span>
                {autoDiscount > 0 && <span className="ml-2 text-green-700 text-[11px]">Save {fmt(autoDiscount)}</span>}
              </div>
              <button onClick={() => tryApplyCoupon(autoCouponCode)} className="px-3 py-1 text-xs bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 disabled:opacity-50" disabled={loading}>Apply</button>
            </div>
          )}
        </div>

        <Separator className="bg-stone-100" />

        {/* Bill details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide">Bill Details</h3>
          <div className="space-y-2">
            {combinedItems.length === 0 ? <div className="text-sm text-stone-500">No items in cart.</div> : combinedItems.map((item, idx) => {
                const key = item?.id ?? item?.product_id ?? `cart-item-${idx}`;
                const isGift = Boolean(item?.is_gift);
                const qty = Number(item?.quantity ?? 1);
                const computedLine = isGift ? 0 : parseNumber(item?.line_total) || parseNumber(item?.price) * (Number.isFinite(qty) ? qty : 1) || 0;
                return (
                  <div key={key} className="flex justify-between text-sm text-stone-600 items-start">
                    <div className="flex gap-2 max-w-[70%]">
                      <div className="h-5 w-5 flex items-center justify-center bg-stone-100 rounded text-[10px] font-bold shrink-0 text-stone-500">{qty}x</div>
                      <span className="truncate">{getProductName(item)}</span>
                      {isGift && <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide self-start mt-0.5">Free</span>}
                    </div>
                    <div className="font-medium text-stone-900">{isGift ? <span className="text-green-600">FREE</span> : fmt(computedLine)}</div>
                  </div>
                );
              })}
          </div>
          <div className="h-px bg-stone-100 my-2" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600"><span>Item Total</span><span>{fmt(itemTotal)}</span></div>
            {discountTotal > 0 && <div className="flex justify-between text-green-700 font-medium"><span>Total Savings</span><span>-{fmt(discountTotal)}</span></div>}
            <div className="flex justify-between text-stone-600"><span>Delivery Fee</span><span>{fmt(DELIVERY_CHARGE)}</span></div>
          </div>
          <Separator className="bg-stone-200 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-stone-900">To Pay</span>
            <span className="text-lg font-bold text-stone-900">{fmt(finalPayable)}</span>
          </div>
        </div>

        {showCheckoutButton && (
          <button
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-stone-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-between px-6 items-center group"
            disabled={combinedItems.length === 0 || loading}
            onClick={() => navigate("/checkout")}
          >
            <span>Proceed to Checkout</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm group-hover:bg-white/30 transition-colors">{fmt(finalPayable)}</span>
          </button>
        )}
      </div>
    </>
  );
}

CartTotalsCard.propTypes = {
  showCheckoutButton: PropTypes.bool,
  products: PropTypes.array,
};