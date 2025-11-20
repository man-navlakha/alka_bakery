// src/Context/CartDrawerContext.jsx
import React, { createContext, useContext, useState } from "react";

const CartDrawerContext = createContext(null);

export function CartDrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = {
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((prev) => !prev),
  };

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) {
    throw new Error("useCartDrawer must be used inside CartDrawerProvider");
  }
  return ctx;
}
