import React from "react";
import { useCart } from "../context/CartContext";
import { Button } from "@/components/ui/button";

export default function CartPreview({ open = false, onClose }) {
  const { cart, updateQuantity, removeItem, total } = useCart();

  const checkout = () => (window.location.href = "/checkout");

  return (
    <div className={`fixed top-0 right-0 h-full w-full lg:w-96 z-50 transform ${open ? "translate-x-0" : "translate-x-full"} transition-transform duration-300`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 h-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Cart</h3>
          <button onClick={onClose} className="text-zinc-500">Close</button>
        </div>

        {cart.length === 0 ? (
          <p className="text-center text-zinc-500 mt-10">Your cart is empty.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {cart.map(item => (
                <li key={item.id} className="flex items-center gap-3">
                  <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} className="w-16 h-12 object-cover rounded" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">{item.name}</div>
                      <div className="font-semibold">₹{item.price * item.quantity}</div>
                    </div>
                    <div className="text-xs text-gray-500">Qty:
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="ml-2 px-2">-</button>
                      <span className="mx-1">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2">+</button>
                      <button onClick={() => removeItem(item.id)} className="ml-4 text-red-500 text-xs">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <div className="flex justify-between font-semibold mb-4">
                <div>Subtotal</div>
                <div>₹{total}</div>
              </div>
              <Button onClick={checkout} className="w-full bg-pink-600 text-white">Proceed to Checkout</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
