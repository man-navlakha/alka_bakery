// src/Context/CartContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider"; // 1. Import useAuth

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";
const CART_ID_KEY = "alka_cart_id";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user } = useAuth(); // 2. Get user status
    const [cart, setCart] = useState(null);
    const [cartId, setCartId] = useState(() => localStorage.getItem(CART_ID_KEY) || null);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 3. Add 'user' to dependency array so cart reloads/merges on login
    useEffect(() => {
        loadCart();
        loadCoupons();
    }, [user]); 

    const getCommonHeaders = () => {
        const token = localStorage.getItem("accessToken");
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(cartId ? { "x-cart-id": cartId } : {}),
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        };
    };

    function updateCartId(res, data) {
        let newId = res.headers.get("x-cart-id");
        if (!newId && data && data.id) newId = data.id;
        if (newId && newId !== cartId) {
            setCartId(newId);
            localStorage.setItem(CART_ID_KEY, newId);
        }
    }

    async function loadCoupons() {
        try {
            const res = await fetch(`${API_BASE}/api/cart/coupons`);
            if (res.ok) {
                const data = await res.json();
                setAvailableCoupons(data || []);
            }
        } catch (e) {
            console.warn("Failed to load available coupons", e);
        }
    }

    async function loadCart() {
        setLoading(true);
        try {
            const headers = getCommonHeaders();
            delete headers["Content-Type"];

            const res = await fetch(`${API_BASE}/api/cart`, {
                method: "GET",
                headers: headers,
                credentials: "include",
            });

            if (res.status === 404) {
                localStorage.removeItem(CART_ID_KEY);
                setCartId(null);
                setCart(null);
                return;
            }
            if (!res.ok) throw new Error("Failed to load cart");

            const data = await res.json();
            updateCartId(res, data);
            setCart(data);
        } catch (e) {
            // Don't log error if it's just a 404/empty state initially
            console.warn("loadCart info:", e.message);
            setCart(null);
        } finally {
            setLoading(false);
        }
    }

    function syncCartFromResponse(res, data) {
        updateCartId(res, data);
        setCart(data);
    }

    async function addProduct(product, opts = {}) {
        if (!product) return;
        const unit = product.unit;
        const qty = opts.qty || 1;

        let body = {
            product_id: product.id,
            unit,
            quantity: qty,
        };

        if (unit === "gm") body.grams = opts.grams || 100;
        else if (unit === "variant") body.variant_label = opts.option?.label || product.unit_options?.[0]?.label;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/cart/items`, {
                method: "POST",
                headers: getCommonHeaders(),
                credentials: "include",
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to add item");
            const data = await res.json();

            if (data && (Array.isArray(data.items) || "grand_total" in data)) {
                syncCartFromResponse(res, data);
            } else {
                updateCartId(res, data);
                await loadCart();
            }
        } catch (e) {
            console.error("addProduct failed:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateItemQuantity(itemId, newQty) {
        if (!itemId) return;
        
        // Optimistic Update (Optional, keeping simple for now)
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/cart/items/${itemId}`, {
                method: "PATCH",
                headers: getCommonHeaders(),
                credentials: "include",
                body: JSON.stringify({ quantity: newQty }),
            });

            const text = await res.text();
            if (!res.ok) throw new Error("Failed to update item");

            const data = text ? JSON.parse(text) : null;
            syncCartFromResponse(res, data);
        } catch (e) {
            console.error("updateItemQuantity failed:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function removeItem(itemId) {
        if (!itemId) return;

        setLoading(true);
        setError("");
        try {
            const headers = getCommonHeaders();
            delete headers["Content-Type"];

            const res = await fetch(`${API_BASE}/api/cart/items/${itemId}`, {
                method: "DELETE",
                headers,
                credentials: "include",
            });

            const text = await res.text();
            if (!res.ok) throw new Error("Failed to remove item");

            const data = text ? JSON.parse(text) : null;
            syncCartFromResponse(res, data);
        } catch (e) {
            console.error("removeItem failed:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function applyCoupon(code) {
        if (!code) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/cart/apply-coupon`, {
                method: "POST",
                headers: getCommonHeaders(),
                credentials: "include",
                body: JSON.stringify({ code }),
            });

            const text = await res.text();
            if (!res.ok) {
                let errData = {};
                try { errData = text ? JSON.parse(text) : {}; } catch (parseErr) { /* ignore */ }
                const msg = errData?.message || errData?.error || `Failed to apply coupon`;
                throw new Error(msg);
            }

            const data = text ? JSON.parse(text) : null;
            syncCartFromResponse(res, data);
            return data;
        } catch (e) {
            console.error("applyCoupon failed:", e);
            setError(e.message || "Failed to apply coupon");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    async function removeCoupon() {
        setLoading(true);
        setError("");
        try {
            const headers = getCommonHeaders();
            delete headers["Content-Type"];

            const res = await fetch(`${API_BASE}/api/cart/coupon`, {
                method: "DELETE",
                headers,
                credentials: "include",
            });

            const text = await res.text();
            if (!res.ok) throw new Error("Failed to remove coupon");

            const data = text ? JSON.parse(text) : null;
            syncCartFromResponse(res, data);
        } catch (e) {
            console.error("removeCoupon failed:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    const allItems = cart?.items || cart?.cart_items || [];
    const items = allItems.filter((it) => !it.is_gift);
    const giftItems = allItems.filter((it) => it.is_gift);
    const itemCount = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const subtotal = Number(cart?.subtotal || 0);
    const grandTotal = Number(cart?.grand_total || subtotal);
    const discountTotal = Number(cart?.discount_total || 0);
    const couponCode = cart?.coupon_code || "";
    const couponDiscount = Number(cart?.coupon_discount || 0);
    const autoCouponCode = cart?.auto_coupon_code || null;
    const autoDiscount = Number(cart?.auto_discount || 0);
    const freeGiftApplied = !!cart?.free_gift_applied;

    const value = {
        cart,
        items,
        giftItems,
        itemCount,
        subtotal,
        grandTotal,
        discountTotal,
        couponCode,
        couponDiscount,
        autoCouponCode,
        autoDiscount,
        freeGiftApplied,
        availableCoupons,
        loading,
        error,
        addProduct,
        updateItemQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        reloadCart: loadCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return ctx;
}