import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem("cart") || "[]"));
  const navigate = useNavigate();
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => navigate("/checkout");

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">Cart</h2>
      {cart.length === 0 ? <p>Cart is empty</p> : (
        <>
          <ul className="space-y-2">
            {cart.map(item => (
              <li key={item.id} className="flex justify-between border p-2 rounded">
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-bold text-lg">Total: ₹{total}</p>
          <button onClick={handleCheckout} className="mt-4 bg-pink-500 text-white px-4 py-2 rounded">Checkout</button>
        </>
      )}
    </div>
  );
}
