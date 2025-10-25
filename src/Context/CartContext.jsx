import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "./apiFetch";
import { toast } from "sonner";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const loadCart = async () => {
    try {
      const data = await apiFetch("http://localhost:3000/api/cart"); // full URL
      // Ensure cart is always an array
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCart([]);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (product) => {
    try {
      await apiFetch("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        headers: { "Content-Type": "application/json" },
      });
      toast.success(`${product.name} added to cart`);
      await loadCart();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  const updateQuantity = async (id, quantity) => {
    try {
      await apiFetch(`http://localhost:3000/api/cart/${id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
        headers: { "Content-Type": "application/json" },
      });
      await loadCart();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (id) => {
    try {
      await apiFetch(`http://localhost:3000/api/cart/${id}`, { method: "DELETE" });
      toast.success("Item removed from cart");
      await loadCart();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  // Safe total calculation
  const total = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
    : 0;

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeItem, total, loadCart }}>
      {children}
    </CartContext.Provider>
  );
};
