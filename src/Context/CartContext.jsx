// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";
const CART_ID_KEY = "alka_cart_id";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);   // full cart object from API
  const [cartId, setCartId] = useState(() => localStorage.getItem(CART_ID_KEY) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load cart on first mount
  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCart() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          ...(cartId ? { "x-cart-id": cartId } : {}),
        },
        credentials: "include", // if you use cookies for auth, keep this
      });

      const newCartId = res.headers.get("x-cart-id");
      if (newCartId) {
        setCartId(newCartId);
        localStorage.setItem(CART_ID_KEY, newCartId);
      }

      if (!res.ok) {
        const text = await res.text();
        console.error("loadCart error:", res.status, text);
        throw new Error("Failed to load cart");
      }

      const data = await res.json();
      setCart(data);
    } catch (e) {
      console.warn("loadCart failed:", e);
      setError(e.message || "Failed to load cart");
      setCart(null);
    } finally {
      setLoading(false);
    }
  }

  function syncCartFromResponse(res, data) {
    const newCartId = res.headers.get("x-cart-id");
    if (newCartId) {
      setCartId(newCartId);
      localStorage.setItem(CART_ID_KEY, newCartId);
    }
    setCart(data);
  }

  // ---- API helpers ----

  // product = full product object from ShopWithApi
  async function addProduct(product, opts = {}) {
  if (!product) return;
  const unit = product.unit;
  const qty = opts.qty || 1;

  let body = {
    product_id: product.id,
    unit,
    quantity: qty,
  };

  if (unit === "gm") {
    body.grams = opts.grams || 100;
  } else if (unit === "variant") {
    const option = opts.option || product.unit_options?.[0];
    body.variant_label = option?.label;
  }

  setLoading(true);
  setError("");

  try {
    const res = await fetch(`${API_BASE}/api/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(cartId ? { "x-cart-id": cartId } : {}),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("addProduct error:", res.status, text);
      throw new Error("Failed to add item");
    }

    const data = text ? JSON.parse(text) : null;

    // 🔍 Detect if backend returned the *full cart* or just a single item
    const looksLikeFullCart =
      data &&
      (Array.isArray(data.items) ||
        Array.isArray(data.cart_items) ||
        "grand_total" in data ||
        "subtotal" in data);

    if (looksLikeFullCart) {
      syncCartFromResponse(res, data);
    } else {
      // Probably returned the added item only → keep cartId, then reload full cart
      const newCartId = res.headers.get("x-cart-id");
      if (newCartId) {
        setCartId(newCartId);
        localStorage.setItem(CART_ID_KEY, newCartId);
      }
      await loadCart();
    }
  } catch (e) {
    console.error("addProduct failed:", e);
    setError(e.message || "Failed to add item");
  } finally {
    setLoading(false);
  }
}


  async function updateItemQuantity(itemId, newQty) {
    if (!itemId) return;
    const q = Math.max(1, Number(newQty) || 1);

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(cartId ? { "x-cart-id": cartId } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ quantity: q }),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("updateItemQuantity error:", res.status, text);
        throw new Error("Failed to update item");
      }

      const data = text ? JSON.parse(text) : null;
      syncCartFromResponse(res, data);
    } catch (e) {
      console.error("updateItemQuantity failed:", e);
      setError(e.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(itemId) {
    if (!itemId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart/items/${itemId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          ...(cartId ? { "x-cart-id": cartId } : {}),
        },
        credentials: "include",
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("removeItem error:", res.status, text);
        throw new Error("Failed to remove item");
      }

      const data = text ? JSON.parse(text) : null;
      syncCartFromResponse(res, data);
    } catch (e) {
      console.error("removeItem failed:", e);
      setError(e.message || "Failed to remove item");
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
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(cartId ? { "x-cart-id": cartId } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("applyCoupon error:", res.status, text);
        throw new Error("Failed to apply coupon");
      }

      const data = text ? JSON.parse(text) : null;
      syncCartFromResponse(res, data);
    } catch (e) {
      console.error("applyCoupon failed:", e);
      setError(e.message || "Failed to apply coupon");
    } finally {
      setLoading(false);
    }
  }

  async function removeCoupon() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart/coupon`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          ...(cartId ? { "x-cart-id": cartId } : {}),
        },
        credentials: "include",
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("removeCoupon error:", res.status, text);
        throw new Error("Failed to remove coupon");
      }

      const data = text ? JSON.parse(text) : null;
      syncCartFromResponse(res, data);
    } catch (e) {
      console.error("removeCoupon failed:", e);
      setError(e.message || "Failed to remove coupon");
    } finally {
      setLoading(false);
    }
  }

  // Derived values
  const items = cart?.items || cart?.cart_items || [];
  const itemCount = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const subtotal = Number(cart?.subtotal || 0);
  const grandTotal = Number(cart?.grand_total || subtotal);
  const discountTotal = Number(cart?.discount_total || 0);

  const value = {
    cart,
    items,
    itemCount,
    subtotal,
    grandTotal,
    discountTotal,
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
