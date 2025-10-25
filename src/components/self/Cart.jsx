import React from "react";
import { useCart } from "../../Context/CartContext";

export default function CartPage() {
  const { cart, total, updateQuantity, removeItem } = useCart();

  const checkout = () => (window.location.href = "/checkout");

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">Cart</h2>
      {cart.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        <>
          <ul className="space-y-2">
            {cart.map(item => (
              <li key={item.id} className="flex justify-between border p-2 rounded">
                <div>
                  {item.name} x {item.quantity}
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="ml-2 px-2">-</button>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2">+</button>
                  <button onClick={() => removeItem(item.id)} className="ml-2 text-red-500 text-xs">Remove</button>
                </div>
                <div>₹{item.price * item.quantity}</div>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-bold text-lg">Total: ₹{total}</p>
          <button onClick={checkout} className="mt-4 bg-pink-500 text-white px-4 py-2 rounded">Checkout</button>
        </>
      )}
    </div>
  );
}
